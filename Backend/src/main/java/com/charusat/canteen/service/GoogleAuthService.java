package com.charusat.canteen.service;

import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;

/**
 * Google OAuth2 Service
 * Handles token exchange and user profile fetching from Google
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GoogleAuthService {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    @Value("${google.client.id:}")
    private String clientId;

    @Value("${google.client.secret:}")
    private String clientSecret;

    @Value("${google.redirect.uri:http://localhost:5173/auth/callback}")
    private String redirectUri;

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
    private static final String ALLOWED_DOMAIN = "charusat.edu.in";

    /**
     * Exchange authorization code for tokens and get user info
     */
    public GoogleAuthResult authenticateWithGoogle(String authorizationCode) {
        try {
            // Step 1: Exchange code for tokens
            String accessToken = exchangeCodeForToken(authorizationCode);
            
            if (accessToken == null) {
                return GoogleAuthResult.failure("Failed to exchange authorization code");
            }

            // Step 2: Get user info from Google
            GoogleUserInfo userInfo = fetchUserInfo(accessToken);
            
            if (userInfo == null) {
                return GoogleAuthResult.failure("Failed to fetch user info from Google");
            }

            // Step 3: Validate domain
            if (!isValidDomain(userInfo.email())) {
                log.warn("Rejected login attempt from non-CHARUSAT email: {}", userInfo.email());
                return GoogleAuthResult.failure("Only @charusat.edu.in email addresses are allowed");
            }

            // Step 4: Check if user is new before findOrCreate
            boolean isNew = userRepository.findByEmailIgnoreCase(userInfo.email()).isEmpty();
            
            // Step 5: Find or create user
            User user = findOrCreateUser(userInfo);

            // Step 6: Generate JWT token
            String jwtToken = authService.generateToken(user);

            log.info("Google OAuth successful for user: {} (new: {})", userInfo.email(), isNew);
            return GoogleAuthResult.success(user, jwtToken, isNew);

        } catch (Exception e) {
            log.error("Google OAuth error: {}", e.getMessage(), e);
            return GoogleAuthResult.failure("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Exchange authorization code for access token
     */
    private String exchangeCodeForToken(String code) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("code", code);
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("redirect_uri", redirectUri);
            params.add("grant_type", "authorization_code");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(TOKEN_URL, request, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                return jsonNode.get("access_token").asText();
            }

            log.error("Token exchange failed: {}", response.getBody());
            return null;

        } catch (Exception e) {
            log.error("Token exchange error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Fetch user info from Google using access token
     */
    private GoogleUserInfo fetchUserInfo(String accessToken) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<String> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    USER_INFO_URL,
                    HttpMethod.GET,
                    request,
                    String.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                return new GoogleUserInfo(
                        jsonNode.get("id").asText(),
                        jsonNode.get("email").asText(),
                        jsonNode.has("name") ? jsonNode.get("name").asText() : "User",
                        jsonNode.has("picture") ? jsonNode.get("picture").asText() : null
                );
            }

            return null;

        } catch (Exception e) {
            log.error("User info fetch error: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validate email domain
     */
    private boolean isValidDomain(String email) {
        return email != null && email.toLowerCase().endsWith("@" + ALLOWED_DOMAIN);
    }

    /**
     * Find existing user or create new one
     * Industry Standard: OAuth users have null password and authProvider set
     * User's fullName is set to their email ID (e.g., d25ce145 from d25ce145@charusat.edu.in)
     */
    private User findOrCreateUser(GoogleUserInfo userInfo) {
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(userInfo.email());

        // Extract email ID (everything before @) and uppercase it
        String emailId = extractEmailId(userInfo.email());

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            
            // IMPORTANT: Do NOT overwrite profile image if user has custom uploaded image (profileImageData)
            // Only use Google picture if user has NO custom image AND no profile image URL set
            if (user.getProfileImageData() == null && 
                (user.getProfileImage() == null || user.getProfileImage().isEmpty()) &&
                userInfo.picture() != null) {
                user.setProfileImage(userInfo.picture());
            }
            
            // If user was LOCAL but now signing in with Google, update to GOOGLE
            if (user.getAuthProvider() == User.AuthProvider.LOCAL) {
                user.setAuthProvider(User.AuthProvider.GOOGLE);
                user.setPassword(null); // Remove password for OAuth users
                user.setIsEmailVerified(true);
            }
            
            userRepository.save(user);
            return user;
        }

        // Create new Google OAuth user (no password - industry standard)
        // Use email ID as fullName (e.g., D25CE145 from d25ce145@charusat.edu.in)
        User newUser = User.builder()
                .email(userInfo.email().toLowerCase())
                .fullName(emailId) // Use email ID instead of Google name
                .password(null) // NULL password for OAuth users (industry standard)
                .authProvider(User.AuthProvider.GOOGLE)
                .profileImage(userInfo.picture())
                .role(User.UserRole.USER)
                .isEmailVerified(true) // Google emails are verified
                .build();

        return userRepository.save(newUser);
    }
    
    /**
     * Extract email ID from email address (e.g., d25ce145 from d25ce145@charusat.edu.in)
     * Returns uppercase ID
     */
    private String extractEmailId(String email) {
        if (email == null || !email.contains("@")) {
            return "User";
        }
        String id = email.substring(0, email.indexOf("@"));
        return id.toUpperCase();
    }

    // DTOs
    public record GoogleUserInfo(String id, String email, String name, String picture) {}

    public record GoogleAuthResult(
            boolean success,
            String message,
            User user,
            String token,
            boolean isNewUser
    ) {
        public static GoogleAuthResult success(User user, String token, boolean isNewUser) {
            return new GoogleAuthResult(true, "Authentication successful", user, token, isNewUser);
        }

        public static GoogleAuthResult failure(String message) {
            return new GoogleAuthResult(false, message, null, null, false);
        }
    }
}
