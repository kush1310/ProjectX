package com.charusat.canteen.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Registration Request DTO
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Pattern(regexp = "^[A-Za-z\\s]+$", message = "Name can only contain letters and spaces")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9._-]*@charusat\\.edu\\.in$", 
             message = "Only @charusat.edu.in emails are allowed")
    private String email;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian mobile number")
    private String contactNumber;

    @NotBlank(message = "Password is required")
    @Size(min = 10, max = 16, message = "Password must be between 10 and 16 characters")
    @Pattern(regexp = "^(?=.*[A-Z].*[A-Z])(?=.*[a-z].*[a-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?]).{10,16}$",
             message = "Password must contain at least 2 uppercase, 2 lowercase, 1 number, and 1 special character")
    private String password;

    @NotBlank(message = "Please confirm your password")
    private String confirmPassword;

    @AssertTrue(message = "You must agree to the terms")
    private Boolean agreeToTerms;
}
