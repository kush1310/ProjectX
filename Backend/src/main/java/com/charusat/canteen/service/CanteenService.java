package com.charusat.canteen.service;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

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
    public Canteen updateCanteen(Long id, String name, String location, Boolean isOpen, Boolean rushHourEnabled) {
        Canteen canteen = canteenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        if (name != null) canteen.setName(name);
        if (location != null) canteen.setLocation(location);
        if (isOpen != null) canteen.setIsOpen(isOpen);
        if (rushHourEnabled != null) canteen.setRushHourEnabled(rushHourEnabled);
        
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
    public MenuItem addMenuItem(Long canteenId, String name, String description, BigDecimal price, 
                                 String category, Boolean isVeg, Integer preparationTime) {
        Canteen canteen = canteenRepository.findById(canteenId)
                .orElseThrow(() -> new RuntimeException("Canteen not found"));
        
        MenuItem item = MenuItem.builder()
                .canteen(canteen)
                .name(name)
                .description(description)
                .price(price)
                .category(category)
                .isVeg(isVeg)
                .preparationTime(preparationTime)
                .build();
        
        return menuItemRepository.save(item);
    }
    
    @Transactional
    public MenuItem updateMenuItem(Long id, String name, String description, BigDecimal price, 
                                    Boolean isAvailable, String category) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));
        
        if (name != null) item.setName(name);
        if (description != null) item.setDescription(description);
        if (price != null) item.setPrice(price);
        if (isAvailable != null) item.setIsAvailable(isAvailable);
        if (category != null) item.setCategory(category);
        
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
