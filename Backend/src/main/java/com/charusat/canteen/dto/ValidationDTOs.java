package com.charusat.canteen.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * Validation DTOs - Request objects with comprehensive validation
 */
public class ValidationDTOs {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Full name is required")
        @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
        private String fullName;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Pattern(regexp = ".*@charusat\\.edu\\.in$", message = "Must use @charusat.edu.in email")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 50, message = "Password must be 8-50 characters")
        @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$",
            message = "Password must contain uppercase, number, and special character"
        )
        private String password;

        @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid phone number")
        private String mobile;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class CreateOrderRequest {
        @NotNull(message = "Customer ID is required")
        private Long customerId;

        @NotNull(message = "Canteen ID is required")
        private Long canteenId;

        @NotEmpty(message = "At least one item is required")
        private List<Long> menuItemIds;

        @NotEmpty(message = "Quantities are required")
        private List<@Min(1) @Max(10) Integer> quantities;

        @Pattern(regexp = "^(cash|upi|card)$", message = "Invalid payment method")
        private String paymentMethod;

        @Size(max = 500, message = "Instructions too long")
        private String instructions;

        private String couponCode;
    }

    @Data
    public static class AddMenuItemRequest {
        @NotBlank(message = "Item name is required")
        @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
        private String name;

        @Size(max = 500, message = "Description too long")
        private String description;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "1.0", message = "Price must be at least ₹1")
        @DecimalMax(value = "10000.0", message = "Price cannot exceed ₹10,000")
        private BigDecimal price;

        @NotBlank(message = "Category is required")
        private String category;

        private String subCategory;
        private Boolean isVeg;
        private Boolean isAvailable;
        private Integer preparationTime;
    }

    @Data
    public static class AddReviewRequest {
        @NotNull(message = "Order ID is required")
        private Long orderId;

        @NotNull(message = "Rating is required")
        @Min(value = 1, message = "Rating must be 1-5")
        @Max(value = 5, message = "Rating must be 1-5")
        private Integer rating;

        @Size(max = 500, message = "Comment too long")
        private String comment;

        @Min(1) @Max(5)
        private Integer foodRating;

        @Min(1) @Max(5)
        private Integer packingRating;

        private Boolean isAnonymous;
    }

    @Data
    public static class ApplyCouponRequest {
        @NotBlank(message = "Coupon code is required")
        @Size(min = 4, max = 20, message = "Coupon code must be 4-20 characters")
        @Pattern(regexp = "^[A-Z0-9]+$", message = "Coupon code must be alphanumeric uppercase")
        private String code;

        @NotNull(message = "Order total is required")
        @DecimalMin(value = "0.0", message = "Invalid order total")
        private BigDecimal orderTotal;
    }
}
