package com.charusat.canteen.repository;

import com.charusat.canteen.model.AddonOption;
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
public class AddonOptionRepository {

    private final JdbcTemplate jdbc;

    public AddonOptionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<AddonOption> rowMapper = (rs, rowNum) -> {
        AddonOption ao = new AddonOption();
        ao.setId(rs.getLong("id"));
        ao.setName(rs.getString("name"));
        ao.setPrice(rs.getBigDecimal("price"));
        long addonGroupId = rs.getLong("addon_group_id");
        ao.setAddonGroupId(rs.wasNull() ? null : addonGroupId);
        return ao;
    };

    public List<AddonOption> findByAddonGroupId(Long addonGroupId) {
        return jdbc.query("SELECT * FROM addon_options WHERE addon_group_id = ?", rowMapper, addonGroupId);
    }

    public Optional<AddonOption> findById(Long id) {
        List<AddonOption> results = jdbc.query("SELECT * FROM addon_options WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public List<AddonOption> findAll() {
        return jdbc.query("SELECT * FROM addon_options", rowMapper);
    }

    public AddonOption save(AddonOption ao) {
        if (ao.getId() == null) {
            return insert(ao);
        } else {
            return update(ao);
        }
    }

    private AddonOption insert(AddonOption ao) {
        String sql = "INSERT INTO addon_options (name, price, addon_group_id) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, ao.getName());
            ps.setBigDecimal(2, ao.getPrice());
            ps.setObject(3, ao.getAddonGroupId());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) ao.setId(key.longValue());
        return ao;
    }

    private AddonOption update(AddonOption ao) {
        jdbc.update("UPDATE addon_options SET name=?, price=?, addon_group_id=? WHERE id=?",
                ao.getName(), ao.getPrice(), ao.getAddonGroupId(), ao.getId());
        return ao;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM addon_options WHERE id = ?", id);
    }

    public void deleteByAddonGroupId(Long addonGroupId) {
        jdbc.update("DELETE FROM addon_options WHERE addon_group_id = ?", addonGroupId);
    }
}
