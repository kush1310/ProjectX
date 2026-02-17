package com.charusat.canteen.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Email Service - Modern HTML emails via Brevo HTTP API
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    // We use RestTemplate to call Brevo API directly to support API Key auth
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    // Use the password field as the API Key storage
    @Value("${spring.mail.password}")
    private String brevoApiKey;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
    
    /**
     * Send welcome email to new users
     */
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fef7f7 0%%, #fff 100%%); min-height: 100vh;">
                <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 20px 60px rgba(226, 55, 68, 0.08), 0 8px 24px rgba(0,0,0,0.04); border: 1px solid rgba(226, 55, 68, 0.08);">
                        
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">
                                <span style="color: #111827;">Charusat</span><span style="background: linear-gradient(135deg, #e23744, #f56565); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Needs</span>
                            </span>
                        </div>
                        
                        <!-- Welcome Header -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #111827; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">Welcome, %s!</h1>
                            <p style="color: #6b7280; font-size: 16px; margin: 0;">Your account has been created successfully</p>
                        </div>
                        
                        <!-- Features -->
                        <div style="background: linear-gradient(135deg, #fef2f2, #fff5f5); border-radius: 16px; padding: 24px; margin-bottom: 28px;">
                            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px 0; font-weight: 500;">What you can do with CharusatNeeds:</p>
                            <ul style="margin: 0; padding: 0 0 0 20px; color: #4b5563;">
                                <li style="margin-bottom: 10px; line-height: 1.5;">Browse delicious campus food options</li>
                                <li style="margin-bottom: 10px; line-height: 1.5;">Order ahead and skip the queue</li>
                                <li style="margin-bottom: 10px; line-height: 1.5;">Apply exclusive coupons & discounts</li>
                                <li style="margin-bottom: 0; line-height: 1.5;">Track your orders in real-time</li>
                            </ul>
                        </div>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin-bottom: 28px;">
                            <a href="%s/customer/menu" style="display: inline-block; background: linear-gradient(135deg, #e23744, #dc2626); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(226, 55, 68, 0.3); transition: transform 0.2s;">
                                Start Ordering
                            </a>
                        </div>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                Questions? Reply to this email or contact support.<br>
                                © 2026 CharusatNeeds. Made for CHARUSAT
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(fullName, frontendUrl);

        sendEmail(toEmail, "Welcome to CharusatNeeds!", htmlContent);
    }

    /**
     * Send email verification link
     */
    @Async
    public void sendVerificationEmail(String toEmail, String verificationToken) {
        String verifyLink = frontendUrl + "/verify-email?token=" + verificationToken;
        
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fef7f7 0%%, #fff 100%%); min-height: 100vh;">
                <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 20px 60px rgba(226, 55, 68, 0.08), 0 8px 24px rgba(0,0,0,0.04); border: 1px solid rgba(226, 55, 68, 0.08);">
                        
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">
                                <span style="color: #111827;">Charusat</span><span style="background: linear-gradient(135deg, #e23744, #f56565); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Needs</span>
                            </span>
                        </div>
                        
                        <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">Verify Your Email</h1>
                        
                        <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
                            Please click the button below to verify your email address and activate your account:
                        </p>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin-bottom: 28px;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #e23744, #dc2626); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(226, 55, 68, 0.3);">
                                Verify Email
                            </a>
                        </div>
                        
                        <!-- Warning Box -->
                        <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
                            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                                <strong>This link expires in 24 hours.</strong><br>
                                If you didn't create an account, please ignore this email.
                            </p>
                        </div>
                        
                        <!-- Fallback Link -->
                        <p style="text-align: center; font-size: 13px; color: #9ca3af; margin-bottom: 24px;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="%s" style="color: #e23744; word-break: break-all;">%s</a>
                        </p>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                © 2026 CharusatNeeds. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(verifyLink, verifyLink, verifyLink);

        sendEmail(toEmail, "Verify Your Email - CharusatNeeds", htmlContent);
    }
    
    /**
     * Send password reset email with token link
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        
        String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #fef7f7 0%%, #fff 100%%);">
                <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: white; border-radius: 24px; padding: 48px 40px; box-shadow: 0 20px 60px rgba(226, 55, 68, 0.08), 0 8px 24px rgba(0,0,0,0.04); border: 1px solid rgba(226, 55, 68, 0.08);">
                        
                        <!-- Logo -->
                        <div style="text-align: center; margin-bottom: 32px;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">
                                <span style="color: #111827;">Charusat</span><span style="background: linear-gradient(135deg, #e23744, #f56565); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Needs</span>
                            </span>
                        </div>
                        
                        <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">Reset Your Password</h1>
                        
                        <p style="color: #6b7280; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
                            We received a request to reset your password. Click the button below to create a new password:
                        </p>
                        
                        <!-- CTA Button -->
                        <div style="text-align: center; margin-bottom: 28px;">
                            <a href="%s" style="display: inline-block; background: linear-gradient(135deg, #e23744, #dc2626); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 24px rgba(226, 55, 68, 0.3);">
                                Reset Password
                            </a>
                        </div>
                        
                        <!-- Warning Box -->
                        <div style="background: linear-gradient(135deg, #fffbeb, #fef3c7); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 12px; margin-bottom: 24px;">
                            <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                                <strong>This link expires in 1 hour.</strong><br>
                                If you didn't request this reset, please ignore this email.
                            </p>
                        </div>
                        
                        <!-- Fallback Link -->
                        <p style="text-align: center; font-size: 13px; color: #9ca3af; margin-bottom: 24px;">
                            If the button doesn't work, copy and paste this link:<br>
                            <a href="%s" style="color: #e23744; word-break: break-all;">%s</a>
                        </p>
                        
                        <!-- Footer -->
                        <div style="text-align: center; padding-top: 24px; border-top: 1px solid #f3f4f6;">
                            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                                © 2026 CharusatNeeds. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink, resetLink, resetLink);

        sendEmail(toEmail, "Reset Your CharusatNeeds Password", htmlContent);
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) {
        try {
            Map<String, Object> payload = Map.of(
                "sender", Map.of("name", "Team Charusat Needs", "email", fromEmail),
                "to", List.of(Map.of("email", toEmail)),
                "subject", subject,
                "htmlContent", htmlContent
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, request, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Email sent successfully to: {}", toEmail);
            } else {
                log.error("Failed to send email. Status: {}, Body: {}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Failed to send email via Brevo API");
            }

        } catch (Exception e) {
            log.error("Exception while sending email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}

