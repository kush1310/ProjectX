package com.charusat.canteen.repository;

import com.charusat.canteen.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    
    /**
     * Count failed attempts for an email within a time window
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.email = :email AND la.successful = false AND la.attemptedAt > :since")
    long countFailedAttemptsSince(String email, LocalDateTime since);
    
    /**
     * Count failed attempts from an IP within a time window
     */
    @Query("SELECT COUNT(la) FROM LoginAttempt la WHERE la.ipAddress = :ip AND la.successful = false AND la.attemptedAt > :since")
    long countFailedAttemptsFromIpSince(String ip, LocalDateTime since);
    
    /**
     * Get recent attempts for an email
     */
    List<LoginAttempt> findTop10ByEmailOrderByAttemptedAtDesc(String email);
    
    /**
     * Get recent attempts from an IP
     */
    List<LoginAttempt> findTop10ByIpAddressOrderByAttemptedAtDesc(String ipAddress);
    
    /**
     * Delete old attempts for cleanup
     */
    void deleteByAttemptedAtBefore(LocalDateTime cutoff);
    
    /**
     * Check if there was a successful login after failures
     */
    @Query("SELECT COUNT(la) > 0 FROM LoginAttempt la WHERE la.email = :email AND la.successful = true AND la.attemptedAt > :since")
    boolean hasSuccessfulLoginSince(String email, LocalDateTime since);
}
