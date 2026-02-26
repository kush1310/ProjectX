package com.charusat.canteen.repository;

import com.charusat.canteen.model.CartItem;
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
public class CartItemRepository {

    private final JdbcTemplate jdbc;

    public CartItemRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private final RowMapper<CartItem> rowMapper = (rs, rowNum) -> {
        CartItem ci = new CartItem();
        ci.setId(rs.getLong("id"));
        long cartId = rs.getLong("cart_id");
        ci.setCartId(rs.wasNull() ? null : cartId);
        long menuItemId = rs.getLong("menu_item_id");
        ci.setMenuItemId(rs.wasNull() ? null : menuItemId);
        ci.setQuantity(rs.getInt("quantity"));
        ci.setUnitPrice(rs.getBigDecimal("unit_price"));
        ci.setSelectedVariant(rs.getString("selected_variant"));
        ci.setSelectedAddons(rs.getString("selected_addons"));
        ci.setSpecialInstructions(rs.getString("special_instructions"));
        return ci;
    };

    public List<CartItem> findByCartId(Long cartId) {
        return jdbc.query("SELECT * FROM cart_items WHERE cart_id = ?", rowMapper, cartId);
    }

    public Optional<CartItem> findByCartIdAndMenuItemId(Long cartId, Long menuItemId) {
        List<CartItem> results = jdbc.query("SELECT * FROM cart_items WHERE cart_id = ? AND menu_item_id = ?",
                rowMapper, cartId, menuItemId);
        return results.stream().findFirst();
    }

    public Optional<CartItem> findById(Long id) {
        List<CartItem> results = jdbc.query("SELECT * FROM cart_items WHERE id = ?", rowMapper, id);
        return results.stream().findFirst();
    }

    public CartItem save(CartItem ci) {
        if (ci.getId() == null) {
            return insert(ci);
        } else {
            return update(ci);
        }
    }

    private CartItem insert(CartItem ci) {
        String sql = "INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, selected_variant, selected_addons, special_instructions) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setObject(1, ci.getCartId());
            ps.setObject(2, ci.getMenuItemId());
            ps.setInt(3, ci.getQuantity());
            ps.setBigDecimal(4, ci.getUnitPrice());
            ps.setString(5, ci.getSelectedVariant());
            ps.setString(6, ci.getSelectedAddons());
            ps.setString(7, ci.getSpecialInstructions());
            return ps;
        }, keyHolder);
        Number key = keyHolder.getKeys() != null ? (Number) keyHolder.getKeys().get("id") : null;
        if (key != null) ci.setId(key.longValue());
        return ci;
    }

    private CartItem update(CartItem ci) {
        jdbc.update("UPDATE cart_items SET quantity=?, unit_price=?, selected_variant=?, selected_addons=?, special_instructions=? WHERE id=?",
                ci.getQuantity(), ci.getUnitPrice(), ci.getSelectedVariant(), ci.getSelectedAddons(),
                ci.getSpecialInstructions(), ci.getId());
        return ci;
    }

    public void deleteByCartId(Long cartId) {
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM cart_items WHERE id = ?", id);
    }
}
