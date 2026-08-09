package com.charusat.canteen.controller;

import com.charusat.canteen.model.LoginAttempt;
import com.charusat.canteen.model.MfaEvent;
import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.MfaEventRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.service.EmailService;
import com.charusat.canteen.service.MfaService;
import com.charusat.canteen.service.SecurityAuditService;
import com.charusat.canteen.service.UserService;
import com.charusat.canteen.util.FieldEncryptor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * MFA Controller — Endpoints for TOTP Multi-Factor Authentication.
 * All events are logged to both login_attempts (security audit) and mfa_events
 * (MFA audit trail).
 */
@RestController
@RequestMapping("/api/mfa")
@RequiredArgsConstructor
@Slf4j
public class MfaController {

    private final MfaService mfaService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final UserService userService;
    private final SecurityAuditService auditService;
    private final MfaEventRepository mfaEventRepository;
    private final FieldEncryptor fieldEncryptor;

    /**
     * Step 1: Generate MFA secret and QR code URI.
     */
    @PostMapping("/setup")
    public ResponseEntity<?> setupMfa(Principal principal, HttpServletRequest httpRequest) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "MFA is already enabled",
                    "message", "Disable MFA first before setting up a new one"));
        }

        String secret = mfaService.generateSecret();
        String qrUri = mfaService.generateQrCodeUri(user.getEmail(), secret);

        // Encrypt the TOTP secret before persisting to DB.
        // This prevents a DB dump from exposing secrets usable to generate valid OTP codes.
        user.setMfaSecret(fieldEncryptor.encrypt(secret));
        user.setMfaEnabled(false);
        userRepository.save(user);

        // Log to MFA events table
        mfaEventRepository.save(MfaEvent.builder()
                .userId(user.getId())
                .eventType("SETUP")
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .success(true)
                .detail("MFA setup initiated, secret generated")
                .build());

        log.info("MFA setup initiated for user: {}", user.getEmail());

        return ResponseEntity.ok(Map.of(
                "secret", secret,
                "qrCodeUri", qrUri,
                "message", "Scan the QR code with your authenticator app, then verify with a code"));
    }

    /**
     * Step 2: Verify TOTP code to enable MFA.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyAndEnableMfa(
            Principal principal,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String code = request.get("code");
        if (code == null || code.length() != 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid code format"));
        }

        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getMfaSecret() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "MFA not set up. Call /api/mfa/setup first"));
        }

        // Decrypt the stored secret before TOTP validation.
        String decryptedSecret = fieldEncryptor.decrypt(user.getMfaSecret());
        if (mfaService.validateCode(decryptedSecret, code)) {
            user.setMfaEnabled(true);
            userRepository.save(user);

            // Log success to both audit systems
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    user.getEmail(), getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    LoginAttempt.AttemptType.MFA_EVENT, true, "MFA enabled via TOTP verification", false));

            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("ENABLED")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(true)
                    .detail("MFA enabled after successful TOTP verification")
                    .build());

            log.info("MFA enabled for user: {}", user.getEmail());

            // Notify user via email that MFA has been activated on their account
            try {
                emailService.sendMfaStatusChangeEmail(user.getEmail(), user.getFullName(), true);
            } catch (Exception emailException) {
                log.warn("Failed to send MFA enabled email to {}: {}", user.getEmail(), emailException.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "MFA enabled successfully", "mfaEnabled", true));
        } else {
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    user.getEmail(), getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    LoginAttempt.AttemptType.MFA_EVENT, false, "Invalid TOTP code during MFA setup", false));

            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("VERIFY_FAILED")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(false)
                    .detail("Invalid TOTP code during MFA verification/enable")
                    .build());

            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
        }
    }

    /**
     * Validate TOTP code during login flow (PUBLIC — no JWT yet).
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateMfaCode(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and code are required"));
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getMfaEnabled())) {
            return ResponseEntity.badRequest().body(Map.of("error", "MFA is not enabled for this account"));
        }

        // Decrypt the stored secret before TOTP validation.
        String decryptedSecret = fieldEncryptor.decrypt(user.getMfaSecret());
        if (mfaService.validateCode(decryptedSecret, code)) {
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    email, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    LoginAttempt.AttemptType.MFA_EVENT, true, "MFA code validated during login", false));

            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("VALIDATE_SUCCESS")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(true)
                    .detail("MFA code validated successfully during login")
                    .build());

            return ResponseEntity.ok(Map.of("valid", true, "message", "MFA verification successful"));
        } else {
            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    email, getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    LoginAttempt.AttemptType.MFA_EVENT, false, "Invalid MFA code during login", false));

            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("VALIDATE_FAILED")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(false)
                    .detail("Invalid MFA code during login attempt")
                    .build());

            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invalid verification code"));
        }
    }

    /**
     * Disable MFA for a user. Requires current TOTP code.
     */
    @PostMapping("/disable")
    public ResponseEntity<?> disableMfa(
            Principal principal,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {

        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        String code = request.get("code");
        if (code == null || code.length() != 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current TOTP code required"));
        }

        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Boolean.TRUE.equals(user.getMfaEnabled())) {
            return ResponseEntity.badRequest().body(Map.of("error", "MFA is not enabled"));
        }

        // Decrypt the stored secret before TOTP validation.
        String decryptedMfaSecret = fieldEncryptor.decrypt(user.getMfaSecret());
        if (mfaService.validateCode(decryptedMfaSecret, code)) {
            user.setMfaEnabled(false);
            user.setMfaSecret(null);
            userRepository.save(user);

            auditService.logSecurityEvent(new SecurityAuditService.SecurityEvent(
                    user.getEmail(), getClientIp(httpRequest), httpRequest.getHeader("User-Agent"),
                    LoginAttempt.AttemptType.MFA_EVENT, true, "MFA disabled by user", false));

            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("DISABLED")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(true)
                    .detail("MFA disabled by user after TOTP verification")
                    .build());

            log.info("MFA disabled for user: {}", user.getEmail());

            // Notify user via email that MFA has been deactivated — important security alert
            try {
                emailService.sendMfaStatusChangeEmail(user.getEmail(), user.getFullName(), false);
            } catch (Exception emailException) {
                log.warn("Failed to send MFA disabled email to {}: {}", user.getEmail(), emailException.getMessage());
            }

            return ResponseEntity.ok(Map.of("message", "MFA disabled successfully", "mfaEnabled", false));
        } else {
            mfaEventRepository.save(MfaEvent.builder()
                    .userId(user.getId())
                    .eventType("DISABLE_FAILED")
                    .ipAddress(getClientIp(httpRequest))
                    .userAgent(httpRequest.getHeader("User-Agent"))
                    .success(false)
                    .detail("Failed MFA disable attempt — invalid TOTP code")
                    .build());

            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
        }
    }

    /**
     * Check MFA status for the authenticated user.
     */
    @GetMapping("/status")
    public ResponseEntity<?> getMfaStatus(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        User user = userService.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(Map.of(
                "mfaEnabled", Boolean.TRUE.equals(user.getMfaEnabled()),
                "hasSecret", user.getMfaSecret() != null));
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty())
            return xff.split(",")[0].trim();
        return request.getRemoteAddr();
    }
}
