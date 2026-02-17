package com.charusat.canteen.repository;

import com.charusat.canteen.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User Repository - Database operations for users
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Optional<User> findByEmailAndIsActiveTrue(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByEmailVerificationToken(String token);
}
