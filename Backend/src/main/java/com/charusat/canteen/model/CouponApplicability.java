package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CouponApplicability — Maps coupons to specific menu items.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CouponApplicability {

    private Long id;

    @JsonIgnoreProperties({ "applicableItems", "canteen" })
    private Coupon coupon;
    private java.util.UUID couponId; // For JDBC convenience

    @JsonIgnoreProperties({ "canteen", "variants", "addonGroups", "tags" })
    private MenuItem menuItem;
    private Long menuItemId; // For JDBC convenience

    @Builder.Default
    private Integer requiredQty = 1;
}
