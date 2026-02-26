package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * PasswordResetToken - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {
    private Long id;
    private String token;
    private Long userId; // FK
    private LocalDateTime expiresAt;
    
    @Builder.Default
    private Boolean used = false;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    public static PasswordResetToken createForUser(Long userId) {
        return PasswordResetToken.builder()
                .token(UUID.randomUUID().toString())
                .userId(userId)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .used(false)
                .build();
    }
    
    public boolean isValid() {
        return !used && LocalDateTime.now().isBefore(expiresAt);
    }
}
