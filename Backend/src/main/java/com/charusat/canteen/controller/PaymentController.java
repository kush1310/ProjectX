package com.charusat.canteen.controller;

import com.charusat.canteen.dto.PaymentDTOs.*;
import com.charusat.canteen.model.PaymentOrder;
import com.charusat.canteen.service.PaymentService;
import com.charusat.canteen.service.RateLimiterService;
import com.charusat.canteen.service.UserService;
import com.charusat.canteen.model.User;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Payment Controller — Razorpay payment endpoints.
 * 
 * Security:
 * - keySecret is NEVER included in any response
 * - All payment amounts in paise (integer)
 * - Rate limited: 10 req/min for order creation, 5 req/min for VPA validation
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PaymentController {

    private final PaymentService paymentService;
    private final RateLimiterService rateLimiterService;
    private final UserService userService;

    /**
     * POST /api/payments/create-order
     * Create a Razorpay order for the given amount.
     * Rate limited: max 10 requests/minute per user.
     */
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody CreatePaymentOrderRequest request, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Authentication required"));
            }

            String email = principal.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Rate limit check: 10 req/min per user
            String rateLimitKey = "payment:create:" + user.getId();
            if (!rateLimiterService.isAllowed(rateLimitKey, 10, 60)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("success", false, "message", "Too many payment requests. Please wait."));
            }

            CreatePaymentOrderResponse response = paymentService.createOrder(request, user.getId());
            return ResponseEntity.ok(Map.of("success", true, "data", response));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        } catch (RazorpayException e) {
            log.error("Razorpay error creating order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("success", false, "message", "Payment gateway error. Please try again."));
        } catch (Exception e) {
            log.error("Error creating payment order: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "An unexpected error occurred."));
        }
    }

    /**
     * POST /api/payments/verify
     * Verify Razorpay payment signature (HMAC-SHA256 timing-safe).
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody VerifyPaymentRequest request, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Authentication required"));
            }

            VerifyPaymentResponse response = paymentService.verifyPayment(request);

            if (response.verified()) {
                return ResponseEntity.ok(Map.of("success", true, "data", response));
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", response.message()));
            }
        } catch (Exception e) {
            log.error("Error verifying payment: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Verification failed."));
        }
    }

    /**
     * POST /api/payments/validate-vpa
     * Validate a UPI VPA (Virtual Payment Address).
     * Rate limited: max 5 requests/minute per user.
     */
    @PostMapping("/validate-vpa")
    public ResponseEntity<?> validateVpa(@RequestBody VpaValidationRequest request, Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Authentication required"));
            }

            String email = principal.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Rate limit: 5 VPA validations per minute per user
            String rateLimitKey = "vpa:validate:" + user.getId();
            if (!rateLimiterService.isAllowed(rateLimitKey, 5, 60)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("success", false, "message", "Too many validation requests."));
            }

            // Regex validation first
            String vpa = request.vpa();
            if (vpa == null || !vpa.matches("^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "valid", false, "message", "Invalid UPI ID format"));
            }

            // In production, this would call razorpayClient.validateVpa(vpa)
            // For test mode, we return a mock validation
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "valid", true,
                    "name", "Test User"
            ));

        } catch (Exception e) {
            log.error("VPA validation error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Validation error."));
        }
    }

    /**
     * GET /api/payments/status/{razorpayOrderId}
     * Poll payment status (for QR/UPI collect flow).
     */
    @GetMapping("/status/{razorpayOrderId}")
    public ResponseEntity<?> getPaymentStatus(@PathVariable String razorpayOrderId) {
        try {
            PaymentStatusResponse response = paymentService.getPaymentStatus(razorpayOrderId);
            return ResponseEntity.ok(Map.of("success", true, "data", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("success", false, "message", "Payment order not found"));
        }
    }

    /**
     * GET /api/payments/orders
     * Get payment order history for the authenticated user.
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getOrderHistory(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            String email = principal.getName();
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<PaymentOrder> orders;
            if (user.getRole() == User.UserRole.ADMIN || user.getRole() == User.UserRole.CANTEEN_OWNER) {
                orders = paymentService.getAllPayments();
            } else {
                orders = paymentService.getOrderHistory(user.getId());
            }

            return ResponseEntity.ok(Map.of("success", true, "data", orders));
        } catch (Exception e) {
            log.error("Error fetching payment history: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to fetch payment history."));
        }
    }

    /**
     * GET /api/payments/analytics
     * Get payment analytics (admin/vendor only).
     */
    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(Principal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            PaymentAnalyticsResponse analytics = paymentService.getAnalytics();
            return ResponseEntity.ok(Map.of("success", true, "data", analytics));
        } catch (Exception e) {
            log.error("Error fetching analytics: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to fetch analytics."));
        }
    }
}
