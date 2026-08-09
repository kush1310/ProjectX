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

    public static final RowMapper<Canteen> ROW_MAPPER = (rs, rowNum) -> {
        Canteen c = new Canteen();
        c.setId(rs.getLong("id"));
        c.setName(rs.getString("name"));
        c.setLocation(rs.getString("location"));
        c.setDescription(rs.getString("description"));
        c.setImageUrl(rs.getString("image_url"));
        try {
            c.setLogoUrl(rs.getString("logo_url"));
        } catch (Exception ignored) {}
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
        c.setOwnerId(rs.getObject("owner_id") != null ? rs.getLong("owner_id") : null);
        c.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return c;
    };

    public Optional<Canteen> findById(Long id) {
        List<Canteen> list = jdbc.query("SELECT * FROM canteens WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<Canteen> findAll() {
        return jdbc.query("SELECT * FROM canteens", ROW_MAPPER);
    }

    public List<Canteen> findByIsOpenTrue() {
        return jdbc.query("SELECT * FROM canteens WHERE is_open = true", ROW_MAPPER);
    }

    public List<Canteen> findByOwnerId(Long ownerId) {
        return jdbc.query("SELECT * FROM canteens WHERE owner_id = ?", ROW_MAPPER, ownerId);
    }

    public List<Canteen> findByNameContainingIgnoreCase(String name) {
        return jdbc.query("SELECT * FROM canteens WHERE LOWER(name) LIKE LOWER(?)", ROW_MAPPER, "%" + name + "%");
    }

    public Canteen save(Canteen c) {
        if (c.getId() == null) {
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO canteens (name, location, description, image_url, logo_url, is_open, rush_hour_enabled, opening_time, closing_time, fssai_number, gst_no, bank_name, account_number, ifsc_code, account_holder_name, kyc_document_url, owner_id, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, c.getName());
                ps.setString(2, c.getLocation());
                ps.setString(3, c.getDescription());
                ps.setString(4, c.getImageUrl());
                ps.setString(5, c.getLogoUrl());
                ps.setObject(6, c.getIsOpen());
                ps.setObject(7, c.getRushHourEnabled());
                ps.setString(8, c.getOpeningTime());
                ps.setString(9, c.getClosingTime());
                ps.setString(10, c.getFssaiNumber());
                ps.setString(11, c.getGstNo());
                ps.setString(12, c.getBankName());
                ps.setString(13, c.getAccountNumber());
                ps.setString(14, c.getIfscCode());
                ps.setString(15, c.getAccountHolderName());
                ps.setString(16, c.getKycDocumentUrl());
                ps.setObject(17, c.getOwnerId());
                ps.setTimestamp(18, c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null);
                return ps;
            }, keyHolder);
            c.setId(((Number) keyHolder.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE canteens SET name=?, location=?, description=?, image_url=?, logo_url=?, is_open=?, rush_hour_enabled=?, opening_time=?, closing_time=?, fssai_number=?, gst_no=?, bank_name=?, account_number=?, ifsc_code=?, account_holder_name=?, kyc_document_url=?, owner_id=?, created_at=? WHERE id=?",
                    c.getName(), c.getLocation(), c.getDescription(), c.getImageUrl(), c.getLogoUrl(), c.getIsOpen(),
                    c.getRushHourEnabled(),
                    c.getOpeningTime(), c.getClosingTime(), c.getFssaiNumber(), c.getGstNo(), c.getBankName(),
                    c.getAccountNumber(), c.getIfscCode(), c.getAccountHolderName(), c.getKycDocumentUrl(),
                    c.getOwnerId(), c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : null,
                    c.getId());
        }
        return c;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM canteens WHERE id = ?", id);
    }

    public boolean existsById(Long id) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM canteens WHERE id = ?", Integer.class, id);
        return count != null && count > 0;
    }

    public long count() {
        Long c = jdbc.queryForObject("SELECT COUNT(*) FROM canteens", Long.class);
        return c != null ? c : 0;
    }
}
