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

    private final RowMapper<Category> rowMapper = (rs, rowNum) -> {
        Category c = new Category();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        long canteenId = rs.getLong("canteen_id");
        c.setCanteenId(rs.wasNull() ? null : canteenId);
        return c;
    };

    public Optional<Category> findById(Long id) {
        List<Category> results = jdbc.query("SELECT * FROM categories WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public List<Category> findAll() {
        return jdbc.query("SELECT * FROM categories", rowMapper);
    }

    public List<Category> findByCanteenId(Long canteenId) {
        return jdbc.query("SELECT * FROM categories WHERE canteen_id = ?", rowMapper, canteenId);
    }

    public boolean existsByNameAndCanteenId(String name, Long canteenId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM categories WHERE name = ? AND canteen_id = ?",
                Integer.class, name, canteenId);
        return count != null && count > 0;
    }

    public Category save(Category c) {
        if (c.getId() == null) {
            return insert(c);
        } else {
            return update(c);
        }
    }

    private Category insert(Category c) {
        String sql = "INSERT INTO categories (name, canteen_id) VALUES (?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, c.getName());
            ps.setObject(2, c.getCanteenId());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) c.setId(key.longValue());
        return c;
    }

    private Category update(Category c) {
        jdbc.update("UPDATE categories SET name=?, canteen_id=? WHERE id=?", c.getName(), c.getCanteenId(), c.getId());
        return c;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM categories WHERE id = ?", id);
    }
}
