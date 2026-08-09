package com.charusat.canteen.repository;

import com.charusat.canteen.model.CartItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    public static final RowMapper<CartItem> ROW_MAPPER = (rs, rowNum) -> {
        CartItem ci = new CartItem();
        ci.setId(rs.getLong("id"));
        ci.setCartId(rs.getObject("cart_id") != null ? rs.getLong("cart_id") : null);
        ci.setMenuItemId(rs.getObject("menu_item_id") != null ? rs.getLong("menu_item_id") : null);
        ci.setQuantity(rs.getInt("quantity"));
        ci.setUnitPrice(rs.getBigDecimal("unit_price"));
        ci.setSelectedVariant(rs.getString("selected_variant"));
        ci.setSelectedAddons(rs.getString("selected_addons"));
        ci.setSpecialInstructions(rs.getString("special_instructions"));
        return ci;
    };

    public Optional<CartItem> findById(Long id) {
        List<CartItem> list = jdbc.query("SELECT * FROM cart_items WHERE id = ?", ROW_MAPPER, id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public List<CartItem> findByCartId(Long cartId) {
        return jdbc.query("SELECT * FROM cart_items WHERE cart_id = ?", ROW_MAPPER, cartId);
    }

    public Optional<CartItem> findByCartIdAndMenuItemId(Long cartId, Long menuItemId) {
        List<CartItem> list = jdbc.query("SELECT * FROM cart_items WHERE cart_id = ? AND menu_item_id = ?", ROW_MAPPER,
                cartId, menuItemId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public CartItem save(CartItem ci) {
        if (ci.getId() == null) {
            KeyHolder kh = new GeneratedKeyHolder();
            jdbc.update(con -> {
                PreparedStatement ps = con.prepareStatement(
                        "INSERT INTO cart_items (cart_id, menu_item_id, quantity, unit_price, selected_variant, selected_addons, special_instructions) VALUES (?,?,?,?,?,?,?)",
                        Statement.RETURN_GENERATED_KEYS);
                ps.setObject(1, ci.getCartId());
                ps.setObject(2, ci.getMenuItemId());
                ps.setInt(3, ci.getQuantity());
                ps.setBigDecimal(4, ci.getUnitPrice());
                ps.setString(5, ci.getSelectedVariant());
                ps.setString(6, ci.getSelectedAddons());
                ps.setString(7, ci.getSpecialInstructions());
                return ps;
            }, kh);
            ci.setId(((Number) kh.getKeys().get("id")).longValue());
        } else {
            jdbc.update(
                    "UPDATE cart_items SET cart_id=?, menu_item_id=?, quantity=?, unit_price=?, selected_variant=?, selected_addons=?, special_instructions=? WHERE id=?",
                    ci.getCartId(), ci.getMenuItemId(), ci.getQuantity(), ci.getUnitPrice(),
                    ci.getSelectedVariant(), ci.getSelectedAddons(), ci.getSpecialInstructions(), ci.getId());
        }
        return ci;
    }

    public void deleteById(Long id) {
        jdbc.update("DELETE FROM cart_items WHERE id = ?", id);
    }

    @Transactional
    public void deleteByCartId(Long cartId) {
        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
    }

    @Transactional
    public void delete(CartItem item) {
        if (item != null && item.getId() != null) {
            deleteById(item.getId());
        }
    }
}
