package com.charusat.canteen.service;

import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Service - Business logic for user management
 */
@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    @Transactional
    public User register(String email, String password, String fullName, String mobile) {
        if (existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }
        
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .mobile(mobile)
                .role(User.UserRole.USER)
                .build();
        
        return userRepository.save(user);
    }
    
    @Transactional
    public User createAdmin(String email, String password, String fullName, String mobile) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .fullName(fullName)
                .mobile(mobile)
                .role(User.UserRole.ADMIN)
                .build();
        
        return userRepository.save(user);
    }
    
    @Transactional
    public void updateLastLogin(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    @Transactional
    public User updateUser(Long id, String fullName, String mobile) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setFullName(fullName);
        user.setMobile(mobile);
        return userRepository.save(user);
    }
    
    public boolean validatePassword(User user, String rawPassword) {
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
}
