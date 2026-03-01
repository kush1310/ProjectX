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

    public static final RowMapper<MenuItemVariant> ROW_MAPPER = (rs, rowNum) -> {
        MenuItemVariant v = new MenuItemVariant();
        v.setId(rs.getLong("id"));
        v.setName(rs.getString("name"));
        v.setPrice(rs.getBigDecimal("price"));
        v.setMenuItemId(rs.getObject("menu_item_id") != null ? rs.getLong("menu_item_id") : null);
        return v;
    };

    public Optional<MenuItemVariant> findById(Long id) {
        List<MenuItemVariant> list = jdbc.query("SELECT * FROM menu_item_variants WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<MenuItemVariant> findByMenuItemId(Long menuItemId) {
        return jdbc.query("SELECT * FROM menu_item_variants WHERE menu_item_id = ?", ROW_MAPPER, menuItemId);
    }

    public List<MenuItemVariant> findAll() {
        return jdbc.query("SELECT * FROM menu_item_variants", ROW_MAPPER);
    }

    public MenuItemVariant save(MenuItemVariant v) {
        if (v.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO menu_item_variants (name, price, menu_item_id) VALUES (?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, v.getName());
                ps.setBigDecimal(2, v.getPrice());
                ps.setObject(3, v.getMenuItemId());
                return ps;
            }, kh);
            v.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE menu_item_variants SET name=?, price=?, menu_item_id=? WHERE id=?", v.getName(),
                    v.getPrice(), v.getMenuItemId(), v.getId());
        }
        return v;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM menu_item_variants WHERE id = ?", id);
    }

    public List<MenuItemVariant> saveAll(List<MenuItemVariant> variants) {
        List<MenuItemVariant> result = new java.util.ArrayList<>();
        for (MenuItemVariant v : variants) {
            result.add(save(v));
        }
        return result;
    }
}
