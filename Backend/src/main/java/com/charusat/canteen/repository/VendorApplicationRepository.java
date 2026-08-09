package com.charusat.canteen.repository;

import com.charusat.canteen.model.VendorApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
public class VendorApplicationRepository {

    private final JdbcTemplate jdbc;

    public VendorApplicationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<VendorApplication> ROW_MAPPER = (rs, rowNum) -> {
        VendorApplication app = new VendorApplication();
        app.setId(rs.getLong("id"));
        app.setApplicantName(rs.getString("applicant_name"));
        app.setEmail(rs.getString("email"));
        app.setPhone(rs.getString("phone"));
        app.setCanteenName(rs.getString("canteen_name"));
        app.setCanteenType(rs.getString("canteen_type"));
        app.setDescription(rs.getString("description"));
        app.setAddress(rs.getString("address"));
        app.setBankName(rs.getString("bank_name"));
        app.setAccountNumberEnc(rs.getString("account_number_enc"));
        app.setIfscCodeEnc(rs.getString("ifsc_code_enc"));
        app.setFssaiLicenseEnc(rs.getString("fssai_license_enc"));
        String statusStr = rs.getString("status");
        app.setStatus(statusStr != null ? VendorApplication.ApplicationStatus.valueOf(statusStr) : VendorApplication.ApplicationStatus.SUBMITTED);
        app.setSubmittedAt(rs.getTimestamp("submitted_at") != null ? rs.getTimestamp("submitted_at").toLocalDateTime() : null);
        app.setReviewedBy(rs.getObject("reviewed_by") != null ? rs.getLong("reviewed_by") : null);
        app.setReviewedAt(rs.getTimestamp("reviewed_at") != null ? rs.getTimestamp("reviewed_at").toLocalDateTime() : null);
        app.setRejectionReason(rs.getString("rejection_reason"));
        return app;
    };

    public Optional<VendorApplication> findById(Long id) {
        List<VendorApplication> list = jdbc.query("SELECT * FROM vendor_applications WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Page<VendorApplication> findAll(Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM vendor_applications", Long.class);
        long total = count != null ? count : 0;
        List<VendorApplication> content = jdbc.query("SELECT * FROM vendor_applications ORDER BY submitted_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, pageable.getPageSize(), pageable.getOffset());
        return new PageImpl<>(content, pageable, total);
    }

    public VendorApplication save(VendorApplication app) {
        if (app.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO vendor_applications (applicant_name, email, phone, canteen_name, canteen_type, description, address, bank_name, account_number_enc, ifsc_code_enc, fssai_license_enc, status, submitted_at, reviewed_by, reviewed_at, rejection_reason) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, app.getApplicantName());
                ps.setString(2, app.getEmail());
                ps.setString(3, app.getPhone());
                ps.setString(4, app.getCanteenName());
                ps.setString(5, app.getCanteenType());
                ps.setString(6, app.getDescription());
                ps.setString(7, app.getAddress());
                ps.setString(8, app.getBankName());
                ps.setString(9, app.getAccountNumberEnc());
                ps.setString(10, app.getIfscCodeEnc());
                ps.setString(11, app.getFssaiLicenseEnc());
                ps.setString(12, app.getStatus() != null ? app.getStatus().name() : "SUBMITTED");
                ps.setTimestamp(13, app.getSubmittedAt() != null ? Timestamp.valueOf(app.getSubmittedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
                ps.setObject(14, app.getReviewedBy());
                ps.setTimestamp(15, app.getReviewedAt() != null ? Timestamp.valueOf(app.getReviewedAt()) : null);
                ps.setString(16, app.getRejectionReason());
                return ps;
            }, kh);
            app.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE vendor_applications SET applicant_name=?, email=?, phone=?, canteen_name=?, canteen_type=?, description=?, address=?, bank_name=?, account_number_enc=?, ifsc_code_enc=?, fssai_license_enc=?, status=?, reviewed_by=?, reviewed_at=?, rejection_reason=? WHERE id=?",
                    app.getApplicantName(), app.getEmail(), app.getPhone(), app.getCanteenName(), app.getCanteenType(),
                    app.getDescription(), app.getAddress(), app.getBankName(), app.getAccountNumberEnc(), app.getIfscCodeEnc(), app.getFssaiLicenseEnc(),
                    app.getStatus() != null ? app.getStatus().name() : "SUBMITTED", app.getReviewedBy(),
                    app.getReviewedAt() != null ? Timestamp.valueOf(app.getReviewedAt()) : null, app.getRejectionReason(), app.getId());
        }
        return app;
    }
}
