package com.charusat.canteen.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Email Service - Sends emails via Brevo SMTP
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Send password reset email with token link
     */
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("CharusatNeeds - Reset Your Password");
            
            String resetLink = "http://localhost:5173/reset-password?token=" + resetToken;
            
            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
                        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
                        .logo { text-align: center; margin-bottom: 30px; }
                        .logo span { font-size: 28px; font-weight: 700; color: #111827; }
                        .logo span.accent { color: #10b981; }
                        h1 { color: #111827; font-size: 24px; margin-bottom: 16px; }
                        p { color: #6b7280; line-height: 1.6; margin-bottom: 20px; }
                        .button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; margin: 20px 0; }
                        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0; }
                        .warning p { color: #92400e; margin: 0; font-size: 14px; }
                        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            <span>Charusat</span><span class="accent">Needs</span>
                        </div>
                        <h1>Reset Your Password</h1>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <center><a href="%s" class="button">Reset Password</a></center>
                        <div class="warning">
                            <p><strong>⚠️ This link expires in 1 hour.</strong> If you didn't request this, please ignore this email.</p>
                        </div>
                        <p style="font-size: 14px; color: #9ca3af;">If the button doesn't work, copy and paste this link:<br><a href="%s" style="color: #10b981;">%s</a></p>
                        <div class="footer">
                            <p>© 2026 CharusatNeeds. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(resetLink, resetLink, resetLink);
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
}
