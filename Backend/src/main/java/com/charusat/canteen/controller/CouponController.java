package com.charusat.canteen.controller;

import com.charusat.canteen.dto.CouponDTOs.*;
import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.service.CouponAnalyticsService;
import com.charusat.canteen.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * CouponController — API endpoints for coupon management.
 *
 * Endpoints:
 * POST /api/coupons/create — Create coupon (Admin/Vendor)
 * PUT /api/coupons/{id}/update — Update coupon
 * GET /api/coupons/active — Active coupons (public for users)
 * GET /api/coupons/all — All coupons (admin)
 * POST /api/coupons/validate — Validate & calculate discount
 * GET /api/coupons/analytics — Analytics with filters
 * GET /api/coupons/calendar — Calendar view
 * GET /api/coupons/dashboard — Dashboard summary
 * DELETE /api/coupons/{id} — Delete coupon
 * PUT /api/coupons/{id}/toggle — Toggle active/inactive
 */
@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@Slf4j
public class CouponController {

    private final CouponService couponService;
    private final CouponAnalyticsService analyticsService;

    // ===== CREATE =====

    @PostMapping("/create")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")
    public ResponseEntity<?> createCoupon(@Valid @RequestBody CreateCouponRequest request) {
        log.info("Creating coupon: {} (type: {})", request.getCouponCode(), request.getCouponType());
        try {
            CouponResponse response = couponService.createCoupon(request);
            return ResponseEntity.ok(response);
        } catch (com.charusat.canteen.exception.BadRequestException e) {
            log.warn("Coupon creation rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Coupon creation failed for code '{}': {}", request.getCouponCode(), e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "Internal server error creating coupon";
            return ResponseEntity.status(500).body(java.util.Map.of("success", false, "message", msg));
        }
    }

    // ===== UPDATE =====

    @PutMapping("/{id}/update")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")
    public ResponseEntity<?> updateCoupon(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCouponRequest request) {
        log.info("Updating coupon: {}", id);
        try {
            CouponResponse response = couponService.updateCoupon(id, request);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Coupon update failed for id '{}': {}", id, e.getMessage(), e);
            String msg = e.getMessage() != null ? e.getMessage() : "Internal server error updating coupon";
            return ResponseEntity.status(500).body(java.util.Map.of("success", false, "message", msg));
        }
    }

    // ===== GET ACTIVE (public) =====

    @GetMapping("/active")
    public ResponseEntity<List<CouponResponse>> getActiveCoupons(
            @RequestParam(required = false) Long canteenId) {
        List<CouponResponse> coupons = couponService.getActiveCoupons(canteenId);
        return ResponseEntity.ok(coupons);
    }

    // ===== GET ALL (admin) =====

    @GetMapping("/all")
    public ResponseEntity<org.springframework.data.domain.Page<CouponResponse>> getAllCoupons(
            @RequestParam(required = false) Long canteenId,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.domain.Page<CouponResponse> coupons = couponService.getAllCoupons(canteenId, pageable);
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/track")
    public ResponseEntity<List<CouponResponse>> getTrackCoupons(
            @RequestParam(required = false) Long canteenId,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) Coupon.CouponType couponType,
            @RequestParam(required = false) Coupon.OfferCategory offerCategory) {
        List<CouponResponse> coupons = couponService.getTrackCoupons(canteenId, status, couponType, offerCategory);
        return ResponseEntity.ok(coupons);
    }

    // ===== VALIDATE & SUGGEST =====

    @PostMapping("/validate")
    public ResponseEntity<ValidationResult> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request) {
        log.info("Validating coupon: {} for user: {}", request.getCouponCode(), request.getUserId());
        ValidationResult result = couponService.validateCoupon(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/suggest")
    public ResponseEntity<ValidationResult> suggestBestCoupon(
            @Valid @RequestBody ValidateCouponRequest request) {
        log.info("Suggesting best coupon for user: {}", request.getUserId());
        ValidationResult result = couponService.suggestBestCoupon(request);
        return ResponseEntity.ok(result);
    }

    // ===== ANALYTICS =====

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @RequestParam(required = false, defaultValue = "MONTHLY") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        AnalyticsResponse analytics = analyticsService.getAnalytics(period, startDate, endDate);
        return ResponseEntity.ok(analytics);
    }

    // ===== CALENDAR =====

    @GetMapping("/calendar")
    public ResponseEntity<CalendarResponse> getCalendar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CalendarResponse calendar = couponService.getCalendar(startDate, endDate);
        return ResponseEntity.ok(calendar);
    }

    // ===== DASHBOARD =====

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> getDashboard() {
        DashboardResponse dashboard = couponService.getDashboard();
        return ResponseEntity.ok(dashboard);
    }

    // ===== DELETE =====

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")
    public ResponseEntity<Void> deleteCoupon(@PathVariable UUID id) {
        log.info("Deleting coupon: {}", id);
        couponService.deleteCoupon(id);
        return ResponseEntity.ok().build();
    }

    // ===== TOGGLE =====

    @PutMapping("/{id}/toggle")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")
    public ResponseEntity<CouponResponse> toggleCoupon(@PathVariable UUID id) {
        log.info("Toggling coupon: {}", id);
        CouponResponse response = couponService.toggleCoupon(id);
        return ResponseEntity.ok(response);
    }

    // ===== SYSTEM OFFERS =====

    @GetMapping("/system-offers")
    public ResponseEntity<List<CouponResponse>> getSystemOffers() {
        List<CouponResponse> offers = couponService.getSystemOffers();
        return ResponseEntity.ok(offers);
    }

    // ===== HISTORY =====

    @GetMapping("/history")
    public ResponseEntity<List<CouponResponse>> getHistory() {
        List<CouponResponse> history = couponService.getHistory();
        return ResponseEntity.ok(history);
    }

    // ===== RESTORE =====

    @PutMapping("/{id}/restore")
    public ResponseEntity<CouponResponse> restoreCoupon(
            @PathVariable UUID id,
            @Valid @RequestBody RestoreCouponRequest request) {
        log.info("Restoring coupon: {} with new dates", id);
        CouponResponse response = couponService.restoreCoupon(id, request);
        return ResponseEntity.ok(response);
    }

    // ===== ARCHIVE =====

    @PutMapping("/{id}/archive")
    public ResponseEntity<Void> archiveCoupon(@PathVariable UUID id) {
        log.info("Archiving coupon: {}", id);
        couponService.archiveCoupon(id);
        return ResponseEntity.ok().build();
    }
}
