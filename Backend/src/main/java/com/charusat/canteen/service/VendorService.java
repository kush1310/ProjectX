package com.charusat.canteen.service;

import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final MenuItemRepository menuItemRepository;
    private final CouponRepository couponRepository;
    private final CanteenRepository canteenRepository;

    // --- Menu Management ---

    @Transactional
    public MenuItem addMenuItemWithVariants(Long canteenId, MenuItem menuItem, List<MenuItemVariant> variants, List<AddonGroup> addonGroups) {
        Canteen canteen = canteenRepository.findById(canteenId)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        menuItem.setCanteen(canteen);
        
        // Link variants
        if (variants != null) {
            variants.forEach(v -> v.setMenuItem(menuItem));
            menuItem.setVariants(variants);
        }
        
        // Link addons
        if (addonGroups != null) {
            addonGroups.forEach(group -> {
                group.setMenuItem(menuItem);
                if (group.getOptions() != null) {
                    group.getOptions().forEach(addon -> addon.setAddonGroup(group));
                }
            });
            menuItem.setAddonGroups(addonGroups);
        }
        
        return menuItemRepository.save(menuItem);
    }

    @Transactional
    public MenuItem updateMenuItem(Long id, MenuItem updatedItem) {
        MenuItem existing = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
        
        existing.setName(updatedItem.getName());
        existing.setDescription(updatedItem.getDescription());
        existing.setPrice(updatedItem.getPrice());
        existing.setCategory(updatedItem.getCategory());
        existing.setImageUrl(updatedItem.getImageUrl());
        existing.setIsAvailable(updatedItem.getIsAvailable());
        existing.setIsVeg(updatedItem.getIsVeg());
        existing.setPreparationTime(updatedItem.getPreparationTime());
        existing.setSpicyLevel(updatedItem.getSpicyLevel());
        
        return menuItemRepository.save(existing);
    }

    // --- Coupon Management ---

    @Transactional
    public Coupon createCoupon(Long canteenId, Coupon coupon) {
        if (canteenId != null) {
            Canteen canteen = canteenRepository.findById(canteenId)
                    .orElseThrow(() -> new RuntimeException("Canteen not found"));
            coupon.setCanteen(canteen);
        }
        return couponRepository.save(coupon);
    }

    public List<Coupon> getCouponsForCanteen(Long canteenId) {
        return couponRepository.findByCanteenId(canteenId);
    }
}
