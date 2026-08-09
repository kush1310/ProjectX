package com.charusat.canteen.scheduler;

import com.charusat.canteen.model.User;
import com.charusat.canteen.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * AccountDeletionScheduler — Hourly job that enforces the 5-day soft-delete buffer.
 *
 * Workflow (OWASP-compliant soft delete):
 * 1. User requests account deletion → AuthController sets deletion_requested_at = NOW(),
 *    is_active remains TRUE (user can still log in to cancel within 5 days).
 * 2. If user logs in during the buffer → deletion_requested_at is cleared (recovery).
 * 3. This scheduler runs every hour and flags any account where:
 *       deletion_requested_at IS NOT NULL
 *       AND deletion_requested_at < NOW() - INTERVAL '5 days'
 *    It sets is_active = FALSE on all such accounts, preventing future logins.
 *    Orders and records are preserved for vendor audit trail.
 *
 * @scheduled    Runs every hour (fixedRate = 3600000 ms). Cron: "0 0 * * * *"
 * @transactional Bulk update is wrapped in a single transaction.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AccountDeletionScheduler {

    private final UserRepository userRepository;

    /**
     * flagExpiredDeletionRequests
     *
     * Queries all users whose deletion_requested_at is older than 5 days and whose
     * is_active is still TRUE, then sets is_active = FALSE for each. The account
     * data, including order history, is retained in the database per vendor audit
     * requirements.
     *
     * @returns void - All flagged users are persisted atomically within the transaction.
     * @edge-cases   - No-op if no accounts meet the condition.
     *               - Exceptions are caught per-user to prevent partial failures
     *                 from aborting the entire batch.
     */
    @Scheduled(fixedRate = 3_600_000) // Every 60 minutes
    @Transactional
    public void flagExpiredDeletionRequests() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(5);

        List<User> expiredAccounts = userRepository.findPendingDeletions(cutoffTime);

        if (expiredAccounts.isEmpty()) {
            log.debug("AccountDeletionScheduler: No expired deletion requests found.");
            return;
        }

        log.info("AccountDeletionScheduler: Flagging {} accounts whose 5-day buffer has expired.", expiredAccounts.size());

        for (User user : expiredAccounts) {
            try {
                user.setIsActive(false);
                userRepository.save(user);
                log.info("AccountDeletionScheduler: Account flagged as inactive — userId={}, email={}",
                        user.getId(), user.getEmail());
            } catch (Exception schedulerException) {
                log.error("AccountDeletionScheduler: Failed to flag account userId={} — {}",
                        user.getId(), schedulerException.getMessage());
            }
        }
    }
}
