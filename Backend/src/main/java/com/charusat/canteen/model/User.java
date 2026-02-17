package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Entity - Represents canteen users and admins
 * 
 * Security Features:
 * - Account lockout support
 * - Email verification tracking
 * - MFA readiness
 * - Password change tracking
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "profileImageData"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @Column // Nullable for OAuth users
    private String password;
    
    @Column(nullable = false)
    private String fullName;
    
    @Column(length = 15)
    private String mobile;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.USER;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;
    
    @Column(name = "profile_image")
    private String profileImage;
    
    @Column(name = "is_email_verified")
    @Builder.Default
    private Boolean isEmailVerified = false;
    
    @Column(name = "email_verification_token")
    private String emailVerificationToken;
    
    @Column(name = "email_verification_expiry")
    private LocalDateTime emailVerificationExpiry;
    
    @Column(name = "last_password_change")
    private LocalDateTime lastPasswordChange;
    
    @Column(name = "mfa_enabled")
    @Builder.Default
    private Boolean mfaEnabled = false;
    
    @Column(name = "mfa_secret")
    private String mfaSecret;
    
    @Column(name = "date_of_birth")
    private String dateOfBirth;
    
    @Column(name = "anniversary")
    private String anniversary;
    
    @Column(name = "gender")
    private String gender;
    
    // ===== ADDRESS SYSTEM FIELDS =====
    
    /**
     * User type: "STUDENT" or "TEACHER"
     */
    @Column(name = "user_type")
    private String userType;
    
    // Student-specific address fields
    @Column(name = "hostel_name")
    private String hostelName; // H1, H2, ... H10 (or GH1-GH10 for girls)
    
    @Column(name = "room_number")
    private String roomNumber;
    
    // Teacher-specific address fields
    @Column(name = "building_number")
    private String buildingNumber; // 1 to 7
    
    @Column(name = "department")
    private String department;
    
    @Column(name = "staff_room_number")
    private String staffRoomNumber;
    
    // ===== PROFILE IMAGE STORAGE IN DB =====
    
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "profile_image_data", columnDefinition = "bytea")
    private byte[] profileImageData;
    
    @Column(name = "profile_image_type")
    private String profileImageType; // e.g., "image/jpeg", "image/png"
    
    public enum UserRole {
        USER,
        ADMIN,
        CANTEEN_OWNER
    }
    
    public enum AuthProvider {
        LOCAL,   // Email/password authentication
        GOOGLE   // Google OAuth
    }
    
    /**
     * Check if user can login with password
     */
    public boolean canLoginWithPassword() {
        return authProvider == AuthProvider.LOCAL && password != null;
    }
    
    /**
     * Check if account is currently locked
     */
    public boolean isLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }
}
