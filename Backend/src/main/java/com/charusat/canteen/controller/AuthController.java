package com.charusat.canteen.controller;

import com.charusat.canteen.model.User;
import com.charusat.canteen.service.AuthService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Auth Controller - Handles authentication endpoints
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Validate email domain
            if (!request.email().toLowerCase().endsWith("@charusat.edu.in")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Use @charusat.edu.in email"));
            }
            
            // Validate password length
            if (request.password().length() < 8 || request.password().length() > 15) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Password must be 8-15 characters"));
            }
            
            User user = userService.register(
                    request.email(),
                    request.password(),
                    request.fullName(),
                    request.mobile()
            );
            
            String token = authService.generateToken(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("token", token);
            response.put("user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "fullName", user.getFullName(),
                    "role", user.getRole().name()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            var userOpt = authService.authenticate(request.email(), request.password());
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String token = authService.generateToken(user);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Login successful");
                response.put("token", token);
                response.put("user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "fullName", user.getFullName(),
                        "role", user.getRole().name()
                ));
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid credentials"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Authentication failed"));
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            
            if (!authService.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("success", false, "message", "Invalid token"));
            }
            
            Long userId = authService.getUserIdFromToken(token);
            var userOpt = userService.findById(userId);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "user", Map.of(
                                "id", user.getId(),
                                "email", user.getEmail(),
                                "fullName", user.getFullName(),
                                "mobile", user.getMobile() != null ? user.getMobile() : "",
                                "role", user.getRole().name()
                        )
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("success", false, "message", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid token"));
        }
    }
    
    // Request DTOs
    public record RegisterRequest(String email, String password, String fullName, String mobile) {}
    public record LoginRequest(String email, String password) {}
}
