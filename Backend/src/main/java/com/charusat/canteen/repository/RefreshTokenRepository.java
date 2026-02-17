package com.charusat.canteen.repository;

import com.charusat.canteen.model.RefreshToken;
import com.charusat.canteen.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    
    List<RefreshToken> findByUserAndRevokedFalse(User user);
    
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true, rt.revokedAt = :revokedAt, rt.revokedReason = :reason WHERE rt.user = :user AND rt.revoked = false")
    int revokeAllByUser(User user, LocalDateTime revokedAt, String reason);
    
    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.expiresAt < :cutoff")
    int deleteExpiredTokens(LocalDateTime cutoff);
    
    long countByUserAndRevokedFalse(User user);
}
