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
    private final MenuItemVariantRepository menuItemVariantRepository;
    private final AddonGroupRepository addonGroupRepository;
    private final AddonOptionRepository addonOptionRepository;
    private final CouponRepository couponRepository;
    private final CanteenRepository canteenRepository;

    // --- Menu Management ---

    @Transactional
    public MenuItem addMenuItemWithVariants(Long canteenId, MenuItem menuItem, List<MenuItemVariant> variants, List<AddonGroup> addonGroups) {
        canteenRepository.findById(canteenId)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        menuItem.setCanteenId(canteenId);
        MenuItem savedItem = menuItemRepository.save(menuItem);
        
        // Link and save variants
        if (variants != null) {
            for (MenuItemVariant v : variants) {
                v.setMenuItemId(savedItem.getId());
                menuItemVariantRepository.save(v);
            }
        }
        
        // Link and save addons
        if (addonGroups != null) {
            for (AddonGroup group : addonGroups) {
                group.setMenuItemId(savedItem.getId());
                AddonGroup savedGroup = addonGroupRepository.save(group);
                if (group.getOptions() != null) {
                    for (AddonOption option : group.getOptions()) {
                        option.setAddonGroupId(savedGroup.getId());
                        addonOptionRepository.save(option);
                    }
                }
            }
        }
        
        return savedItem;
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
            canteenRepository.findById(canteenId)
                    .orElseThrow(() -> new RuntimeException("Canteen not found"));
            coupon.setCanteenId(canteenId);
        }
        return couponRepository.save(coupon);
    }

    public List<Coupon> getCouponsForCanteen(Long canteenId) {
        return couponRepository.findByCanteenId(canteenId);
    }
}
