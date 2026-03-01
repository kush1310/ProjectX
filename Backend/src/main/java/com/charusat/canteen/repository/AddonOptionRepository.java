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

    public static final RowMapper<AddonOption> ROW_MAPPER = (rs, rowNum) -> {
        AddonOption o = new AddonOption();
        o.setId(rs.getLong("id"));
        o.setName(rs.getString("name"));
        o.setPrice(rs.getBigDecimal("price"));
        o.setAddonGroupId(rs.getObject("addon_group_id") != null ? rs.getLong("addon_group_id") : null);
        return o;
    };

    public Optional<AddonOption> findById(Long id) {
        List<AddonOption> list = jdbc.query("SELECT * FROM addon_options WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<AddonOption> findAll() {
        return jdbc.query("SELECT * FROM addon_options", ROW_MAPPER);
    }

    public List<AddonOption> findByAddonGroupId(Long addonGroupId) {
        return jdbc.query("SELECT * FROM addon_options WHERE addon_group_id = ?", ROW_MAPPER, addonGroupId);
    }

    public AddonOption save(AddonOption o) {
        if (o.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO addon_options (name, price, addon_group_id) VALUES (?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, o.getName());
                ps.setBigDecimal(2, o.getPrice());
                ps.setObject(3, o.getAddonGroupId());
                return ps;
            }, kh);
            o.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update("UPDATE addon_options SET name=?, price=?, addon_group_id=? WHERE id=?", o.getName(),
                    o.getPrice(), o.getAddonGroupId(), o.getId());
        }
        return o;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM addon_options WHERE id = ?", id);
    }
}
