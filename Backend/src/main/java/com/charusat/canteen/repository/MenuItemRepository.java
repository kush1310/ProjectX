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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class MenuItemRepository {

    private final JdbcTemplate jdbc;

    public MenuItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<MenuItem> ROW_MAPPER = (rs, rowNum) -> {
        MenuItem m = new MenuItem();
        m.setId(rs.getLong("id"));
        m.setName(rs.getString("name"));
        m.setDescription(rs.getString("description"));
        m.setPrice(rs.getBigDecimal("price"));
        m.setCategory(rs.getString("category"));
        m.setSubCategory(rs.getString("sub_category"));
        m.setDisplayOrder(rs.getObject("display_order") != null ? rs.getInt("display_order") : null);
        m.setAvailableFrom(rs.getString("available_from"));
        m.setAvailableTo(rs.getString("available_to"));
        m.setImageUrl(rs.getString("image_url"));
        m.setIsAvailable(rs.getObject("is_available", Boolean.class));
        m.setIsVeg(rs.getObject("is_veg", Boolean.class));
        m.setPreparationTime(rs.getObject("preparation_time") != null ? rs.getInt("preparation_time") : null);
        m.setSpicyLevel(rs.getObject("spicy_level") != null ? rs.getInt("spicy_level") : null);
        m.setIsRecommended(rs.getObject("is_recommended", Boolean.class));
        m.setHasVariants(rs.getObject("has_variants", Boolean.class));
        m.setHasAddons(rs.getObject("has_addons", Boolean.class));
        m.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
        m.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        m.setTags(new ArrayList<>());
        m.setVariants(new ArrayList<>());
        m.setAddonGroups(new ArrayList<>());
        return m;
    };

    public Optional<MenuItem> findById(Long id) {
        List<MenuItem> list = jdbc.query("SELECT * FROM menu_items WHERE id = ?", ROW_MAPPER, id);
        if (list.isEmpty())
            return Optional.empty();
        MenuItem m = list.get(0);
        loadTags(m);
        return Optional.of(m);
    }

    public List<MenuItem> findAll() {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items", ROW_MAPPER);
        loadTagsBulk(items);
        return items;
    }

    public List<MenuItem> findByCanteenId(Long canteenId) {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ?", ROW_MAPPER, canteenId);
        loadTagsBulk(items);
        return items;
    }

    public List<MenuItem> findByCanteenIdAndIsAvailableTrue(Long canteenId) {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND is_available = true",
                ROW_MAPPER, canteenId);
        loadTagsBulk(items);
        return items;
    }

    public List<MenuItem> findByCanteenIdAndCategory(Long canteenId, String category) {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND category = ?", ROW_MAPPER,
                canteenId, category);
        loadTagsBulk(items);
        return items;
    }

    public List<MenuItem> findByCanteenIdAndIsVeg(Long canteenId, Boolean isVeg) {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items WHERE canteen_id = ? AND is_veg = ?", ROW_MAPPER,
                canteenId, isVeg);
        loadTagsBulk(items);
        return items;
    }

    public List<MenuItem> findByNameContainingIgnoreCase(String name) {
        List<MenuItem> items = jdbc.query("SELECT * FROM menu_items WHERE LOWER(name) LIKE LOWER(?)", ROW_MAPPER,
                "%" + name + "%");
        loadTagsBulk(items);
        return items;
    }

    public MenuItem save(MenuItem m) {
        if (m.getId() == null) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO menu_items (name, description, price, category, sub_category, display_order, available_from, available_to, image_url, is_available, is_veg, preparation_time, spicy_level, is_recommended, has_variants, has_addons, canteen_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, m.getName());
                ps.setString(2, m.getDescription());
                ps.setBigDecimal(3, m.getPrice());
                ps.setString(4, m.getCategory());
                ps.setString(5, m.getSubCategory());
                ps.setObject(6, m.getDisplayOrder());
                ps.setString(7, m.getAvailableFrom());
                ps.setString(8, m.getAvailableTo());
                ps.setString(9, m.getImageUrl());
                ps.setObject(10, m.getIsAvailable());
                ps.setObject(11, m.getIsVeg());
                ps.setObject(12, m.getPreparationTime());
                ps.setObject(13, m.getSpicyLevel());
                ps.setObject(14, m.getIsRecommended());
                ps.setObject(15, m.getHasVariants());
                ps.setObject(16, m.getHasAddons());
                ps.setObject(17, m.getCanteenId());
                ps.setTimestamp(18, m.getCreatedAt() != null ? Timestamp.valueOf(m.getCreatedAt()) : null);
                return ps;
            }, keyHolder);
            m.setId(((Number) keyHolder.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE menu_items SET name=?, description=?, price=?, category=?, sub_category=?, display_order=?, available_from=?, available_to=?, image_url=?, is_available=?, is_veg=?, preparation_time=?, spicy_level=?, is_recommended=?, has_variants=?, has_addons=?, canteen_id=?, created_at=? WHERE id=?",
                    m.getName(), m.getDescription(), m.getPrice(), m.getCategory(), m.getSubCategory(),
                    m.getDisplayOrder(), m.getAvailableFrom(), m.getAvailableTo(), m.getImageUrl(),
                    m.getIsAvailable(), m.getIsVeg(), m.getPreparationTime(), m.getSpicyLevel(),
                    m.getIsRecommended(), m.getHasVariants(), m.getHasAddons(), m.getCanteenId(),
                    m.getCreatedAt() != null ? Timestamp.valueOf(m.getCreatedAt()) : null,
                    m.getId());
        }
        // Save tags
        saveTags(m);
        return m;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM menu_item_tags WHERE menu_item_id = ?", id);
        jdbc.update("DELETE FROM menu_items WHERE id = ?", id);
    }

    public boolean existsById(Long id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    private void loadTags(MenuItem m) {
        List<String> tags = jdbc.queryForList("SELECT tag FROM menu_item_tags WHERE menu_item_id = ?", String.class,
                m.getId());
        m.setTags(tags);
    }

    private void loadTagsBulk(List<MenuItem> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        Map<Long, MenuItem> itemMap = new HashMap<>();
        for (MenuItem item : items) {
            itemMap.put(item.getId(), item);
        }
        List<Long> ids = new ArrayList<>(itemMap.keySet());
        String placeholders = String.join(",", Collections.nCopies(ids.size(), "?"));
        jdbc.query(
            "SELECT menu_item_id, tag FROM menu_item_tags WHERE menu_item_id IN (" + placeholders + ")",
            rs -> {
                Long menuItemId = rs.getLong("menu_item_id");
                String tag = rs.getString("tag");
                MenuItem item = itemMap.get(menuItemId);
                if (item != null) {
                    item.getTags().add(tag);
                }
            },
            ids.toArray()
        );
    }

    private void saveTags(MenuItem m) {
        jdbc.update("DELETE FROM menu_item_tags WHERE menu_item_id = ?", m.getId());
        if (m.getTags() != null) {
            for (String tag : m.getTags()) {
                jdbc.update("INSERT INTO menu_item_tags (menu_item_id, tag) VALUES (?, ?)", m.getId(), tag);
            }
        }
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM menu_items", Long.class);
        return c != null ? c : 0;
    }
}
