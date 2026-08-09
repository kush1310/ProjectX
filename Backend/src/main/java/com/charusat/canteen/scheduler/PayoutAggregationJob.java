package com.charusat.canteen.scheduler;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.Payout;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.PayoutRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PayoutAggregationJob — Scheduled task running daily at 01:00 AM.
 * Aggregates completed orders for the previous period per canteen into payouts table.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PayoutAggregationJob {

    private final CanteenRepository canteenRepository;
    private final PayoutRepository payoutRepository;
    private final JdbcTemplate jdbc;

    @Scheduled(cron = "0 0 1 * * *") // Daily at 1:00 AM
    public void aggregatePayouts() {
        LocalDateTime end = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime start = end.minusDays(1);

        List<Canteen> canteens = canteenRepository.findAll();
        for (Canteen canteen : canteens) {
            BigDecimal gross = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE canteen_id = ? AND status = 'COMPLETED' AND completed_at >= ? AND completed_at < ?",
                    BigDecimal.class, canteen.getId(), start, end);

            if (gross != null && gross.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal fees = gross.multiply(new BigDecimal("0.05")); // 5% platform fee
                BigDecimal net = gross.subtract(fees);

                Payout payout = Payout.builder()
                        .canteenId(canteen.getId())
                        .periodStart(start)
                        .periodEnd(end)
                        .grossAmount(gross)
                        .fees(fees)
                        .netAmount(net)
                        .status(Payout.PayoutStatus.PENDING)
                        .createdAt(LocalDateTime.now())
                        .build();

                payoutRepository.save(payout);
                log.info("Aggregated payout for canteen #{} ({}): gross={}, net={}", canteen.getId(), canteen.getName(), gross, net);
            }
        }
    }
}
