package com.charusat.canteen.repository;

import com.charusat.canteen.model.PasswordHistory;
import com.charusat.canteen.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PasswordHistoryRepository extends JpaRepository<PasswordHistory, Long> {
    
    /**
     * Get last N passwords for a user (ordered by most recent)
     */
    List<PasswordHistory> findTop5ByUserOrderByCreatedAtDesc(User user);
    
    /**
     * Delete old password history (keep only last N)
     */
    @Modifying
    @Query(value = "DELETE FROM password_history WHERE user_id = :userId AND id NOT IN " +
            "(SELECT id FROM (SELECT id FROM password_history WHERE user_id = :userId ORDER BY created_at DESC LIMIT :keepCount) AS recent)", 
            nativeQuery = true)
    void deleteOldHistory(Long userId, int keepCount);
    
    /**
     * Count password history entries for a user
     */
    long countByUser(User user);
}
