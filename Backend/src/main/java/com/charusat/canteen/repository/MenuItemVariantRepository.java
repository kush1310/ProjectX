package com.charusat.canteen.repository;

import com.charusat.canteen.model.MenuItemVariant;
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
public class MenuItemVariantRepository {

    private final JdbcTemplate jdbc;

    public MenuItemVariantRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<MenuItemVariant> rowMapper = (rs, rowNum) -> {
        MenuItemVariant v = new MenuItemVariant();
        v.setId(rs.getLong("id"));
        v.setName(rs.getString("name"));
        v.setPrice(rs.getBigDecimal("price"));
        long menuItemId = rs.getLong("menu_item_id");
        v.setMenuItemId(rs.wasNull() ? null : menuItemId);
        return v;
    };

    public List<MenuItemVariant> findByMenuItemId(Long menuItemId) {
        return jdbc.query("SELECT * FROM menu_item_variants WHERE menu_item_id = ?", rowMapper, menuItemId);
    }

    public Optional<MenuItemVariant> findById(Long id) {
        List<MenuItemVariant> results = jdbc.query("SELECT * FROM menu_item_variants WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public MenuItemVariant save(MenuItemVariant v) {
        if (v.getId() == null) {
            return insert(v);
        } else {
            return update(v);
        }
    }

    private MenuItemVariant insert(MenuItemVariant v) {
        String sql = "INSERT INTO menu_item_variants (name, price, menu_item_id) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, v.getName());
            ps.setBigDecimal(2, v.getPrice());
            ps.setObject(3, v.getMenuItemId());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) v.setId(key.longValue());
        return v;
    }

    private MenuItemVariant update(MenuItemVariant v) {
        jdbc.update("UPDATE menu_item_variants SET name=?, price=?, menu_item_id=? WHERE id=?",
                v.getName(), v.getPrice(), v.getMenuItemId(), v.getId());
        return v;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM menu_item_variants WHERE id = ?", id);
    }

    public void deleteByMenuItemId(Long menuItemId) {
        jdbc.update("DELETE FROM menu_item_variants WHERE menu_item_id = ?", menuItemId);
    }
}
