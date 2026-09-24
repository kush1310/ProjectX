package com.charusat.canteen.controller;

import com.charusat.canteen.dto.CreateMenuItemRequest;
import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor")
@RequiredArgsConstructor
@CrossOrigin
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('CANTEEN_OWNER', 'ADMIN')")
public class VendorController {

    private final VendorService vendorService;

    // --- Menu Management ---

    @PostMapping("/{canteenId}/menu")
    public ResponseEntity<MenuItem> addMenuItem(
            @PathVariable Long canteenId,
            @RequestBody CreateMenuItemRequest request) {
        MenuItem created = vendorService.addMenuItemWithVariants(
                canteenId, 
                request.getMenuItem(), 
                request.getVariants(), 
                request.getAddonGroups()
        );
        return ResponseEntity.ok(created);
    }

    @PutMapping("/menu/{itemId}")
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable Long itemId,
            @RequestBody MenuItem menuItem) {
        return ResponseEntity.ok(vendorService.updateMenuItem(itemId, menuItem));
    }

    // --- Coupon Management ---

    @PostMapping("/{canteenId}/coupons")
    public ResponseEntity<Coupon> createCoupon(
            @PathVariable Long canteenId,
            @RequestBody Coupon coupon) {
        return ResponseEntity.ok(vendorService.createCoupon(canteenId, coupon));
    }

    @GetMapping("/{canteenId}/coupons")
    public ResponseEntity<List<Coupon>> getCoupons(@PathVariable Long canteenId) {
        return ResponseEntity.ok(vendorService.getCouponsForCanteen(canteenId));
    }
}
