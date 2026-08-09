package com.charusat.canteen.repository;

import com.charusat.canteen.model.CanteenSchedule;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.util.List;
import java.util.Optional;

@Repository
public class CanteenScheduleRepository {

    private final JdbcTemplate jdbc;

    public CanteenScheduleRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<CanteenSchedule> ROW_MAPPER = (rs, rowNum) -> {
        CanteenSchedule s = new CanteenSchedule();
        s.setId(rs.getLong("id"));
        s.setCanteenId(rs.getLong("canteen_id"));
        s.setDayOfWeek(rs.getString("day_of_week"));
        s.setOpenTime(rs.getTime("open_time") != null ? rs.getTime("open_time").toLocalTime() : null);
        s.setCloseTime(rs.getTime("close_time") != null ? rs.getTime("close_time").toLocalTime() : null);
        return s;
    };

    public List<CanteenSchedule> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM canteens_schedule WHERE canteen_id = ?", ROW_MAPPER, canteenId);
    }

    public Optional<CanteenSchedule> findByCanteenIdAndDayOfWeek(Long canteenId, String dayOfWeek) {
        List<CanteenSchedule> list = jdbc.query(
                "SELECT * FROM canteens_schedule WHERE canteen_id = ? AND UPPER(day_of_week) = UPPER(?)",
                ROW_MAPPER, canteenId, dayOfWeek);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public void save(CanteenSchedule schedule) {
        jdbc.update(
                "INSERT INTO canteens_schedule (canteen_id, day_of_week, open_time, close_time) VALUES (?,?,?,?) " +
                "ON CONFLICT (canteen_id, day_of_week) DO UPDATE SET open_time = EXCLUDED.open_time, close_time = EXCLUDED.close_time",
                schedule.getCanteenId(),
                schedule.getDayOfWeek().toUpperCase(),
                schedule.getOpenTime() != null ? Time.valueOf(schedule.getOpenTime()) : null,
                schedule.getCloseTime() != null ? Time.valueOf(schedule.getCloseTime()) : null);
    }

    public void deleteByCanteenId(Long canteenId) {
        jdbc.update("DELETE FROM canteens_schedule WHERE canteen_id = ?", canteenId);
    }

    public List<CanteenSchedule> findAll() {
        return jdbc.query("SELECT * FROM canteens_schedule", ROW_MAPPER);
    }
}
