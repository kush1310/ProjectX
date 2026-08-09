package com.charusat.canteen.model;

import lombok.*;
import java.time.LocalDateTime;

/**
 * MFA Event — Audit record for MFA operations.
 * Stored in mfa_events table for security compliance.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MfaEvent {
    private Long id;
    private Long userId;
    private String eventType; // SETUP, ENABLED, DISABLED, VALIDATE_SUCCESS, VALIDATE_FAILED
    private String ipAddress;
    private String userAgent;
    private boolean success;
    private String detail;
    private LocalDateTime createdAt;
}
