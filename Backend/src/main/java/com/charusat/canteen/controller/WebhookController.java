package com.charusat.canteen.controller;

import com.charusat.canteen.config.RazorpayConfig;
import com.charusat.canteen.model.WebhookEvent;
import com.charusat.canteen.repository.WebhookEventRepository;
import com.charusat.canteen.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Webhook Controller — Receives Razorpay webhook events.
 * 
 * Security:
 * - Verifies X-Razorpay-Signature header using webhookSecret
 * - Returns 200 immediately (prevents Razorpay retries)
 * - Processes events asynchronously
 * - Idempotent via webhook_events table (skips duplicates)
 * - CSRF disabled for this endpoint (Razorpay is external)
 * - No JWT required (Razorpay can't add one)
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final PaymentService paymentService;
    private final WebhookEventRepository webhookEventRepository;
    private final RazorpayConfig razorpayConfig;

    /**
     * POST /api/payments/webhook
     * Razorpay sends webhook events here for payment state changes.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {

        // Return 200 immediately — we'll process async
        // But first, verify signature

        if (signature == null || signature.isBlank()) {
            log.warn("Webhook received without signature header");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Missing signature"));
        }

        // Verify webhook signature (timing-safe)
        boolean isValid = paymentService.verifyWebhookSignature(payload, signature, razorpayConfig.getWebhookSecret());
        if (!isValid) {
            log.warn("FRAUD ALERT: Invalid webhook signature received");
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid signature"));
        }

        // Parse event
        try {
            JSONObject event = new JSONObject(payload);
            String eventId = event.optString("id", null);
            String eventType = event.optString("event", null);

            if (eventId == null || eventType == null) {
                log.warn("Webhook event missing id or event type");
                return ResponseEntity.ok(Map.of("status", "ignored"));
            }

            // Idempotency check — skip if already processed
            if (webhookEventRepository.existsByEventId(eventId)) {
                log.info("Webhook event already processed, skipping: {}", eventId);
                return ResponseEntity.ok(Map.of("status", "already_processed"));
            }

            // Store event first (idempotency)
            WebhookEvent webhookEvent = WebhookEvent.builder()
                    .eventId(eventId)
                    .eventType(eventType)
                    .payload(payload)
                    .processed(false)
                    .build();
            webhookEventRepository.save(webhookEvent);

            // Process asynchronously
            processWebhookAsync(eventId, eventType, event);

            return ResponseEntity.ok(Map.of("status", "received"));

        } catch (Exception e) {
            log.error("Error parsing webhook payload: {}", e.getMessage());
            // Still return 200 to prevent Razorpay retries for malformed events
            return ResponseEntity.ok(Map.of("status", "error_logged"));
        }
    }

    /**
     * Process webhook event asynchronously.
     */
    @Async
    public void processWebhookAsync(String eventId, String eventType, JSONObject payload) {
        try {
            log.info("Processing webhook event: {} type: {}", eventId, eventType);
            paymentService.processWebhookEvent(eventType, payload);
            webhookEventRepository.markProcessed(eventId);
            log.info("Webhook event processed successfully: {}", eventId);
        } catch (Exception e) {
            log.error("Error processing webhook event {}: {}", eventId, e.getMessage());
        }
    }
}
