package com.charusat.canteen.service;

import com.charusat.canteen.config.RazorpayConfig;
import com.charusat.canteen.dto.PaymentDTOs.*;
import com.charusat.canteen.model.OrderItem;
import com.charusat.canteen.model.PaymentOrder;
import com.charusat.canteen.model.PaymentOrder.PaymentOrderStatus;
import com.charusat.canteen.repository.OrderItemRepository;
import com.charusat.canteen.repository.OrderRepository;
import com.charusat.canteen.repository.PaymentOrderRepository;
import com.charusat.canteen.repository.UserRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Core payment service — handles Razorpay order creation, signature verification,
 * VPA validation, and payment analytics.
 *
 * Security invariants:
 * - Key secret NEVER appears in any return value
 * - Signature comparison is ALWAYS timing-safe (MessageDigest.isEqual)
 * - All amounts are in paise (integer), never floats
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final PaymentOrderRepository paymentOrderRepository;
    private final RazorpayConfig razorpayConfig;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;


    /**
     * Create a Razorpay order — idempotent via idempotencyKey.
     */
    public CreatePaymentOrderResponse createOrder(CreatePaymentOrderRequest request, Long userId) throws RazorpayException {
        // Validate amount: min ₹1 (100 paise), max ₹5,00,000 (50000000 paise)
        if (request.amount() == null || request.amount() < 100 || request.amount() > 50000000) {
            throw new IllegalArgumentException("Amount must be between 100 and 50000000 paise (₹1 to ₹5,00,000)");
        }
        if (!"INR".equals(request.currency())) {
            throw new IllegalArgumentException("Currency must be INR");
        }

        // Idempotency check — return existing order if found
        if (request.idempotencyKey() != null) {
            Optional<PaymentOrder> existing = paymentOrderRepository.findByIdempotencyKey(request.idempotencyKey());
            if (existing.isPresent()) {
                PaymentOrder existingOrder = existing.get();
                log.info("Returning existing payment order for idempotency key: {}", maskId(request.idempotencyKey()));
                return new CreatePaymentOrderResponse(
                        existingOrder.getRazorpayOrderId(),
                        existingOrder.getAmountInPaise(),
                        existingOrder.getCurrency(),
                        razorpayConfig.getKeyId()
                );
            }
        }

        // Create Razorpay order via SDK
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", request.amount());
        orderRequest.put("currency", request.currency());
        orderRequest.put("receipt", "food_order_" + (request.foodOrderId() != null ? request.foodOrderId() : "pending"));

        Order razorpayOrder = razorpayClient.orders.create(orderRequest);
        String razorpayOrderId = razorpayOrder.get("id");

        log.info("Created Razorpay order: {} for amount: {} paise, user: {}",
                maskId(razorpayOrderId), request.amount(), userId);

        // Save to DB
        PaymentOrder paymentOrder = PaymentOrder.builder()
                .razorpayOrderId(razorpayOrderId)
                .amountInPaise(request.amount())
                .currency(request.currency())
                .status(PaymentOrderStatus.CREATED)
                .userId(userId)
                .foodOrderId(request.foodOrderId())
                .idempotencyKey(request.idempotencyKey())
                .createdAt(LocalDateTime.now())
                .build();

        paymentOrderRepository.save(paymentOrder);

        // Return — NEVER include keySecret
        return new CreatePaymentOrderResponse(
                razorpayOrderId,
                request.amount(),
                request.currency(),
                razorpayConfig.getKeyId()
        );
    }

    /**
     * Verify payment signature using HMAC-SHA256.
     * Uses MessageDigest.isEqual() for timing-safe comparison.
     */
    public VerifyPaymentResponse verifyPayment(VerifyPaymentRequest request) {
        try {
            String data = request.razorpayOrderId() + "|" + request.razorpayPaymentId();
            String keySecret = razorpayConfig.getKeySecret();

            // Compute HMAC-SHA256
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(keySecret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes("UTF-8"));
            String computedSignature = bytesToHex(hash);

            // TIMING-SAFE comparison — NEVER use .equals()
            boolean isValid = MessageDigest.isEqual(
                    computedSignature.getBytes("UTF-8"),
                    request.razorpaySignature().getBytes("UTF-8")
            );

            if (isValid) {
                log.info("Payment verified successfully: order={}, payment={}",
                        maskId(request.razorpayOrderId()), maskId(request.razorpayPaymentId()));

                // Update payment order status to CAPTURED
                paymentOrderRepository.updateStatusByRazorpayOrderId(
                        request.razorpayOrderId(),
                        PaymentOrderStatus.CAPTURED.name(),
                        request.razorpayPaymentId()
                );

                // Single lookup: mark order as PAID, write back the authoritative charged amount,
                // then send confirmation email — all from one paymentOrder fetch.
                try {
                    paymentOrderRepository.findByRazorpayOrderId(request.razorpayOrderId())
                            .ifPresent(paymentOrder -> {
                                if (paymentOrder.getFoodOrderId() == null) return;

                                orderRepository.findById(paymentOrder.getFoodOrderId()).ifPresent(foodOrder -> {
                                    // ── 1. Mark order as PAID ──────────────────────────────────────
                                    foodOrder.setPaymentStatus(com.charusat.canteen.model.Order.PaymentStatus.PAID);

                                    // ── 2. Write back the exact amount Razorpay charged ────────────
                                    // amountInPaise is the single source of truth: it was set by the
                                    // frontend before opening the Razorpay checkout and equals
                                    // (discounted_subtotal + 5% GST) in paise.  Using this avoids any
                                    // re-computation mismatch from missing discount fields on the order.
                                    BigDecimal chargedAmount = BigDecimal.valueOf(paymentOrder.getAmountInPaise())
                                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                                    foodOrder.setTotalAmount(chargedAmount);
                                    foodOrder.setUpdatedAt(LocalDateTime.now());
                                    orderRepository.save(foodOrder);

                                    log.info("Order {} marked PAID — charged amount written back: Rs.{}",
                                            foodOrder.getOrderNumber(), chargedAmount);

                                    // ── 3. Build item description for email ────────────────────────
                                    List<OrderItem> items = orderItemRepository.findByOrderId(foodOrder.getId());
                                    StringBuilder itemDesc = new StringBuilder();
                                    for (OrderItem item : items) {
                                        if (itemDesc.length() > 0) itemDesc.append(", ");
                                        itemDesc.append(item.getQuantity()).append("x ")
                                                .append(item.getMenuItem() != null
                                                        ? item.getMenuItem().getName()
                                                        : "Item");
                                    }

                                    String paymentMethod = foodOrder.getPaymentMethod() != null
                                            ? foodOrder.getPaymentMethod()
                                            : "UPI";

                                    // ── 4. Send confirmation email with the same charged amount ────
                                    if (foodOrder.getCustomerId() != null) {
                                        userRepository.findById(foodOrder.getCustomerId()).ifPresent(customer -> {
                                            emailService.sendOrderConfirmationEmail(
                                                    customer.getEmail(),
                                                    customer.getFullName(),
                                                    foodOrder.getOrderNumber(),
                                                    "Campus Canteen",
                                                    paymentMethod,
                                                    chargedAmount.toPlainString(),
                                                    itemDesc.toString()
                                            );
                                            log.info("Confirmation email sent for order: {}, amount: Rs.{}",
                                                    foodOrder.getOrderNumber(), chargedAmount);
                                        });
                                    }
                                });
                            });
                } catch (Exception postPaymentEx) {
                    // Post-payment processing failures must NEVER fail the verification response
                    log.error("Post-payment processing failed (PAID mark / email): {}", postPaymentEx.getMessage());
                }

                return new VerifyPaymentResponse(true, request.razorpayOrderId(),
                        "CAPTURED", "Payment verified successfully");
            } else {

                log.warn("FRAUD ALERT: Invalid payment signature for order: {}", maskId(request.razorpayOrderId()));

                return new VerifyPaymentResponse(false, request.razorpayOrderId(),
                        "FAILED", "Invalid payment signature");
            }
        } catch (Exception e) {
            log.error("Payment verification error for order {}: {}", maskId(request.razorpayOrderId()), e.getMessage());
            return new VerifyPaymentResponse(false, request.razorpayOrderId(),
                    "FAILED", "Verification error");
        }
    }

    /**
     * Verify webhook signature using webhookSecret.
     */
    public boolean verifyWebhookSignature(String payload, String signature, String webhookSecret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(webhookSecret.getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(payload.getBytes("UTF-8"));
            String computedSignature = bytesToHex(hash);

            return MessageDigest.isEqual(
                    computedSignature.getBytes("UTF-8"),
                    signature.getBytes("UTF-8")
            );
        } catch (Exception e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Get payment status by Razorpay order ID (for polling).
     */
    public PaymentStatusResponse getPaymentStatus(String razorpayOrderId) {
        return paymentOrderRepository.findByRazorpayOrderId(razorpayOrderId)
                .map(po -> new PaymentStatusResponse(
                        po.getRazorpayOrderId(),
                        po.getStatus().name(),
                        po.getRazorpayPaymentId()
                ))
                .orElseThrow(() -> new RuntimeException("Payment order not found: " + maskId(razorpayOrderId)));
    }

    /**
     * Get payment order history for a user.
     */
    public List<PaymentOrder> getOrderHistory(Long userId) {
        return paymentOrderRepository.findByUserId(userId);
    }

    /**
     * Get all payment orders (admin).
     */
    public List<PaymentOrder> getAllPayments() {
        return paymentOrderRepository.findAll();
    }

    /**
     * Get payment analytics summary.
     */
    public PaymentAnalyticsResponse getAnalytics() {
        long totalRevenue = paymentOrderRepository.sumAmountByStatus("CAPTURED");
        long successCount = paymentOrderRepository.countByStatus("CAPTURED");
        long failedCount = paymentOrderRepository.countByStatus("FAILED");
        long totalCount = paymentOrderRepository.count();

        // UPI percentage — approximate based on all non-failed orders
        // In a full implementation we'd track payment method per order
        double upiPct = totalCount > 0 ? 65.0 : 0.0; // Placeholder — would come from actual method tracking

        return new PaymentAnalyticsResponse(
                totalRevenue,
                successCount,
                failedCount,
                upiPct,
                List.of() // Daily revenue would come from an aggregation query
        );
    }

    /**
     * Process webhook event — update payment status.
     */
    public void processWebhookEvent(String eventType, JSONObject payload) {
        try {
            JSONObject paymentEntity = payload.optJSONObject("payload");
            if (paymentEntity == null) return;

            JSONObject payment = paymentEntity.optJSONObject("payment");
            if (payment == null) return;

            JSONObject entity = payment.optJSONObject("entity");
            if (entity == null) return;

            String orderId = entity.optString("order_id", null);
            String paymentId = entity.optString("id", null);

            if (orderId == null) return;

            switch (eventType) {
                case "payment.captured" -> {
                    log.info("Webhook: payment.captured for order {}", maskId(orderId));
                    paymentOrderRepository.updateStatusByRazorpayOrderId(
                            orderId, PaymentOrderStatus.CAPTURED.name(), paymentId);
                }
                case "payment.failed" -> {
                    log.info("Webhook: payment.failed for order {}", maskId(orderId));
                    paymentOrderRepository.updateStatusByRazorpayOrderId(
                            orderId, PaymentOrderStatus.FAILED.name(), paymentId);
                }
                case "order.paid" -> {
                    log.info("Webhook: order.paid for order {}", maskId(orderId));
                    paymentOrderRepository.updateStatusByRazorpayOrderId(
                            orderId, PaymentOrderStatus.CAPTURED.name(), paymentId);
                }
                default -> log.debug("Unhandled webhook event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing webhook event {}: {}", eventType, e.getMessage());
        }
    }

    // ──── Utility methods ─────────────────────────────────

    /**
     * Mask payment ID for logging — show last 4 characters only.
     */
    private String maskId(String id) {
        if (id == null || id.length() <= 4) return "****";
        return "****" + id.substring(id.length() - 4);
    }

    /**
     * Convert byte array to hex string.
     */
    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
