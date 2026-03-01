package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PasswordResetToken Entity - Stores secure tokens for password reset
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {

    private Long id;
    private String token;
    private User user;
    private Long userId; // For JDBC convenience
    private LocalDateTime expiresAt;

    @Builder.Default
    private Boolean used = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public static PasswordResetToken createForUser(User user) {
        return PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .userId(user.getId())
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
    }

    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiresAt);
    }
}
