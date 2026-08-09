package com.charusat.canteen.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Razorpay Configuration — Creates the RazorpayClient bean.
 * Credentials are injected from application.properties / environment variables.
 * The KEY SECRET is NEVER exposed outside of this configuration.
 */
@Configuration
@Slf4j
public class RazorpayConfig {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Value("${razorpay.webhook.secret}")
    private String webhookSecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        log.info("Initializing Razorpay client with key ID: {}...", keyId.substring(0, Math.min(12, keyId.length())));
        return new RazorpayClient(keyId, keySecret);
    }

    /**
     * Expose key ID only (safe for frontend).
     * The key secret is NEVER exposed as a bean.
     */
    @Bean(name = "razorpayKeyId")
    public String razorpayKeyId() {
        return keyId;
    }

    /**
     * Webhook secret — used internally by WebhookController only.
     */
    @Bean(name = "razorpayWebhookSecret")
    public String razorpayWebhookSecret() {
        return webhookSecret;
    }

    /**
     * Key secret accessor — package-private, used by PaymentService ONLY.
     * This is NOT a @Bean to prevent accidental injection elsewhere.
     */
    public String getKeyId() {
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    public String getWebhookSecret() {
        return webhookSecret;
    }
}
