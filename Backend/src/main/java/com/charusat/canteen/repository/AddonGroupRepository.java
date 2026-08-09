package com.charusat.canteen.repository;

import com.charusat.canteen.model.AddonGroup;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class AddonGroupRepository {

    private final JdbcTemplate jdbc;

    public AddonGroupRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<AddonGroup> ROW_MAPPER = (rs, rowNum) -> {
        AddonGroup g = new AddonGroup();
        g.setId(rs.getLong("id"));
        g.setName(rs.getString("name"));
        g.setMinSelection(rs.getObject("min_selection") != null ? rs.getInt("min_selection") : null);
        g.setMaxSelection(rs.getObject("max_selection") != null ? rs.getInt("max_selection") : null);
        g.setMenuItemId(rs.getObject("menu_item_id") != null ? rs.getLong("menu_item_id") : null);
        g.setOptions(new ArrayList<>());
        return g;
    };

    public Optional<AddonGroup> findById(Long id) {
        List<AddonGroup> list = jdbc.query("SELECT * FROM addon_groups WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<AddonGroup> findByMenuItemId(Long menuItemId) {
        return jdbc.query("SELECT * FROM addon_groups WHERE menu_item_id = ?", ROW_MAPPER, menuItemId);
    }

    public List<AddonGroup> findAll() {
        return jdbc.query("SELECT * FROM addon_groups", ROW_MAPPER);
    }

    public AddonGroup save(AddonGroup g) {
        if (g.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO addon_groups (name, min_selection, max_selection, menu_item_id) VALUES (?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, g.getName());
                ps.setObject(2, g.getMinSelection());
                ps.setObject(3, g.getMaxSelection());
                ps.setObject(4, g.getMenuItemId());
                return ps;
            }, kh);
            g.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE addon_groups SET name=?, min_selection=?, max_selection=?, menu_item_id=? WHERE id=?",
                    g.getName(), g.getMinSelection(), g.getMaxSelection(), g.getMenuItemId(), g.getId());
        }
        return g;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM addon_groups WHERE id = ?", id);
    }
}
