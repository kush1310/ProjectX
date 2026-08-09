package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Entity - Represents canteen users and admins
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "profileImageData" })
public class User {

    private Long id;
    private String email;
    private String password;
    private String fullName;
    private String mobile;

    @Builder.Default
    private UserRole role = UserRole.USER;

    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime lastLogin;

    @Builder.Default
    private Boolean isActive = true;

    private LocalDateTime lockedUntil;
    private String profileImage;

    @Builder.Default
    private Boolean isEmailVerified = false;

    private String emailVerificationToken;
    private LocalDateTime emailVerificationExpiry;
    private LocalDateTime lastPasswordChange;

    @Builder.Default
    private Boolean mfaEnabled = false;

    private String mfaSecret;
    private String dateOfBirth;
    private String anniversary;
    private String gender;
    private String userType;
    private String hostelName;
    private String roomNumber;
    private String buildingNumber;
    private String department;
    private String staffRoomNumber;
    private byte[] profileImageData;
    private String profileImageType;
    private LocalDateTime deletionRequestedAt;

    public enum UserRole {
        USER,
        ADMIN,
        CANTEEN_OWNER
    }

    public enum AuthProvider {
        LOCAL,
        GOOGLE
    }

    public boolean canLoginWithPassword() {
        return authProvider == AuthProvider.LOCAL && password != null;
    }

    public boolean isLocked() {
        return lockedUntil != null && LocalDateTime.now().isBefore(lockedUntil);
    }
}
