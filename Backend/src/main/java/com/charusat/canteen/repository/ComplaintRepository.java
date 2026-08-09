package com.charusat.canteen.repository;

import com.charusat.canteen.model.Complaint;
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

/**
 * ComplaintRepository
 *
 * JDBC-based persistence layer for the complaints table.
 * All queries use parameterised statements — no raw string concatenation.
 */
@Repository
public class ComplaintRepository {

    private final JdbcTemplate jdbc;

    public ComplaintRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<Complaint> ROW_MAPPER = (rs, rowNum) -> {
        Complaint c = new Complaint();
        c.setId(rs.getLong("id"));
        c.setReferenceId(rs.getString("reference_id"));
        c.setCustomerId(rs.getObject("customer_id") != null ? rs.getLong("customer_id") : null);
        c.setCanteenId(rs.getObject("canteen_id")  != null ? rs.getLong("canteen_id")  : null);
        c.setOrderId(rs.getObject("order_id")      != null ? rs.getLong("order_id")    : null);
        c.setOrderNumber(rs.getString("order_number"));
        c.setSubject(rs.getString("subject"));
        c.setDescription(rs.getString("description"));
        String rawStatus = rs.getString("status");
        c.setStatus(rawStatus != null ? Complaint.ComplaintStatus.valueOf(rawStatus) : Complaint.ComplaintStatus.OPEN);
        c.setVendorReply(rs.getString("vendor_reply"));
        c.setRepliedAt(rs.getTimestamp("replied_at") != null ? rs.getTimestamp("replied_at").toLocalDateTime() : null);
        c.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        c.setUpdatedAt(rs.getTimestamp("updated_at") != null ? rs.getTimestamp("updated_at").toLocalDateTime() : null);
        return c;
    };

    /**
     * save — insert (id == null) or update (id != null) a complaint record.
     *
     * @param c {Complaint} — Complaint entity to persist; id is set on insert.
     * @returns {Complaint} — The persisted entity with id populated.
     */
    public Complaint save(Complaint c) {
        if (c.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO complaints (reference_id, customer_id, canteen_id, order_id, order_number, subject, description, status, vendor_reply, replied_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setString(1, c.getReferenceId());
                ps.setObject(2, c.getCustomerId());
                ps.setObject(3, c.getCanteenId());
                ps.setObject(4, c.getOrderId());
                ps.setString(5, c.getOrderNumber());
                ps.setString(6, c.getSubject());
                ps.setString(7, c.getDescription());
                ps.setString(8, c.getStatus() != null ? c.getStatus().name() : Complaint.ComplaintStatus.OPEN.name());
                ps.setString(9, c.getVendorReply());
                ps.setTimestamp(10, c.getRepliedAt() != null ? Timestamp.valueOf(c.getRepliedAt()) : null);
                ps.setTimestamp(11, c.getCreatedAt() != null ? Timestamp.valueOf(c.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
                ps.setTimestamp(12, c.getUpdatedAt() != null ? Timestamp.valueOf(c.getUpdatedAt()) : null);
                return ps;
            }, kh);
            c.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE complaints SET reference_id=?, customer_id=?, canteen_id=?, order_id=?, order_number=?, subject=?, description=?, status=?, vendor_reply=?, replied_at=?, updated_at=? WHERE id=?",
                    c.getReferenceId(), c.getCustomerId(), c.getCanteenId(), c.getOrderId(),
                    c.getOrderNumber(), c.getSubject(), c.getDescription(),
                    c.getStatus() != null ? c.getStatus().name() : Complaint.ComplaintStatus.OPEN.name(),
                    c.getVendorReply(),
                    c.getRepliedAt()  != null ? Timestamp.valueOf(c.getRepliedAt())  : null,
                    Timestamp.valueOf(java.time.LocalDateTime.now()),
                    c.getId());
        }
        return c;
    }

    public Optional<Complaint> findById(Long id) {
        List<Complaint> list = jdbc.query("SELECT * FROM complaints WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /** Returns all complaints raised by a specific customer, newest first. */
    public List<Complaint> findByCustomerIdOrderByCreatedAtDesc(Long customerId) {
        return jdbc.query("SELECT * FROM complaints WHERE customer_id = ? ORDER BY created_at DESC", ROW_MAPPER, customerId);
    }

    /** Returns all complaints targeting a specific canteen, newest first. Used by vendor dashboard. */
    public List<Complaint> findByCanteenIdOrderByCreatedAtDesc(Long canteenId) {
        return jdbc.query("SELECT * FROM complaints WHERE canteen_id = ? ORDER BY created_at DESC", ROW_MAPPER, canteenId);
    }

    /** Returns complaints for a specific order — used to prevent duplicate submissions. */
    public List<Complaint> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM complaints WHERE order_id = ?", ROW_MAPPER, orderId);
    }

    public Optional<Complaint> findByReferenceId(String referenceId) {
        List<Complaint> list = jdbc.query("SELECT * FROM complaints WHERE reference_id = ?", ROW_MAPPER, referenceId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /**
     * findByVendorUserId — returns all complaints for the canteen owned by a given vendor user.
     * Resolves the canteen via canteens.owner_id JOIN.
     *
     * @param vendorUserId {Long} - The vendor's user ID (owner_id in canteens table).
     * @returns {List<Complaint>} — Complaints for the vendor's canteen, newest first.
     */
    public List<Complaint> findByVendorUserId(Long vendorUserId) {
        String sql = "SELECT comp.* FROM complaints comp "
                + "INNER JOIN canteens c ON c.id = comp.canteen_id "
                + "WHERE c.owner_id = ? "
                + "ORDER BY comp.created_at DESC";
        return jdbc.query(sql, ROW_MAPPER, vendorUserId);
    }

    public org.springframework.data.domain.Page<Complaint> findByVendorUserId(Long vendorUserId, org.springframework.data.domain.Pageable pageable) {
        String countSql = "SELECT COUNT(*) FROM complaints comp INNER JOIN canteens c ON c.id = comp.canteen_id WHERE c.owner_id = ?";
        Long count = jdbc.queryForObject(countSql, Long.class, vendorUserId);
        long total = count != null ? count : 0;
        String sql = "SELECT comp.* FROM complaints comp INNER JOIN canteens c ON c.id = comp.canteen_id WHERE c.owner_id = ? ORDER BY comp.created_at DESC LIMIT ? OFFSET ?";
        List<Complaint> content = jdbc.query(sql, ROW_MAPPER, vendorUserId, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public org.springframework.data.domain.Page<Complaint> findByCanteenId(Long canteenId, org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM complaints WHERE canteen_id = ?", Long.class, canteenId);
        long total = count != null ? count : 0;
        List<Complaint> content = jdbc.query("SELECT * FROM complaints WHERE canteen_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, canteenId, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public org.springframework.data.domain.Page<Complaint> findByCustomerId(Long customerId, org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM complaints WHERE customer_id = ?", Long.class, customerId);
        long total = count != null ? count : 0;
        List<Complaint> content = jdbc.query("SELECT * FROM complaints WHERE customer_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, customerId, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    public org.springframework.data.domain.Page<Complaint> findAll(org.springframework.data.domain.Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM complaints", Long.class);
        long total = count != null ? count : 0;
        List<Complaint> content = jdbc.query("SELECT * FROM complaints ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, pageable.getPageSize(), pageable.getOffset());
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }
}
