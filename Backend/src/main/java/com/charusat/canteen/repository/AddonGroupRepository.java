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

    private final RowMapper<AddonGroup> rowMapper = (rs, rowNum) -> {
        AddonGroup ag = new AddonGroup();
        ag.setId(rs.getLong("id"));
        ag.setName(rs.getString("name"));
        ag.setMinSelection(rs.getObject("min_selection", Integer.class));
        ag.setMaxSelection(rs.getObject("max_selection", Integer.class));
        long menuItemId = rs.getLong("menu_item_id");
        ag.setMenuItemId(rs.wasNull() ? null : menuItemId);
        ag.setOptions(new ArrayList<>());
        return ag;
    };

    public List<AddonGroup> findByMenuItemId(Long menuItemId) {
        return jdbc.query("SELECT * FROM addon_groups WHERE menu_item_id = ?", rowMapper, menuItemId);
    }

    public Optional<AddonGroup> findById(Long id) {
        List<AddonGroup> results = jdbc.query("SELECT * FROM addon_groups WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public AddonGroup save(AddonGroup ag) {
        if (ag.getId() == null) {
            return insert(ag);
        } else {
            return update(ag);
        }
    }

    private AddonGroup insert(AddonGroup ag) {
        String sql = "INSERT INTO addon_groups (name, min_selection, max_selection, menu_item_id) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ag.getName());
            ps.setObject(2, ag.getMinSelection());
            ps.setObject(3, ag.getMaxSelection());
            ps.setObject(4, ag.getMenuItemId());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) ag.setId(key.longValue());
        return ag;
    }

    private AddonGroup update(AddonGroup ag) {
        jdbc.update("UPDATE addon_groups SET name=?, min_selection=?, max_selection=?, menu_item_id=? WHERE id=?",
                ag.getName(), ag.getMinSelection(), ag.getMaxSelection(), ag.getMenuItemId(), ag.getId());
        return ag;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM addon_groups WHERE id = ?", id);
    }

    public void deleteByMenuItemId(Long menuItemId) {
        jdbc.update("DELETE FROM addon_groups WHERE menu_item_id = ?", menuItemId);
    }
}
