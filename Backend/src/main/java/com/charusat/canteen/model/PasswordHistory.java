package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PasswordHistory - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordHistory {
    private Long id;
    private Long userId; // FK
    private String passwordHash;
    private LocalDateTime createdAt;
    
    public static PasswordHistory create(Long userId, String passwordHash) {
        return PasswordHistory.builder()
                .userId(userId)
                .passwordHash(passwordHash)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
