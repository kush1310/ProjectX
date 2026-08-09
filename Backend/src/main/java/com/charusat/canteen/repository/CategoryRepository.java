package com.charusat.canteen.repository;

import com.charusat.canteen.model.Category;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class CategoryRepository {

    private final JdbcTemplate jdbc;

    public CategoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<Category> ROW_MAPPER = (rs, rowNum) -> {
        Category c = new Category();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setCanteenId(rs.getObject("canteen_id") != null ? rs.getLong("canteen_id") : null);
        try {
            c.setIsAvailable(rs.getObject("is_available") != null ? rs.getBoolean("is_available") : true);
        } catch (Exception e) {
            c.setIsAvailable(true);
        }
        return c;
    };

    public Optional<Category> findById(Long id) {
        List<Category> list = jdbc.query("SELECT * FROM categories WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Category> findAll() {
        return jdbc.query("SELECT * FROM categories", ROW_MAPPER);
    }

    public List<Category> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM categories WHERE canteen_id = ?", ROW_MAPPER, canteenId);
    }

    public boolean existsByNameAndCanteenId(String name, Long canteenId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM categories WHERE name = ? AND canteen_id = ?",
                Integer.class, name, canteenId);
        return count != null && count > 0;
    }

    public Category save(Category c) {
        if (c.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement("INSERT INTO categories (name, canteen_id, is_available) VALUES (?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, c.getName());
                ps.setObject(2, c.getCanteenId());
                ps.setBoolean(3, c.getIsAvailable() != null ? c.getIsAvailable() : true);
                return ps;
            }, kh);
            c.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE categories SET name=?, canteen_id=?, is_available=? WHERE id=?", c.getName(), c.getCanteenId(),
                    c.getIsAvailable() != null ? c.getIsAvailable() : true, c.getId());
        }
        return c;
    }

    public void updateAvailability(Long id, boolean isAvailable) {
        jdbc.update("UPDATE categories SET is_available = ? WHERE id = ?", isAvailable, id);
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM categories WHERE id = ?", id);
    }
}
