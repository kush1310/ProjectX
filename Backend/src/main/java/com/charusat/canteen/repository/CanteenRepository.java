package com.charusat.canteen.repository;

import com.charusat.canteen.model.Canteen;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class CanteenRepository {

    private final JdbcTemplate jdbc;

    public CanteenRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<Canteen> rowMapper = (rs, rowNum) -> {
        Canteen c = new Canteen();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setLocation(rs.getString("location"));
        c.setDescription(rs.getString("description"));
        c.setImageUrl(rs.getString("image_url"));
        c.setIsOpen(rs.getObject("is_open", Boolean.class));
        c.setRushHourEnabled(rs.getObject("rush_hour_enabled", Boolean.class));
        c.setOpeningTime(rs.getString("opening_time"));
        c.setClosingTime(rs.getString("closing_time"));
        c.setFssaiNumber(rs.getString("fssai_number"));
        c.setGstNo(rs.getString("gst_no"));
        c.setBankName(rs.getString("bank_name"));
        c.setAccountNumber(rs.getString("account_number"));
        c.setIfscCode(rs.getString("ifsc_code"));
        c.setAccountHolderName(rs.getString("account_holder_name"));
        c.setKycDocumentUrl(rs.getString("kyc_document_url"));
        long ownerId = rs.getLong("owner_id");
        c.setOwnerId(rs.wasNull() ? null : ownerId);
        Timestamp createdAt = rs.getTimestamp("created_at");
        c.setCreatedAt(createdAt != null ? createdAt.toLocalDateTime() : null);
        return c;
    };

    public Optional<Canteen> findById(Long id) {
        List<Canteen> results = jdbc.query("SELECT * FROM canteens WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM canteens", Long.class);
        return c != null ? c : 0;
    }

    public List<Canteen> findAll() {
        return jdbc.query("SELECT * FROM canteens", rowMapper);
    }

    public List<Canteen> findByIsOpenTrue() {
        return jdbc.query("SELECT * FROM canteens WHERE is_open = true", rowMapper);
    }

    public List<Canteen> findByOwnerId(Long ownerId) {
        return jdbc.query("SELECT * FROM canteens WHERE owner_id = ?", rowMapper, ownerId);
    }

    public List<Canteen> findByNameContainingIgnoreCase(String name) {
        return jdbc.query("SELECT * FROM canteens WHERE LOWER(name) LIKE LOWER(?)", rowMapper, "%" + name + "%");
    }

    public Canteen save(Canteen c) {
        if (c.getId() == null) {
            return insert(c);
        } else {
            return update(c);
        }
    }

    private Canteen insert(Canteen c) {
        String sql = "INSERT INTO canteens (name, location, description, image_url, is_open, rush_hour_enabled, " +
                "opening_time, closing_time, fssai_number, gst_no, bank_name, account_number, ifsc_code, " +
                "account_holder_name, kyc_document_url, owner_id, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, c.getName());
            ps.setString(2, c.getLocation());
            ps.setString(3, c.getDescription());
            ps.setString(4, c.getImageUrl());
            ps.setObject(5, c.getIsOpen() != null ? c.getIsOpen() : true);
            ps.setObject(6, c.getRushHourEnabled() != null ? c.getRushHourEnabled() : false);
            ps.setString(7, c.getOpeningTime());
            ps.setString(8, c.getClosingTime());
            ps.setString(9, c.getFssaiNumber());
            ps.setString(10, c.getGstNo());
            ps.setString(11, c.getBankName());
            ps.setString(12, c.getAccountNumber());
            ps.setString(13, c.getIfscCode());
            ps.setString(14, c.getAccountHolderName());
            ps.setString(15, c.getKycDocumentUrl());
            ps.setObject(16, c.getOwnerId());
            ps.setTimestamp(17, c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) c.setId(key.longValue());
        return c;
    }

    private Canteen update(Canteen c) {
        String sql = "UPDATE canteens SET name=?, location=?, description=?, image_url=?, is_open=?, rush_hour_enabled=?, " +
                "opening_time=?, closing_time=?, fssai_number=?, gst_no=?, bank_name=?, account_number=?, ifsc_code=?, " +
                "account_holder_name=?, kyc_document_url=?, owner_id=? WHERE id=?";
        jdbc.update(sql, c.getName(), c.getLocation(), c.getDescription(), c.getImageUrl(),
                c.getIsOpen(), c.getRushHourEnabled(), c.getOpeningTime(), c.getClosingTime(),
                c.getFssaiNumber(), c.getGstNo(), c.getBankName(), c.getAccountNumber(), c.getIfscCode(),
                c.getAccountHolderName(), c.getKycDocumentUrl(), c.getOwnerId(), c.getId());
        return c;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM canteens WHERE id = ?", id);
    }
}
