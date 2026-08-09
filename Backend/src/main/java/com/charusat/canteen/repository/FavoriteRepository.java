package com.charusat.canteen.repository;

import com.charusat.canteen.model.Favorite;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class FavoriteRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Favorite> ROW_MAPPER = (rs, rowNum) -> {
        Favorite f = new Favorite();
        f.setId(rs.getLong("id"));
        f.setUserId(rs.getLong("user_id"));
        f.setMenuItemId(rs.getLong("menu_item_id"));
        f.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return f;
    };

    public List<Long> findMenuItemIdsByUserId(Long userId) {
        return jdbc.queryForList("SELECT menu_item_id FROM favorites WHERE user_id = ?", Long.class, userId);
    }

    public List<Favorite> findByUserId(Long userId) {
        return jdbc.query("SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC", ROW_MAPPER, userId);
    }

    public Optional<Favorite> findByUserIdAndMenuItemId(Long userId, Long menuItemId) {
        List<Favorite> list = jdbc.query(
                "SELECT * FROM favorites WHERE user_id = ? AND menu_item_id = ?",
                ROW_MAPPER, userId, menuItemId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public boolean existsByUserIdAndMenuItemId(Long userId, Long menuItemId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM favorites WHERE user_id = ? AND menu_item_id = ?",
                Integer.class, userId, menuItemId);
        return count != null && count > 0;
    }

    public Favorite save(Long userId, Long menuItemId) {
        jdbc.update("INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                userId, menuItemId);
        List<Favorite> list = jdbc.query(
                "SELECT * FROM favorites WHERE user_id = ? AND menu_item_id = ?",
                ROW_MAPPER, userId, menuItemId);
        return list.isEmpty() ? null : list.get(0);
    }

    public void deleteByUserIdAndMenuItemId(Long userId, Long menuItemId) {
        jdbc.update("DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?", userId, menuItemId);
    }

    public int countByUserId(Long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM favorites WHERE user_id = ?", Integer.class, userId);
        return count != null ? count : 0;
    }

    // ── Canteen-level bookmark methods ──
    // Convention: canteen favorites are stored with menu_item_id = -canteenId (negative)
    // This avoids a schema migration and keeps everything in one table.

    /**
     * Returns a list of canteen IDs (as positive numbers) that the user has bookmarked.
     */
    public List<Long> findCanteenIdsByUserId(Long userId) {
        List<Long> raw = jdbc.queryForList(
                "SELECT menu_item_id FROM favorites WHERE user_id = ? AND menu_item_id < 0",
                Long.class, userId);
        return raw.stream().map(v -> -v).collect(java.util.stream.Collectors.toList());
    }

    public boolean existsByUserIdAndCanteenId(Long userId, Long canteenId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM favorites WHERE user_id = ? AND menu_item_id = ?",
                Integer.class, userId, -canteenId);
        return count != null && count > 0;
    }

    public void saveCanteenFavorite(Long userId, Long canteenId) {
        jdbc.update("INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                userId, -canteenId);
    }

    public void deleteCanteenFavorite(Long userId, Long canteenId) {
        jdbc.update("DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?", userId, -canteenId);
    }
}
