package com.charusat.canteen.controller;

import com.charusat.canteen.model.User;
import com.charusat.canteen.service.AuthService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * User Controller - Handles profile management endpoints
 * 
 * Features:
 * - Profile CRUD with field restrictions
 * - Name validation (ID portion from email must be retained)
 * - Address management for Students and Teachers
 * - Profile image storage in database
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
@Slf4j
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    
    private static final long MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB

    /**
     * Get current user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "profile", buildProfileResponse(user)));
        } catch (Exception e) {
            log.error("Error fetching profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to fetch profile"));
        }
    }

    /**
     * Update user profile
     * Only allows: fullName, mobile, gender
     * Name must retain the ID portion from email
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ProfileUpdateRequest request) {
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }

            // Get the ID portion from email (e.g., d25ce145 from d25ce145@charusat.edu.in)
            String emailId = extractIdFromEmail(user.getEmail());
            
            // Validate name change - ID portion must be retained
            if (request.fullName() != null && !request.fullName().isBlank()) {
                String newName = request.fullName().trim().toUpperCase();
                if (!newName.contains(emailId.toUpperCase())) {
                    return ResponseEntity.badRequest()
                            .body(Map.of(
                                "success", false, 
                                "message", "You cannot remove your ID (" + emailId.toUpperCase() + ") from your name"
                            ));
                }
                user.setFullName(request.fullName().trim());
            }
            
            // Update allowed fields only
            if (request.mobile() != null) {
                user.setMobile(request.mobile().trim());
            }
            if (request.gender() != null) {
                user.setGender(request.gender());
            }
            
            // Date of Birth: Can only be set ONCE (when null/blank), then locked
            // Allow same value to be sent without error
            if (request.dateOfBirth() != null && !request.dateOfBirth().isBlank()) {
                String existingDob = user.getDateOfBirth();
                boolean dobAlreadySet = existingDob != null && !existingDob.isBlank();
                
                if (dobAlreadySet) {
                    // DOB already exists - only allow if same value is sent
                    if (!existingDob.equals(request.dateOfBirth())) {
                        return ResponseEntity.badRequest()
                                .body(Map.of(
                                    "success", false, 
                                    "message", "Date of birth cannot be changed once set"
                                ));
                    }
                    // Same value - just ignore (no update needed)
                } else {
                    // No DOB yet - set it
                    user.setDateOfBirth(request.dateOfBirth());
                }
            }
            
            // Note: email is NOT updatable

            User updatedUser = userService.save(user);
            
            log.info("Profile updated for user: {}", updatedUser.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Profile updated successfully",
                    "profile", buildProfileResponse(updatedUser)
            ));
        } catch (Exception e) {
            log.error("Error updating profile: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to update profile"));
        }
    }

    /**
     * Update user address (Student or Teacher specific)
     */
    @PutMapping("/profile/address")
    public ResponseEntity<?> updateAddress(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody AddressUpdateRequest request) {
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }

            // Set user type
            if (request.userType() == null || (!request.userType().equals("STUDENT") && !request.userType().equals("TEACHER"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Invalid user type. Must be STUDENT or TEACHER"));
            }
            
            user.setUserType(request.userType());
            
            if (request.userType().equals("STUDENT")) {
                // Validate and set student address
                if (request.hostelName() == null || request.hostelName().isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "Hostel name is required for students"));
                }
                user.setHostelName(request.hostelName());
                user.setRoomNumber(request.roomNumber());
                
                // Clear teacher fields
                user.setBuildingNumber(null);
                user.setDepartment(null);
                user.setStaffRoomNumber(null);
            } else {
                // Validate and set teacher address
                if (request.buildingNumber() == null || request.buildingNumber().isBlank()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("success", false, "message", "Building number is required for teachers"));
                }
                user.setBuildingNumber(request.buildingNumber());
                user.setDepartment(request.department());
                user.setStaffRoomNumber(request.staffRoomNumber());
                
                // Clear student fields
                user.setHostelName(null);
                user.setRoomNumber(null);
            }

            User updatedUser = userService.save(user);
            
            log.info("Address updated for user: {} as {}", updatedUser.getEmail(), request.userType());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Address updated successfully",
                    "address", buildAddressResponse(updatedUser)
            ));
        } catch (Exception e) {
            log.error("Error updating address: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to update address"));
        }
    }

    /**
     * Get user address
     */
    @GetMapping("/profile/address")
    public ResponseEntity<?> getAddress(@RequestHeader("Authorization") String authHeader) {
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "address", buildAddressResponse(user)));
        } catch (Exception e) {
            log.error("Error fetching address: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to fetch address"));
        }
    }

    /**
     * Upload profile image - stores in database as byte array
     */
    @PostMapping("/profile/image")
    public ResponseEntity<?> uploadProfileImage(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {
        try {
            User user = getUserFromToken(authHeader);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }

            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "No file provided"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Only image files are allowed"));
            }

            // Validate file size (max 4MB)
            if (file.getSize() > MAX_IMAGE_SIZE) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "File size must be less than 4MB"));
            }

            // Store image in database
            user.setProfileImageData(file.getBytes());
            user.setProfileImageType(contentType);
            user.setProfileImage("/api/users/profile/image/" + user.getId()); // URL to fetch image
            userService.save(user);

            log.info("Profile image uploaded for user: {}", user.getEmail());

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Profile image uploaded successfully",
                    "imageUrl", "/api/users/profile/image/" + user.getId()
            ));
        } catch (Exception e) {
            log.error("Error uploading profile image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to upload profile image"));
        }
    }

    /**
     * Get profile image from database
     */
    @GetMapping("/profile/image/{userId}")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long userId) {
        try {
            User user = userService.findById(userId).orElse(null);
            if (user == null || user.getProfileImageData() == null) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(user.getProfileImageType()));
            headers.setContentLength(user.getProfileImageData().length);
            headers.setCacheControl(CacheControl.maxAge(java.time.Duration.ofDays(7)));

            return new ResponseEntity<>(user.getProfileImageData(), headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching profile image: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== HELPER METHODS =====
    
    private User getUserFromToken(String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            if (!authService.validateToken(token)) {
                return null;
            }
            Long userId = authService.getUserIdFromToken(token);
            return userService.findById(userId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Extract ID portion from email
     * e.g., d25ce145@charusat.edu.in -> D25CE145
     */
    private String extractIdFromEmail(String email) {
        if (email == null) return "";
        int atIndex = email.indexOf('@');
        if (atIndex > 0) {
            return email.substring(0, atIndex).toUpperCase();
        }
        return email.toUpperCase();
    }

    private Map<String, Object> buildProfileResponse(User user) {
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("mobile", user.getMobile() != null ? user.getMobile() : "");
        profile.put("dateOfBirth", user.getDateOfBirth() != null ? user.getDateOfBirth() : "");
        profile.put("gender", user.getGender() != null ? user.getGender() : "");
        profile.put("profileImage", user.getProfileImage() != null ? user.getProfileImage() : "");
        profile.put("role", user.getRole().name());
        profile.put("userType", user.getUserType() != null ? user.getUserType() : "");
        // Include address info
        profile.put("address", buildAddressResponse(user));
        return profile;
    }
    
    private Map<String, Object> buildAddressResponse(User user) {
        Map<String, Object> address = new HashMap<>();
        address.put("userType", user.getUserType() != null ? user.getUserType() : "");
        address.put("hostelName", user.getHostelName() != null ? user.getHostelName() : "");
        address.put("roomNumber", user.getRoomNumber() != null ? user.getRoomNumber() : "");
        address.put("buildingNumber", user.getBuildingNumber() != null ? user.getBuildingNumber() : "");
        address.put("department", user.getDepartment() != null ? user.getDepartment() : "");
        address.put("staffRoomNumber", user.getStaffRoomNumber() != null ? user.getStaffRoomNumber() : "");
        return address;
    }

    // ===== REQUEST DTOs =====
    
    public record ProfileUpdateRequest(
            String fullName,
            String mobile,
            String gender,
            String dateOfBirth  // Can only be set ONCE, then locked
    ) {}
    
    public record AddressUpdateRequest(
            String userType,      // "STUDENT" or "TEACHER"
            String hostelName,    // For students: H1-H10 or GH1-GH10
            String roomNumber,    // For students
            String buildingNumber, // For teachers: 1-7
            String department,     // For teachers
            String staffRoomNumber // For teachers
    ) {}
}
