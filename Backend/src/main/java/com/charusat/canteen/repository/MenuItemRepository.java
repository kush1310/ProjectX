package com.charusat.canteen.repository;

import com.charusat.canteen.model.MenuItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class MenuItemRepository {

    private final JdbcTemplate jdbc;

    public MenuItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<MenuItem> rowMapper = (rs, rowNum) -> {
        MenuItem m = new MenuItem();
        m.setId(rs.getLong("id"));
        m.setName(rs.getString("name"));
        m.setDescription(rs.getString("description"));
        m.setPrice(rs.getBigDecimal("price"));
        m.setCategory(rs.getString("category"));
        m.setSubCategory(rs.getString("sub_category"));
        m.setDisplayOrder(rs.getObject("display_order", Integer.class));
        m.setAvailableFrom(rs.getString("available_from"));
        m.setAvailableTo(rs.getString("available_to"));
        m.setImageUrl(rs.getString("image_url"));
        m.setIsAvailable(rs.getObject("is_available", Boolean.class));
        m.setIsVeg(rs.getObject("is_veg", Boolean.class));
        m.setPreparationTime(rs.getObject("preparation_time", Integer.class));
        m.setSpicyLevel(rs.getObject("spicy_level", Integer.class));
        m.setIsRecommended(rs.getObject("is_recommended", Boolean.class));
        m.setHasVariants(rs.getObject("has_variants", Boolean.class));
        m.setHasAddons(rs.getObject("has_addons", Boolean.class));
        long canteenId = rs.getLong("canteen_id");
        m.setCanteenId(rs.wasNull() ? null : canteenId);
        Timestamp createdAt = rs.getTimestamp("created_at");
        m.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        m.setTags(new ArrayList<>());
        m.setVariants(new ArrayList<>());
        m.setAddonGroups(new ArrayList<>());
        return m;
    };

    public Optional<MenuItem> findById(Long id) {
        List<MenuItem> results = jdbc.query("SELECT * FROM menu_items WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items", Long.class);
        return c != null ? c : 0;
    }

    public List<MenuItem> findAll() {
        return jdbc.query("SELECT * FROM menu_items", rowMapper);
    }

    public List<MenuItem> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ?", rowMapper, canteenId);
    }

    public List<MenuItem> findByCanteenIdAndIsAvailableTrue(Long canteenId) {
        return jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND is_available = true", rowMapper, canteenId);
    }

    public List<MenuItem> findByCanteenIdAndCategory(Long canteenId, String category) {
        return jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND category = ?", rowMapper, canteenId, category);
    }

    public List<MenuItem> findByCanteenIdAndIsVeg(Long canteenId, Boolean isVeg) {
        return jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND is_veg = ?", rowMapper, canteenId, isVeg);
    }

    public List<MenuItem> findByNameContainingIgnoreCase(String name) {
        return jdbc.query("SELECT * FROM menu_items WHERE LOWER(name) LIKE LOWER(?)", rowMapper, "%" + name + "%");
    }

    public MenuItem save(MenuItem m) {
        if (m.getId() == null) {
            return insert(m);
        } else {
            return update(m);
        }
    }

    private MenuItem insert(MenuItem m) {
        String sql = "INSERT INTO menu_items (name, description, price, category, sub_category, display_order, " +
                "available_from, available_to, image_url, is_available, is_veg, preparation_time, spicy_level, " +
                "is_recommended, has_variants, has_addons, canteen_id, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, m.getName());
            ps.setString(2, m.getDescription());
            ps.setBigDecimal(3, m.getPrice());
            ps.setString(4, m.getCategory());
            ps.setString(5, m.getSubCategory());
            ps.setObject(6, m.getDisplayOrder());
            ps.setString(7, m.getAvailableFrom());
            ps.setString(8, m.getAvailableTo());
            ps.setString(9, m.getImageUrl());
            ps.setObject(10, m.getIsAvailable() != null ? m.getIsAvailable() : true);
            ps.setObject(11, m.getIsVeg() != null ? m.getIsVeg() : true);
            ps.setObject(12, m.getPreparationTime());
            ps.setObject(13, m.getSpicyLevel());
            ps.setObject(14, m.getIsRecommended() != null ? m.getIsRecommended() : false);
            ps.setObject(15, m.getHasVariants() != null ? m.getHasVariants() : false);
            ps.setObject(16, m.getHasAddons() != null ? m.getHasAddons() : false);
            ps.setObject(17, m.getCanteenId());
            ps.setTimestamp(18, m.getCreatedAt() != null ? Timestamp.valueOf(m.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) m.setId(key.longValue());
        return m;
    }

    private MenuItem update(MenuItem m) {
        String sql = "UPDATE menu_items SET name=?, description=?, price=?, category=?, sub_category=?, display_order=?, " +
                "available_from=?, available_to=?, image_url=?, is_available=?, is_veg=?, preparation_time=?, spicy_level=?, " +
                "is_recommended=?, has_variants=?, has_addons=?, canteen_id=? WHERE id=?";
        jdbc.update(sql, m.getName(), m.getDescription(), m.getPrice(), m.getCategory(), m.getSubCategory(),
                m.getDisplayOrder(), m.getAvailableFrom(), m.getAvailableTo(), m.getImageUrl(),
                m.getIsAvailable(), m.getIsVeg(), m.getPreparationTime(), m.getSpicyLevel(),
                m.getIsRecommended(), m.getHasVariants(), m.getHasAddons(), m.getCanteenId(), m.getId());
        return m;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM menu_item_tags WHERE menu_item_id = ?", id);
        jdbc.update("DELETE FROM menu_items WHERE id = ?", id);
    }

    // Tags management
    public List<String> findTagsByMenuItemId(Long menuItemId) {
        return jdbc.queryForList("SELECT tag FROM menu_item_tags WHERE menu_item_id = ?", String.class, menuItemId);
    }

    public void saveTagsForMenuItem(Long menuItemId, List<String> tags) {
        jdbc.update("DELETE FROM menu_item_tags WHERE menu_item_id = ?", menuItemId);
        if (tags != null) {
            for (String tag : tags) {
                jdbc.update("INSERT INTO menu_item_tags (menu_item_id, tag) VALUES (?, ?)", menuItemId, tag);
            }
        }
    }
}
