package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Password History Entity - Prevents password reuse
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordHistory {

    private Long id;
    private User user;
    private Long userId; // For JDBC convenience
    private String passwordHash;
    private LocalDateTime createdAt;

    public static PasswordHistory create(User user, String passwordHash) {
        return PasswordHistory.builder()
                .user(user)
                .userId(user.getId())
                .passwordHash(passwordHash)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
