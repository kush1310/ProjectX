package com.charusat.canteen.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Email Service - Handles sending emails for verification, OTP, and password reset
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@charusat.edu.in}")
    private String fromEmail;

    /**
     * Send email verification link
     */
    @Async
    public void sendVerificationEmail(String toEmail, String name, String token) {
        try {
            String verificationLink = "http://localhost:5173/verify-email?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Verify Your CHARUSAT Campus Canteen Account");
            message.setText(
                "Hello " + name + ",\n\n" +
                "Welcome to CHARUSAT Campus Canteen!\n\n" +
                "Please verify your email by clicking the link below:\n" +
                verificationLink + "\n\n" +
                "This link will expire in 24 hours.\n\n" +
                "If you didn't create an account, please ignore this email.\n\n" +
                "Best regards,\n" +
                "CHARUSAT Campus Canteen Team"
            );

            mailSender.send(message);
            log.info("Verification email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send OTP for 2FA
     */
    @Async
    public void sendOtpEmail(String toEmail, String name, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Your CHARUSAT Campus Canteen Login OTP");
            message.setText(
                "Hello " + name + ",\n\n" +
                "Your one-time password (OTP) for login is:\n\n" +
                "    " + otp + "\n\n" +
                "This OTP will expire in 60 seconds.\n\n" +
                "If you didn't request this OTP, please secure your account immediately.\n\n" +
                "Best regards,\n" +
                "CHARUSAT Campus Canteen Team"
            );

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send password reset email
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String token) {
        try {
            String resetLink = "http://localhost:5173/reset-password?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Reset Your CHARUSAT Campus Canteen Password");
            message.setText(
                "Hello " + name + ",\n\n" +
                "We received a request to reset your password.\n\n" +
                "Click the link below to reset your password:\n" +
                resetLink + "\n\n" +
                "This link will expire in 15 minutes.\n\n" +
                "If you didn't request a password reset, please ignore this email.\n\n" +
                "Best regards,\n" +
                "CHARUSAT Campus Canteen Team"
            );

            mailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }
}
