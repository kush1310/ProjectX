package com.charusat.canteen.scheduler;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.CanteenSchedule;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.CanteenScheduleRepository;
import com.charusat.canteen.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * CanteenScheduleJob — Scheduled task running every minute.
 * Compares current time against canteens_schedule and auto-flips `is_open`.
 * Broadcasts change on `/topic/canteen/{id}/status`.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CanteenScheduleJob {

    private final CanteenRepository canteenRepository;
    private final CanteenScheduleRepository scheduleRepository;
    private final WebSocketService webSocketService;

    @Scheduled(cron = "0 * * * * *")
    public void evaluateCanteenSchedules() {
        LocalDateTime now = LocalDateTime.now();
        DayOfWeek today = now.getDayOfWeek();
        LocalTime currentTime = now.toLocalTime();

        List<Canteen> canteens = canteenRepository.findAll();
        for (Canteen canteen : canteens) {
            scheduleRepository.findByCanteenIdAndDayOfWeek(canteen.getId(), today.name())
                    .ifPresent(schedule -> {
                        boolean shouldBeOpen = currentTime.isAfter(schedule.getOpenTime()) &&
                                currentTime.isBefore(schedule.getCloseTime());

                        if (canteen.getIsOpen() == null || canteen.getIsOpen() != shouldBeOpen) {
                            canteen.setIsOpen(shouldBeOpen);
                            canteenRepository.save(canteen);
                            log.info("Schedule job auto-flipped canteen #{} ({}) to isOpen={}",
                                    canteen.getId(), canteen.getName(), shouldBeOpen);

                            // Broadcast real-time status update over STOMP
                            webSocketService.notifyCanteenStatusChange(canteen);
                        }
                    });
        }
    }
}
