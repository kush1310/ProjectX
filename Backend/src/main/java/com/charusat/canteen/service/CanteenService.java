package com.charusat.canteen.service;

import com.charusat.canteen.controller.CanteenController;
import com.charusat.canteen.model.*;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Canteen Service - Business logic for canteen and menu management
 */
@Service
@RequiredArgsConstructor
public class CanteenService {
    
    private final CanteenRepository canteenRepository;
    private final MenuItemRepository menuItemRepository;
    
    // Canteen CRUD
    public List<Canteen> findAllCanteens() {
        return canteenRepository.findAll();
    }
    
    public List<Canteen> findOpenCanteens() {
        return canteenRepository.findByIsOpenTrue();
    }
    
    public Optional<Canteen> findCanteenById(Long id) {
        return canteenRepository.findById(id);
    }
    
    public Canteen getCanteenByOwnerId(Long ownerId) {
        List<Canteen> canteens = canteenRepository.findByOwnerId(ownerId);
        return canteens.isEmpty() ? null : canteens.get(0);
    }
    
    @Transactional
    public Canteen createCanteen(String name, String location, String description, Long ownerId) {
        Canteen canteen = Canteen.builder()
                .name(name)
                .location(location)
                .description(description)
                .build();
        return canteenRepository.save(canteen);
    }
    
    @Transactional
    public Canteen updateCanteen(
            Long id, 
            String name, 
            String location, 
            Boolean isOpen, 
            Boolean rushHourEnabled,
            CanteenController.UpdateCanteenRequest request // Pass full request object for cleaner code
    ) {
        Canteen canteen = canteenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        if (name != null) canteen.setName(name);
        if (location != null) canteen.setLocation(location);
        if (isOpen != null) canteen.setIsOpen(isOpen);
        if (rushHourEnabled != null) canteen.setRushHourEnabled(rushHourEnabled);
        
        if (request != null) {
            if (request.openingTime() != null) canteen.setOpeningTime(request.openingTime());
            if (request.closingTime() != null) canteen.setClosingTime(request.closingTime());
            if (request.fssaiNumber() != null) canteen.setFssaiNumber(request.fssaiNumber());
            if (request.gstNo() != null) canteen.setGstNo(request.gstNo());
            if (request.bankName() != null) canteen.setBankName(request.bankName());
            if (request.accountNumber() != null) canteen.setAccountNumber(request.accountNumber());
            if (request.ifscCode() != null) canteen.setIfscCode(request.ifscCode());
            if (request.accountHolderName() != null) canteen.setAccountHolderName(request.accountHolderName());
            if (request.kycDocumentUrl() != null) canteen.setKycDocumentUrl(request.kycDocumentUrl());
        }
        
        return canteenRepository.save(canteen);
    }
    
    @Transactional
    public void toggleRushHour(Long canteenId, boolean enabled) {
        canteenRepository.findById(canteenId).ifPresent(canteen -> {
            canteen.setRushHourEnabled(enabled);
            canteenRepository.save(canteen);
        });
    }
    
    // Menu Item CRUD
    public List<MenuItem> getMenuItems(Long canteenId) {
        return menuItemRepository.findByCanteenId(canteenId);
    }
    
    public List<MenuItem> getAvailableMenuItems(Long canteenId) {
        return menuItemRepository.findByCanteenIdAndIsAvailableTrue(canteenId);
    }
    
    public Optional<MenuItem> findMenuItemById(Long id) {
        return menuItemRepository.findById(id);
    }
    
    @Transactional
    public MenuItem addMenuItem(Long canteenId, CanteenController.AddMenuItemRequest request) {
        Canteen canteen = canteenRepository.findById(canteenId)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        MenuItem item = MenuItem.builder()
                .canteen(canteen)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .category(request.category())
                .subCategory(request.subCategory())
                .displayOrder(request.displayOrder())
                .availableFrom(request.availableFrom())
                .availableTo(request.availableTo())
                .isVeg(request.isVeg())
                .preparationTime(request.preparationTime())
                .isRecommended(request.isRecommended() != null ? request.isRecommended() : false)
                .hasVariants(request.hasVariants())
                .hasAddons(request.hasAddons())
                .variants(new ArrayList<>())
                .addonGroups(new ArrayList<>())
                .build();

        // Process Variants
        if (Boolean.TRUE.equals(request.hasVariants()) && request.variants() != null) {
            List<MenuItemVariant> variants = request.variants().stream().map(v -> {
                MenuItemVariant variant = new MenuItemVariant();
                variant.setName(v.name());
                variant.setPrice(v.price());
                variant.setMenuItem(item);
                return variant;
            }).collect(Collectors.toList());
            item.getVariants().addAll(variants);
        }

        // Process Addons
        if (Boolean.TRUE.equals(request.hasAddons()) && request.addonGroups() != null) {
            List<AddonGroup> addonGroups = request.addonGroups().stream().map(g -> {
                AddonGroup group = new AddonGroup();
                group.setName(g.name());
                group.setMinSelection(g.minSelection());
                group.setMaxSelection(g.maxSelection());
                group.setMenuItem(item);
                
                if (g.options() != null) {
                    List<AddonOption> options = g.options().stream().map(o -> {
                        AddonOption option = new AddonOption();
                        option.setName(o.name());
                        option.setPrice(o.price());
                        option.setAddonGroup(group);
                        return option;
                    }).collect(Collectors.toList());
                    group.setOptions(options);
                }
                return group;
            }).collect(Collectors.toList());
            item.getAddonGroups().addAll(addonGroups);
        }
        
        return menuItemRepository.save(item);
    }
    
    @Transactional
    public MenuItem updateMenuItem(Long id, CanteenController.UpdateMenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        
        if (request.name() != null) item.setName(request.name());
        if (request.description() != null) item.setDescription(request.description());
        if (request.price() != null) item.setPrice(request.price());
        if (request.isAvailable() != null) item.setIsAvailable(request.isAvailable());
        if (request.category() != null) item.setCategory(request.category());
        if (request.subCategory() != null) item.setSubCategory(request.subCategory());
        if (request.displayOrder() != null) item.setDisplayOrder(request.displayOrder());
        if (request.availableFrom() != null) item.setAvailableFrom(request.availableFrom());
        if (request.availableTo() != null) item.setAvailableTo(request.availableTo());
        if (request.preparationTime() != null) item.setPreparationTime(request.preparationTime());
        if (request.isRecommended() != null) item.setIsRecommended(request.isRecommended());
        
        // Handle Variants Update
        if (request.hasVariants() != null) {
            item.setHasVariants(request.hasVariants());
            if (Boolean.TRUE.equals(request.hasVariants()) && request.variants() != null) {
                item.getVariants().clear();
                List<MenuItemVariant> newVariants = request.variants().stream().map(v -> {
                    MenuItemVariant variant = new MenuItemVariant();
                    variant.setName(v.name());
                    variant.setPrice(v.price());
                    variant.setMenuItem(item);
                    return variant;
                }).collect(Collectors.toList());
                item.getVariants().addAll(newVariants);
            }
        }
        
        // Handle Addons Update
        if (request.hasAddons() != null) {
            item.setHasAddons(request.hasAddons());
            if (Boolean.TRUE.equals(request.hasAddons()) && request.addonGroups() != null) {
                item.getAddonGroups().clear();
                List<AddonGroup> newGroups = request.addonGroups().stream().map(g -> {
                    AddonGroup group = new AddonGroup();
                    group.setName(g.name());
                    group.setMinSelection(g.minSelection());
                    group.setMaxSelection(g.maxSelection());
                    group.setMenuItem(item);
                    
                    if (g.options() != null) {
                        List<AddonOption> options = g.options().stream().map(o -> {
                            AddonOption option = new AddonOption();
                            option.setName(o.name());
                            option.setPrice(o.price());
                            option.setAddonGroup(group);
                            return option;
                        }).collect(Collectors.toList());
                        group.setOptions(options);
                    }
                    return group;
                }).collect(Collectors.toList());
                item.getAddonGroups().addAll(newGroups);
            }
        }
        
        return menuItemRepository.save(item);
    }
    
    @Transactional
    public void deleteMenuItem(Long id) {
        menuItemRepository.deleteById(id);
    }
    
    @Transactional
    public void toggleMenuItemAvailability(Long id, boolean available) {
        menuItemRepository.findById(id).ifPresent(item -> {
            item.setIsAvailable(available);
            menuItemRepository.save(item);
        });
    }
}
