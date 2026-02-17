package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Password History Entity - Prevents password reuse
 * 
 * Security Features:
 * - Stores hashed previous passwords
 * - Prevents reuse of last N passwords
 * - NIST 800-63B compliant
 */
@Entity
@Table(name = "password_history", indexes = {
    @Index(name = "idx_password_history_user", columnList = "user_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    /**
     * Create password history entry
     */
    public static PasswordHistory create(User user, String passwordHash) {
        return PasswordHistory.builder()
                .user(user)
                .passwordHash(passwordHash)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
