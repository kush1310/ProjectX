package com.charusat.canteen.repository;

import com.charusat.canteen.model.Payout;
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
public class PayoutRepository {

    private final JdbcTemplate jdbc;

    public PayoutRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public static final RowMapper<Payout> ROW_MAPPER = (rs, rowNum) -> {
        Payout p = new Payout();
        p.setId(rs.getLong("id"));
        p.setCanteenId(rs.getLong("canteen_id"));
        p.setPeriodStart(rs.getTimestamp("period_start") != null ? rs.getTimestamp("period_start").toLocalDateTime() : null);
        p.setPeriodEnd(rs.getTimestamp("period_end") != null ? rs.getTimestamp("period_end").toLocalDateTime() : null);
        p.setGrossAmount(rs.getBigDecimal("gross_amount"));
        p.setFees(rs.getBigDecimal("fees"));
        p.setNetAmount(rs.getBigDecimal("net_amount"));
        String st = rs.getString("status");
        p.setStatus(st != null ? Payout.PayoutStatus.valueOf(st) : Payout.PayoutStatus.PENDING);
        p.setPaidAt(rs.getTimestamp("paid_at") != null ? rs.getTimestamp("paid_at").toLocalDateTime() : null);
        p.setCreatedAt(rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null);
        return p;
    };

    public Optional<Payout> findById(Long id) {
        List<Payout> list = jdbc.query("SELECT * FROM payouts WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Page<Payout> findByCanteenId(Long canteenId, Pageable pageable) {
        Long count = jdbc.queryForObject("SELECT COUNT(*) FROM payouts WHERE canteen_id = ?", Long.class, canteenId);
        long total = count != null ? count : 0;
        List<Payout> content = jdbc.query("SELECT * FROM payouts WHERE canteen_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?", ROW_MAPPER, canteenId, pageable.getPageSize(), pageable.getOffset());
        return new PageImpl<>(content, pageable, total);
    }

    public Payout save(Payout p) {
        if (p.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO payouts (canteen_id, period_start, period_end, gross_amount, fees, net_amount, status, paid_at, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setLong(1, p.getCanteenId());
                ps.setTimestamp(2, p.getPeriodStart() != null ? Timestamp.valueOf(p.getPeriodStart()) : null);
                ps.setTimestamp(3, p.getPeriodEnd() != null ? Timestamp.valueOf(p.getPeriodEnd()) : null);
                ps.setBigDecimal(4, p.getGrossAmount());
                ps.setBigDecimal(5, p.getFees());
                ps.setBigDecimal(6, p.getNetAmount());
                ps.setString(7, p.getStatus() != null ? p.getStatus().name() : "PENDING");
                ps.setTimestamp(8, p.getPaidAt() != null ? Timestamp.valueOf(p.getPaidAt()) : null);
                ps.setTimestamp(9, p.getCreatedAt() != null ? Timestamp.valueOf(p.getCreatedAt()) : Timestamp.valueOf(java.time.LocalDateTime.now()));
                return ps;
            }, kh);
            p.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE payouts SET canteen_id=?, period_start=?, period_end=?, gross_amount=?, fees=?, net_amount=?, status=?, paid_at=? WHERE id=?",
                    p.getCanteenId(),
                    p.getPeriodStart() != null ? Timestamp.valueOf(p.getPeriodStart()) : null,
                    p.getPeriodEnd() != null ? Timestamp.valueOf(p.getPeriodEnd()) : null,
                    p.getGrossAmount(), p.getFees(), p.getNetAmount(),
                    p.getStatus() != null ? p.getStatus().name() : "PENDING",
                    p.getPaidAt() != null ? Timestamp.valueOf(p.getPaidAt()) : null,
                    p.getId());
        }
        return p;
    }
}
