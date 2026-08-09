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

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Email Service â€” Professional corporate HTML emails via Brevo HTTP API.
 *
 * All templates follow a consistent corporate design language:
 * - Clean typography with Inter/system font stack
 * - Muted professional color palette (slate/gray tones)
 * - Structured header â†’ body â†’ security footer pattern
 * - GDPR/security compliance footer on every email
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${spring.mail.password}")
    private String brevoApiKey;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    // â”€â”€â”€ Common Template Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private String emailHeader() {
        return """
                    <div style="text-align: center; padding: 28px 0 20px; border-bottom: 1px solid #e5e7eb;">
                        <span style="font-size: 24px; font-weight: 700; letter-spacing: -0.3px; font-family: 'Inter', 'Segoe UI', sans-serif;">
                            <span style="color: #1e293b;">Charusat</span><span style="color: #dc2626;">Needs</span>
                        </span>
                        <div style="font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">Campus Food Ordering Platform</div>
                    </div>
                """;
    }

    private String emailFooter() {
        return """
                    <div style="padding: 20px 0 0; border-top: 1px solid #e5e7eb; margin-top: 28px;">
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                            <tr>
                                <td style="font-size: 11px; color: #64748b; line-height: 1.6;">
                                    This is an automated message from CharusatNeeds.<br>
                                    Please do not reply directly to this email.
                                </td>
                                <td style="text-align: right; font-size: 11px; color: #94a3b8;">
                                    Ref: %s
                                </td>
                            </tr>
                        </table>
                        <div style="text-align: center; font-size: 11px; color: #94a3b8; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                            &copy; 2026 CharusatNeeds &mdash; CHARUSAT University, Changa, Gujarat<br>
                            <a href="%s" style="color: #64748b; text-decoration: none;">Privacy Policy</a> &bull;
                            <a href="%s" style="color: #64748b; text-decoration: none;">Terms of Service</a> &bull;
                            <a href="mailto:support@charusat.edu.in" style="color: #64748b; text-decoration: none;">Contact Support</a>
                        </div>
                    </div>
                """;
    }

    private String emailWrapper(String content) {
        String refId = "CN-" + System.currentTimeMillis();
        return """
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta name="color-scheme" content="light">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
                        <div style="max-width: 560px; margin: 0 auto; padding: 32px 16px;">
                            <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                                %s
                                %s
                                %s
                            </div>
                        </div>
                    </body>
                    </html>
                """
                .formatted(emailHeader(), content,
                        emailFooter().formatted(refId, frontendUrl + "/privacy", frontendUrl + "/terms"));
    }

    private String ctaButton(String text, String href, String color) {
        return """
                    <div style="text-align: center; margin: 24px 0;">
                        <a href="%s" style="display: inline-block; background-color: %s; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 0.3px;">
                            %s
                        </a>
                    </div>
                """
                .formatted(href, color, text);
    }

    private String alertBox(String message, String bgColor, String borderColor, String textColor) {
        return """
                    <div style="background: %s; border-left: 3px solid %s; padding: 14px 16px; border-radius: 6px; margin: 16px 0;">
                        <p style="color: %s; margin: 0; font-size: 13px; line-height: 1.6;">%s</p>
                    </div>
                """
                .formatted(bgColor, borderColor, textColor, message);
    }

    // â”€â”€â”€ 1. Welcome Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Welcome to CharusatNeeds</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">Dear %s, your account has been successfully created.</p>

                    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="color: #334155; font-size: 14px; font-weight: 600; margin: 0 0 12px;">What you can do:</p>
                        <table cellpadding="0" cellspacing="0" style="width: 100%%;">
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2713;&nbsp; Browse campus canteen menus</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2713;&nbsp; Place orders and skip the queue</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2713;&nbsp; Apply coupons and earn rewards</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2713;&nbsp; Track orders in real-time</td></tr>
                        </table>
                    </div>

                    %s

                    %s
                """
                .formatted(
                        fullName,
                        ctaButton("Get Started", frontendUrl + "/customer/menu", "#1e293b"),
                        alertBox(
                                "<strong>Security Tip:</strong> We recommend enabling Two-Factor Authentication (MFA) from Settings &rarr; Security to protect your account.",
                                "#f0fdf4", "#22c55e", "#166534"));

        sendEmail(toEmail, "Welcome to CharusatNeeds â€” Your Account is Ready", emailWrapper(content));
    }

    // â”€â”€â”€ 2. Email Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendVerificationEmail(String toEmail, String verificationToken) {
        String verifyLink = frontendUrl + "/verify-email?token=" + verificationToken;

        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Verify Your Email Address</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        To complete your registration, please verify your email address by clicking the button below.
                    </p>

                    %s

                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 16px;">
                        Or copy and paste this URL into your browser:<br>
                        <a href="%s" style="color: #3b82f6; word-break: break-all; font-size: 11px;">%s</a>
                    </p>

                    %s

                    %s
                """
                .formatted(
                        ctaButton("Verify Email Address", verifyLink, "#dc2626"),
                        verifyLink, verifyLink,
                        alertBox(
                                "<strong>This link expires in 24 hours.</strong> If you did not create an account on CharusatNeeds, please disregard this email.",
                                "#fffbeb", "#f59e0b", "#92400e"),
                        alertBox(
                                "<strong>Security Notice:</strong> CharusatNeeds will never ask for your password via email. Do not share this link with anyone.",
                                "#f0f9ff", "#3b82f6", "#1e40af"));

        sendEmail(toEmail, "Action Required: Verify Your Email â€” CharusatNeeds", emailWrapper(content));
    }

    // â”€â”€â”€ 3. Password Reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;

        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Password Reset Request</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        We received a request to reset the password associated with this email address.
                    </p>

                    %s

                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-bottom: 16px;">
                        Or copy this URL:<br>
                        <a href="%s" style="color: #3b82f6; word-break: break-all; font-size: 11px;">%s</a>
                    </p>

                    %s

                    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6;">
                            <strong>Didn't request this?</strong> Your account is still secure. No changes have been made.
                            If you continue to receive these emails, please contact
                            <a href="mailto:support@charusat.edu.in" style="color: #3b82f6;">support@charusat.edu.in</a>.
                        </p>
                    </div>
                """
                .formatted(
                        ctaButton("Reset Password", resetLink, "#dc2626"),
                        resetLink, resetLink,
                        alertBox(
                                "<strong>This link expires in 1 hour</strong> for your security. After expiration, you will need to request a new reset link.",
                                "#fffbeb", "#f59e0b", "#92400e"));

        sendEmail(toEmail, "Password Reset â€” CharusatNeeds", emailWrapper(content));
    }

    // â”€â”€â”€ 4. Password Changed Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendPasswordChangeNotification(String toEmail) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));

        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Password Changed Successfully</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        Your account password was changed on <strong>%s</strong>.
                    </p>

                    %s

                    <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-top: 16px;">
                        <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.6;">
                            If you made this change, no further action is required.<br><br>
                            <strong>If you did not change your password,</strong> your account may be compromised.
                            Please reset your password immediately and contact
                            <a href="mailto:support@charusat.edu.in" style="color: #dc2626; font-weight: 600;">support@charusat.edu.in</a>.
                        </p>
                    </div>
                """
                .formatted(
                        timestamp,
                        alertBox(
                                "<strong>&#x26A0; Security Alert:</strong> If you did not authorize this change, take immediate action by resetting your password.",
                                "#fef2f2", "#ef4444", "#991b1b"));

        sendEmail(toEmail, "Security Alert: Password Changed â€” CharusatNeeds", emailWrapper(content));
    }

    // â”€â”€â”€ 5. Inactivity Reminder (Zomato-Style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendInactivityReminderEmail(String toEmail, String fullName) {
        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">We Miss You, %s! ðŸ•</h1>

                    <div style="background: linear-gradient(135deg, #fef2f2 0%%, #fff7ed 100%%); border-radius: 8px; padding: 24px; margin: 20px 0; text-align: center;">
                        <p style="color: #dc2626; font-size: 18px; font-weight: 700; margin: 0 0 8px;">Cravings don't take a break. Neither should you.</p>
                        <p style="color: #78716c; font-size: 14px; margin: 0; line-height: 1.6;">
                            It's been a while since your last order on CharusatNeeds.<br>
                            Your favourite canteens have been cooking up something special &mdash; just for you.
                        </p>
                    </div>

                    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="color: #1e293b; font-size: 14px; font-weight: 600; margin: 0 0 12px;">What's been brewing &#x2615;:</p>
                        <table cellpadding="0" cellspacing="0" style="width: 100%%;">
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x1F525;&nbsp; New menu items across campus canteens</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x1F381;&nbsp; Fresh coupons &amp; exclusive discounts</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x26A1;&nbsp; Lightning-fast ordering &mdash; skip the queue</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x1F4F1;&nbsp; Real-time order tracking</td></tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 20px 0;">
                        <p style="color: #dc2626; font-size: 15px; font-weight: 600; margin: 0 0 4px;">Hungry? Your next meal is just a tap away.</p>
                        <p style="color: #94a3b8; font-size: 12px; margin: 0; font-style: italic;">"Good food is the foundation of genuine happiness"</p>
                    </div>

                    %s

                    <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 16px;">
                        You're receiving this because you haven't placed an order recently.
                        <a href="%s/settings" style="color: #64748b;">Manage notification preferences</a>.
                    </p>
                """
                .formatted(
                        fullName,
                        ctaButton("Order Now â€” See What's New", frontendUrl + "/customer/menu", "#dc2626"),
                        frontendUrl);

        sendEmail(toEmail, fullName + ", your taste buds called â€” they miss CharusatNeeds! ðŸ”", emailWrapper(content));
    }

    // â”€â”€â”€ 6. Order Confirmation Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendOrderConfirmationEmail(String toEmail, String fullName, String orderNumber,
            String canteenName, String paymentMethod,
            String totalAmount, String items) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));

        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Order Confirmed</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        Thank you, %s. Your order has been placed successfully.
                    </p>

                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
                        <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">&#x2713; Order Placed Successfully</p>
                    </div>

                    <table cellpadding="0" cellspacing="0" style="width: 100%%; background: #f8fafc; border-radius: 8px; padding: 0; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Order Number</span><br>
                                <span style="font-size: 15px; font-weight: 700; color: #1e293b;">%s</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Date</span><br>
                                <span style="font-size: 13px; color: #475569;">%s</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Canteen</span><br>
                                <span style="font-size: 14px; font-weight: 600; color: #1e293b;">%s</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Payment</span><br>
                                <span style="font-size: 13px; color: #475569;">%s</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Items</span><br>
                                <span style="font-size: 13px; color: #475569;">%s</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 14px 16px; text-align: right;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</span><br>
                                <span style="font-size: 18px; font-weight: 700; color: #dc2626;">&#x20B9; %s</span>
                            </td>
                        </tr>
                    </table>

                    %s

                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px;">
                        Track your order status in real-time from the app.
                    </p>
                """
                .formatted(
                        fullName, orderNumber, timestamp, canteenName, paymentMethod, items, totalAmount,
                        ctaButton("Track Order", frontendUrl + "/customer/orders", "#1e293b"));

        sendEmail(toEmail, "Order Confirmed #" + orderNumber + " â€” CharusatNeeds", emailWrapper(content));
    }

    // â”€â”€â”€ 7. Account Deletion Confirmation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Async
    public void sendAccountDeletionEmail(String toEmail, String fullName) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        String loginUrl = frontendUrl + "/login";

        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Account Deletion Scheduled</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        Dear %s, your CharusatNeeds account deletion has been requested on %s.
                    </p>

                    %s

                    <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                        <p style="color: #334155; font-size: 14px; font-weight: 600; margin: 0 0 12px;">What happens next:</p>
                        <table cellpadding="0" cellspacing="0" style="width: 100%%;">
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2022;&nbsp; Your account will remain active for <strong>5 days</strong> from this request</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2022;&nbsp; During this period, you can <strong>cancel the deletion by simply logging in</strong></td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2022;&nbsp; After 5 days, your account will be flagged as deleted</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2022;&nbsp; Your order history will be preserved for vendor records</td></tr>
                            <tr><td style="padding: 6px 0; font-size: 13px; color: #475569;">&#x2022;&nbsp; Flagged accounts cannot log in</td></tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 24px 0;">
                        <p style="color: #334155; font-size: 14px; font-weight: 600; margin: 0 0 12px;">Changed your mind?</p>
                        <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">
                            Simply log in to your account within the next 5 days to cancel the deletion request.
                        </p>
                    </div>

                    %s

                    %s
                """
                .formatted(
                        fullName, timestamp,
                        alertBox(
                                "<strong>5-Day Recovery Window:</strong> Your account is NOT yet deleted. Log in anytime within the next 5 days to recover your account.",
                                "#eff6ff", "#3b82f6", "#1e40af"),
                        ctaButton("Log In to Recover Account", loginUrl, "#16a34a"),
                        alertBox(
                                "<strong>Did not request this?</strong> If this was not you, please <a href='"
                                        + loginUrl
                                        + "' style='color: #dc2626;'>log in immediately</a> to secure your account and revoke this request.",
                                "#fef2f2", "#ef4444", "#991b1b"));

        sendEmail(toEmail, "Account Deletion Scheduled â€” 5-Day Recovery Window â€” CharusatNeeds",
                emailWrapper(content));
    }

    // â”€â”€â”€ Email Sender (Brevo API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // sendEmail implementation is defined at the bottom of this file

    // â”€â”€â”€ 8. Order Cancellation & Refund Notification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * sendOrderRefundEmail
     *
     * Dispatched asynchronously when a vendor cancels a customer order that was
     * already paid via UPI or card. Explains the cancellation reason, confirms
     * the refund amount, and states the expected credit timeline. Contains a CTA
     * to encourage the customer to re-order from the menu.
     *
     * @param toEmail      {String} Customer email; RFC 5322 format required.
     * @param fullName     {String} Customer display name for personalised greeting.
     * @param orderNumber  {String} Order reference number (e.g. "ORD-1759F163").
     * @param refundAmount {String} Exact rupee figure being refunded (e.g. "630").
     * @param reason       {String} Vendor cancellation reason; nullable â€” defaults to generic text.
     * @returns void       Runs on Spring async executor; caller receives no return value.
     */
    @Async
    public void sendOrderRefundEmail(String toEmail, String fullName,
            String orderNumber, String refundAmount, String reason) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        String displayReason = (reason != null && !reason.isBlank())
                ? reason
                : "Operational constraint at the canteen";

        String content = ("""
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; \
text-align: center;">Order Cancelled â€” Refund Initiated</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        Dear %s, we regret to inform you that your order has been cancelled by the vendor.
                    </p>

                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; \
padding: 16px; text-align: center; margin-bottom: 20px;">
                        <p style="color: #991b1b; font-size: 13px; font-weight: 600; margin: 0;">\
Order #%s was cancelled on %s</p>
                        <p style="color: #b91c1c; font-size: 12px; margin: 6px 0 0;">Reason: %s</p>
                    </div>

                    <table cellpadding="0" cellspacing="0" \
style="width: 100%%; background: #f8fafc; border-radius: 8px; padding: 0; margin-bottom: 20px;">
                        <tr>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; \
letter-spacing: 0.5px;">Refund Amount</span><br>
                                <span style="font-size: 20px; font-weight: 700; color: #16a34a;">\
&#x20B9; %s</span>
                            </td>
                            <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; \
letter-spacing: 0.5px;">Status</span><br>
                                <span style="font-size: 13px; font-weight: 600; color: #16a34a;">\
Refund Initiated</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding: 14px 16px;">
                                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; \
letter-spacing: 0.5px;">Expected Credit Timeline</span><br>
                                <span style="font-size: 13px; color: #475569;">\
UPI payments: 5-7 business days | Card payments: 7-10 business days</span>
                            </td>
                        </tr>
                    </table>

                    %s

                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px;">
                        If you do not receive the refund within the stated period, please contact our
                        support team with your order number.
                    </p>
                """)
                .formatted(fullName, orderNumber, timestamp, displayReason, refundAmount,
                        ctaButton("Browse Menu and Re-Order", frontendUrl + "/customer/menu", "#16a34a"));

        sendEmail(toEmail,
                "Order #" + orderNumber + " Cancelled â€” Refund of Rs." + refundAmount + " Initiated",
                emailWrapper(content));
    }

    // â”€â”€â”€ 9. Review Thank-You Email â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /**
     * sendReviewThankYouEmail
     *
     * Sent asynchronously after a customer submits a review for a completed order.
     * Thanks the customer for their feedback and encourages re-ordering.
     *
     * @param toEmail     {String} Customer email; RFC 5322 format required.
     * @param fullName    {String} Customer display name for personalised greeting.
     * @param orderNumber {String} Order reference number (e.g. "ORD-1759F163").
     * @returns void      Runs on Spring async executor; caller receives no return value.
     */
    @Async
    public void sendReviewThankYouEmail(String toEmail, String fullName, String orderNumber) {
        String content = """
                    <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 24px 0 8px; text-align: center;">Thank You for Your Review</h1>
                    <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0 0 24px;">
                        Dear %s, your feedback for order <strong>#%s</strong> helps us serve the CHARUSAT campus better.
                    </p>

                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 20px;">
                        <p style="color: #166534; font-size: 13px; font-weight: 600; margin: 0;">&#x2713; Review Received</p>
                        <p style="color: #15803d; font-size: 12px; margin: 6px 0 0;">Your experience has been shared with the canteen team.</p>
                    </div>

                    %s

                    <p style="text-align: center; font-size: 12px; color: #94a3b8; margin-top: 16px;">
                        Hungry again? Browse the latest menu from your favourite canteens.
                    </p>
                """
                .formatted(
                        fullName, orderNumber,
                        ctaButton("Order Again", frontendUrl + "/customer/dashboard", "#1e293b"));

        sendEmail(toEmail, "Thank You for Your Review â€” CharusatNeeds", emailWrapper(content));
    }

    // -- 10. MFA Status Change Notification -----------------------------------------

    /**
     * sendMfaStatusChangeEmail
     *
     * Dispatched asynchronously whenever the user enables or disables MFA.
     * Serves as both a confirmation (enabled) and a security alert (disabled).
     *
     * @param toEmail  {String}  Recipient email.
     * @param fullName {String}  Display name.
     * @param enabled  {boolean} TRUE = just enabled, FALSE = just disabled.
     */
    @Async
    public void sendMfaStatusChangeEmail(String toEmail, String fullName, boolean enabled) {
        String timestamp  = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
        String action     = enabled ? "Enabled" : "Disabled";
        String actionVerb = enabled ? "enabled" : "disabled";

        String statusBanner = enabled
                ? "<div style=\"background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;"
                  + "text-align:center;margin-bottom:20px;\"><p style=\"color:#166534;font-size:13px;"
                  + "font-weight:600;margin:0;\">&#x2713; Two-Factor Authentication Enabled</p></div>"
                : "<div style=\"background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px;"
                  + "text-align:center;margin-bottom:20px;\"><p style=\"color:#991b1b;font-size:13px;"
                  + "font-weight:600;margin:0;\">&#x26A0; Two-Factor Authentication Disabled</p></div>";

        String alertMsg = enabled
                ? "<strong>Security Confirmation:</strong> MFA is now active. A 6-digit code from your "
                  + "authenticator app will be required on every future login."
                : "<strong>Security Alert:</strong> MFA has been removed from your account. "
                  + "If you did not make this change, reset your password immediately and contact "
                  + "<a href='mailto:support@charusat.edu.in' style='color:#dc2626;'>support@charusat.edu.in</a>.";

        String bg      = enabled ? "#f0fdf4" : "#fef2f2";
        String border  = enabled ? "#22c55e" : "#ef4444";
        String txtColor = enabled ? "#166534" : "#991b1b";
        String ctaColor = enabled ? "#16a34a" : "#dc2626";

        String content = String.format(
                "<h1 style=\"color:#1e293b;font-size:22px;font-weight:700;margin:24px 0 8px;text-align:center;\">"
                + "Two-Factor Authentication %s</h1>"
                + "<p style=\"color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;\">"
                + "Dear %s, this confirms that MFA was <strong>%s</strong> on your account on %s.</p>"
                + "%s"
                + "<div style=\"background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;\">"
                + "<p style=\"color:#334155;font-size:13px;font-weight:600;margin:0 0 10px;\">Event Details:</p>"
                + "<table cellpadding=\"0\" cellspacing=\"0\" style=\"width:100%%;\"><tr>"
                + "<td style=\"padding:5px 0;font-size:13px;color:#475569;\">&#x2022;&nbsp;"
                + "MFA Status: <strong>%s</strong></td></tr><tr>"
                + "<td style=\"padding:5px 0;font-size:13px;color:#475569;\">&#x2022;&nbsp;"
                + "Changed at: %s</td></tr><tr>"
                + "<td style=\"padding:5px 0;font-size:13px;color:#475569;\">&#x2022;&nbsp;"
                + "Account: %s</td></tr></table></div>"
                + "%s %s",
                action, fullName, actionVerb, timestamp,
                statusBanner, action, timestamp, toEmail,
                alertBox(alertMsg, bg, border, txtColor),
                ctaButton("View Security Settings", frontendUrl + "/customer/security", ctaColor));

        String subject = enabled
                ? "Two-Factor Authentication Enabled - CharusatNeeds"
                : "Security Alert: Two-Factor Authentication Disabled - CharusatNeeds";

        sendEmail(toEmail, subject, emailWrapper(content));
    }

    // --- Complaint Lifecycle Emails ------------------------------------------

    @Async
    public void sendComplaintRaisedToCustomer(String toEmail, String customerName,
                                               String referenceId, String subject,
                                               String orderNumber) {
        String orderInfo = orderNumber != null
                ? "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Order: <strong>#" + orderNumber + "</strong></p>"
                : "";
        String content = String.format(
                "<h1 style=\"color:#1e293b;font-size:22px;font-weight:700;margin:24px 0 8px;text-align:center;\">Complaint Received</h1>"
                + "<p style=\"color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;\">Dear %s, your complaint has been registered successfully.</p>"
                + "<div style=\"background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;\">"
                + "<p style=\"color:#334155;font-size:13px;font-weight:600;margin:0 0 12px;\">Complaint Details</p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Reference ID: <strong style=\"color:#dc2626;\">%s</strong></p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Subject: <strong>%s</strong></p>"
                + "%s"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Status: <strong>Open</strong></p></div>"
                + "%s%s",
                customerName, referenceId, subject, orderInfo,
                alertBox("Keep your reference ID safe. You will receive email updates as your complaint progresses.",
                        "#eff6ff", "#3b82f6", "#1e40af"),
                ctaButton("View My Orders", frontendUrl + "/customer/orders", "#1e293b"));
        sendEmail(toEmail, "Complaint Registered: " + referenceId + " — CharusatNeeds", emailWrapper(content));
    }

    @Async
    public void sendComplaintRaisedToVendor(String toEmail, String vendorName,
                                             String referenceId, String subject,
                                             String orderNumber, String description) {
        String orderInfo = orderNumber != null
                ? "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Order: <strong>#" + orderNumber + "</strong></p>"
                : "";
        String content = String.format(
                "<h1 style=\"color:#1e293b;font-size:22px;font-weight:700;margin:24px 0 8px;text-align:center;\">New Customer Complaint</h1>"
                + "<p style=\"color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;\">Dear %s, a customer has raised a complaint against your canteen.</p>"
                + "<div style=\"background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;\">"
                + "<p style=\"color:#334155;font-size:13px;font-weight:600;margin:0 0 12px;\">Complaint Summary</p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Reference ID: <strong style=\"color:#dc2626;\">%s</strong></p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Subject: <strong>%s</strong></p>"
                + "%s"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Status: <strong>Open — Action Required</strong></p></div>"
                + "<div style=\"background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 16px;border-radius:6px;margin:16px 0;\">"
                + "<p style=\"color:#92400e;margin:0;font-size:13px;\"><strong>Customer Message:</strong> %s</p></div>"
                + "%s",
                vendorName, referenceId, subject, orderInfo, description,
                ctaButton("Manage Complaint", frontendUrl + "/vendor/complaints", "#dc2626"));
        sendEmail(toEmail, "Action Required: New Complaint " + referenceId + " — CharusatNeeds", emailWrapper(content));
    }

    @Async
    public void sendComplaintStatusUpdate(String toEmail, String customerName,
                                           String referenceId, String subject,
                                           String newStatus) {
        boolean resolved = "RESOLVED".equals(newStatus);
        String statusLabel = resolved ? "Resolved" : "In Progress";
        String bgColor = resolved ? "#f0fdf4" : "#eff6ff";
        String bdColor = resolved ? "#22c55e" : "#3b82f6";
        String txtColor = resolved ? "#166534" : "#1e40af";
        String ctaColor = resolved ? "#16a34a" : "#2563eb";
        String content = String.format(
                "<h1 style=\"color:#1e293b;font-size:22px;font-weight:700;margin:24px 0 8px;text-align:center;\">Complaint Status Updated</h1>"
                + "<p style=\"color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;\">Dear %s, your complaint status has been updated.</p>"
                + "<div style=\"background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;\">"
                + "<p style=\"color:#334155;font-size:13px;font-weight:600;margin:0 0 12px;\">Complaint Details</p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Reference ID: <strong style=\"color:#dc2626;\">%s</strong></p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">Subject: <strong>%s</strong></p>"
                + "<p style=\"color:#475569;font-size:13px;margin:4px 0;\">New Status: <strong>%s</strong></p></div>"
                + "%s%s",
                customerName, referenceId, subject, statusLabel,
                alertBox(resolved ? "Your complaint has been resolved. Thank you for your patience."
                        : "Your complaint is being actively reviewed by the canteen team.", bgColor, bdColor, txtColor),
                ctaButton("View Complaint", frontendUrl + "/customer/orders", ctaColor));
        sendEmail(toEmail, "Complaint " + referenceId + " is now " + statusLabel + " — CharusatNeeds", emailWrapper(content));
    }

    @Async
    public void sendComplaintReplyToCustomer(String toEmail, String customerName,
                                              String referenceId, String subject,
                                              String replyText) {
        String content = String.format(
                "<h1 style=\"color:#1e293b;font-size:22px;font-weight:700;margin:24px 0 8px;text-align:center;\">Vendor Response Received</h1>"
                + "<p style=\"color:#64748b;font-size:14px;text-align:center;margin:0 0 24px;\">Dear %s, the canteen has responded to your complaint <strong>%s</strong>.</p>"
                + "<div style=\"background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:20px;\">"
                + "<p style=\"color:#334155;font-size:13px;font-weight:600;margin:0 0 8px;\">Subject: %s</p></div>"
                + "<div style=\"background:#fffbeb;border-left:3px solid #f59e0b;padding:14px 16px;border-radius:6px;margin:16px 0;\">"
                + "<p style=\"color:#92400e;margin:0;font-size:13px;\"><strong>Canteen Response:</strong> %s</p></div>"
                + "%s",
                customerName, referenceId, subject, replyText,
                ctaButton("View Full Thread", frontendUrl + "/customer/orders", "#1e293b"));
        sendEmail(toEmail, "Response to Complaint " + referenceId + " — CharusatNeeds", emailWrapper(content));
    }

    // --- Internal Brevo dispatcher -------------------------------------------

    void sendEmail(String toEmail, String subject, String htmlBody) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);
            Map<String, Object> payload = Map.of(
                    "sender",      Map.of("name", "CharusatNeeds", "email", fromEmail),
                    "to",          List.of(Map.of("email", toEmail)),
                    "subject",     subject,
                    "htmlContent", htmlBody
            );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(BREVO_API_URL, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful()) {
                log.warn("Brevo API non-2xx for {}: {}", toEmail, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}