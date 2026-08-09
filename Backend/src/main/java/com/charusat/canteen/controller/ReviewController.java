package com.charusat.canteen.controller;

import com.charusat.canteen.model.Review;
import com.charusat.canteen.service.ReviewService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * ReviewController
 *
 * REST endpoints for customer review submission and vendor reply.
 * Base path: /api/reviews
 *
 * Endpoints:
 *   POST /api/reviews                          — Submit a review for a completed order
 *   GET  /api/reviews/canteen/{canteenId}      — All reviews for a canteen
 *   GET  /api/reviews/canteen/{canteenId}/rating — Avg rating + count
 *   GET  /api/reviews/order/{orderId}          — Check if order has been reviewed
 *   GET  /api/reviews/vendor                   — All reviews for the vendor's canteen (JWT)
 *   GET  /api/reviews/my                       — All reviews by the authenticated customer
 *   PUT  /api/reviews/{reviewId}/reply         — Vendor reply
 *   PUT  /api/reviews/{reviewId}/vendor-reply  — Alias (frontend compat)
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService   userService;

    /**
     * POST /api/reviews
     *
     * Submits a customer review for a completed order. Validates that the order
     * belongs to the authenticated customer and has not yet been reviewed.
     *
     * @param body      {Map}       JSON: orderId (Long), rating (1–5), comment, foodRating,
     *                              packingRating, deliveryRating, isAnonymous.
     * @param principal {Principal} JWT-derived email.
     * @returns 201 with saved review on success; 400 on validation failure.
     */
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> body, Principal principal) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));

            Long    orderId        = body.get("orderId")       != null ? ((Number) body.get("orderId")).longValue()        : null;
            Integer rating         = body.get("rating")        != null ? ((Number) body.get("rating")).intValue()          : null;
            String  comment        = (String) body.get("comment");
            Integer foodRating     = body.get("foodRating")    != null ? ((Number) body.get("foodRating")).intValue()      : null;
            Integer packingRating  = body.get("packingRating") != null ? ((Number) body.get("packingRating")).intValue()   : null;
            Integer deliveryRating = body.get("deliveryRating")!= null ? ((Number) body.get("deliveryRating")).intValue()  : null;
            Boolean isAnonymous    = body.get("isAnonymous") instanceof Boolean b ? b : false;

            if (orderId == null) return ResponseEntity.badRequest().body(Map.of("success", false, "message", "orderId is required"));

            Review review = reviewService.submitReview(user.get().getId(), orderId, rating, comment, foodRating, packingRating, deliveryRating, isAnonymous);
            return ResponseEntity.status(201).body(Map.of("success", true, "review", review));

        } catch (IllegalArgumentException e) {
            log.warn("Review submission rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error submitting review", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to submit review"));
        }
    }

    /** GET /api/reviews/canteen/{canteenId} — all reviews for a public canteen, newest first. */
    @GetMapping("/canteen/{canteenId}")
    public ResponseEntity<org.springframework.data.domain.Page<Review>> getCanteenReviews(
            @PathVariable Long canteenId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(reviewService.getCanteenReviews(canteenId, pageable));
    }

    /** GET /api/reviews/canteen/{canteenId}/rating — live average rating + total count. */
    @GetMapping("/canteen/{canteenId}/rating")
    public ResponseEntity<Map<String, Object>> getCanteenRating(@PathVariable Long canteenId) {
        return ResponseEntity.ok(reviewService.getAverageRating(canteenId));
    }

    /** GET /api/reviews/order/{orderId} — has this order been reviewed? */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderReview(@PathVariable Long orderId) {
        var review = reviewService.getOrderReview(orderId);
        return ResponseEntity.ok(Map.of("reviewed", review.isPresent(), "review", review.orElse(null)));
    }

    /**
     * GET /api/reviews/vendor
     *
     * Returns all reviews for the authenticated vendor's canteen, newest first.
     * The canteen is resolved from the JWT principal via the canteens.owner_id FK.
     *
     * @param principal {Principal} - JWT-derived vendor email.
     * @returns {List<Review>} 200; 401 if user not found.
     */
    @GetMapping("/vendor")
    public ResponseEntity<?> getVendorReviews(
            Principal principal,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            return ResponseEntity.ok(reviewService.getVendorReviews(user.get().getId()));
        } catch (Exception e) {
            log.error("Error fetching vendor reviews", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch reviews"));
        }
    }

    /**
     * GET /api/reviews/my
     *
     * Returns all reviews submitted by the authenticated customer, newest first.
     *
     * @param principal {Principal} - JWT-derived customer email.
     * @returns {List<Review>} 200 with review list.
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyReviews(
            Principal principal,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            return ResponseEntity.ok(reviewService.getCustomerReviews(user.get().getId()));
        } catch (Exception e) {
            log.error("Error fetching customer reviews", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch reviews"));
        }
    }

    /**
     * PUT /api/reviews/{reviewId}/reply
     * PUT /api/reviews/{reviewId}/vendor-reply  — alias for frontend compatibility.
     *
     * Vendor posts a reply to a customer review. Both "reply" and "vendorReply" JSON keys
     * are accepted to avoid frontend/backend key mismatch errors.
     */
    @PutMapping("/{reviewId}/reply")
    public ResponseEntity<?> addVendorReply(@PathVariable Long reviewId,
                                            @RequestBody Map<String, String> body,
                                            Principal principal) {
        return handleVendorReply(reviewId, body, principal);
    }

    @PutMapping("/{reviewId}/vendor-reply")
    public ResponseEntity<?> addVendorReplyAlias(@PathVariable Long reviewId,
                                                  @RequestBody Map<String, String> body,
                                                  Principal principal) {
        return handleVendorReply(reviewId, body, principal);
    }

    private ResponseEntity<?> handleVendorReply(Long reviewId, Map<String, String> body, Principal principal) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
            String replyText = body.getOrDefault("reply", body.get("vendorReply"));
            Review updated = reviewService.addVendorReply(reviewId, user.get().getId(), replyText);
            return ResponseEntity.ok(Map.of("success", true, "review", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error adding vendor reply to review {}", reviewId, e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to save reply"));
        }
    }
}
