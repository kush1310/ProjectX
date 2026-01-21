package com.charusat.canteen.controller;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.service.CanteenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Canteen Controller - Handles canteen and menu endpoints
 */
@RestController
@RequestMapping("/api/canteens")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class CanteenController {
    
    private final CanteenService canteenService;
    
    @GetMapping
    public ResponseEntity<List<Canteen>> getAllCanteens() {
        return ResponseEntity.ok(canteenService.findAllCanteens());
    }
    
    @GetMapping("/open")
    public ResponseEntity<List<Canteen>> getOpenCanteens() {
        return ResponseEntity.ok(canteenService.findOpenCanteens());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getCanteen(@PathVariable Long id) {
        return canteenService.findCanteenById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<?> createCanteen(@RequestBody CreateCanteenRequest request) {
        try {
            Canteen canteen = canteenService.createCanteen(
                    request.name(),
                    request.location(),
                    request.description(),
                    request.ownerId()
            );
            return ResponseEntity.ok(Map.of("success", true, "canteen", canteen));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCanteen(@PathVariable Long id, @RequestBody UpdateCanteenRequest request) {
        try {
            Canteen canteen = canteenService.updateCanteen(
                    id,
                    request.name(),
                    request.location(),
                    request.isOpen(),
                    request.rushHourEnabled()
            );
            return ResponseEntity.ok(Map.of("success", true, "canteen", canteen));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/rush-hour")
    public ResponseEntity<?> toggleRushHour(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        canteenService.toggleRushHour(id, body.getOrDefault("enabled", false));
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    // Menu Endpoints
    @GetMapping("/{canteenId}/menu")
    public ResponseEntity<List<MenuItem>> getMenu(@PathVariable Long canteenId) {
        return ResponseEntity.ok(canteenService.getMenuItems(canteenId));
    }
    
    @GetMapping("/{canteenId}/menu/available")
    public ResponseEntity<List<MenuItem>> getAvailableMenu(@PathVariable Long canteenId) {
        return ResponseEntity.ok(canteenService.getAvailableMenuItems(canteenId));
    }
    
    @PostMapping("/{canteenId}/menu")
    public ResponseEntity<?> addMenuItem(@PathVariable Long canteenId, @RequestBody AddMenuItemRequest request) {
        try {
            MenuItem item = canteenService.addMenuItem(
                    canteenId,
                    request.name(),
                    request.description(),
                    request.price(),
                    request.category(),
                    request.isVeg(),
                    request.preparationTime()
            );
            return ResponseEntity.ok(Map.of("success", true, "item", item));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PutMapping("/menu/{itemId}")
    public ResponseEntity<?> updateMenuItem(@PathVariable Long itemId, @RequestBody UpdateMenuItemRequest request) {
        try {
            MenuItem item = canteenService.updateMenuItem(
                    itemId,
                    request.name(),
                    request.description(),
                    request.price(),
                    request.isAvailable(),
                    request.category()
            );
            return ResponseEntity.ok(Map.of("success", true, "item", item));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @DeleteMapping("/menu/{itemId}")
    public ResponseEntity<?> deleteMenuItem(@PathVariable Long itemId) {
        canteenService.deleteMenuItem(itemId);
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    @PostMapping("/menu/{itemId}/toggle")
    public ResponseEntity<?> toggleAvailability(@PathVariable Long itemId, @RequestBody Map<String, Boolean> body) {
        canteenService.toggleMenuItemAvailability(itemId, body.getOrDefault("available", true));
        return ResponseEntity.ok(Map.of("success", true));
    }
    
    // Request DTOs
    public record CreateCanteenRequest(String name, String location, String description, Long ownerId) {}
    public record UpdateCanteenRequest(String name, String location, Boolean isOpen, Boolean rushHourEnabled) {}
    public record AddMenuItemRequest(String name, String description, BigDecimal price, String category, Boolean isVeg, Integer preparationTime) {}
    public record UpdateMenuItemRequest(String name, String description, BigDecimal price, Boolean isAvailable, String category) {}
}
