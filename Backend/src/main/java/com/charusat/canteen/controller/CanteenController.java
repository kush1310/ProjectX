package com.charusat.canteen.controller;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.model.User;
import com.charusat.canteen.service.AuthService;
import com.charusat.canteen.service.CanteenService;
import com.charusat.canteen.service.UserService;
import com.charusat.canteen.service.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Canteen Controller - Handles canteen and menu endpoints
 */
@RestController
@RequestMapping("/api/canteens")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://127.0.0.1:5173"}, methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.PATCH, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class CanteenController {
    
    private final CanteenService canteenService;
    private final UserService userService;
    private final AuthService authService;
    private final WebSocketService webSocketService;
    private final com.charusat.canteen.repository.CanteenScheduleRepository scheduleRepository;
    
    @GetMapping
    public ResponseEntity<List<Canteen>> getAllCanteens() {
        return ResponseEntity.ok(canteenService.findAllCanteens());
    }

    /**
     * GET /api/canteens/my-canteen
     * Returns the authenticated vendor's canteen (resolved from JWT token).
     * Used by campaign forms to restrict menu item lists to the vendor's own restaurant.
     */
    @GetMapping("/my-canteen")
    public ResponseEntity<?> getMyCanteen(@RequestHeader(value = "Authorization", required = false) String authHeader, java.security.Principal principal) {
        try {
            Long userId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                if (authService.validateToken(token)) {
                    userId = authService.getUserIdFromToken(token);
                }
            }
            if (userId == null && principal != null) {
                var u = userService.findByEmail(principal.getName()).orElse(null);
                if (u != null) userId = u.getId();
            }
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            Canteen canteen = canteenService.getCanteenByOwnerId(userId);
            if (canteen == null) {
                var userOpt = userService.findById(userId);
                if (userOpt.isPresent() && userOpt.get().getRole() == com.charusat.canteen.model.User.UserRole.ADMIN) {
                    var all = canteenService.findAllCanteens();
                    if (!all.isEmpty()) canteen = all.get(0);
                }
            }
            if (canteen == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "No canteen found for this account"));
            }
            return ResponseEntity.ok(Map.of("success", true, "canteen", canteen, "canteenId", canteen.getId()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
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
                    request.rushHourEnabled(),
                    request
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

    /**
     * toggleOpen
     *
     * Flips the canteen's isOpen flag (open → closed or closed → open).
     * Immediately broadcasts CANTEEN_STATUS_CHANGED to all WebSocket subscribers
     * so customer dashboards and menu pages update without a page reload.
     *
     * Only the authenticated vendor who owns this canteen may call this endpoint.
     *
     * @param id        {Long}      - Canteen ID to toggle.
     * @param authHeader {String}  - JWT Bearer token for ownership verification.
     * @returns 200 {success, isOpen, canteen} on success; 401/403/404 on failure.
     */
    @PatchMapping("/{id}/toggle-open")
    public ResponseEntity<?> toggleOpen(@PathVariable Long id,
                                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                                        java.security.Principal principal) {
        try {
            Long userId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                if (authService.validateToken(token)) {
                    userId = authService.getUserIdFromToken(token);
                }
            }
            if (userId == null && principal != null) {
                var u = userService.findByEmail(principal.getName()).orElse(null);
                if (u != null) userId = u.getId();
            }
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            Canteen canteen = canteenService.findCanteenById(id)
                    .orElseThrow(() -> new RuntimeException("Canteen not found"));
            
            var userOpt = userService.findById(userId);
            boolean isAdmin = userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.ADMIN;
            if (!isAdmin && !userId.equals(canteen.getOwnerId())) {
                return ResponseEntity.status(403)
                        .body(Map.of("success", false, "message", "Not authorised to manage this canteen"));
            }
            Canteen updated = canteenService.toggleOpen(id);
            webSocketService.notifyCanteenStatusChange(updated);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "isOpen",  updated.getIsOpen(),
                    "canteen", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PatchMapping("/my-canteen/toggle-open")
    public ResponseEntity<?> toggleMyCanteenOpen(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                                java.security.Principal principal) {
        try {
            Long userId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.replace("Bearer ", "");
                if (authService.validateToken(token)) {
                    userId = authService.getUserIdFromToken(token);
                }
            }
            if (userId == null && principal != null) {
                var u = userService.findByEmail(principal.getName()).orElse(null);
                if (u != null) userId = u.getId();
            }
            if (userId == null) {
                return ResponseEntity.status(401).body(Map.of("success", false, "message", "Unauthorized"));
            }

            Canteen canteen = canteenService.getCanteenByOwnerId(userId);
            if (canteen == null) {
                // If admin without owned canteen, fallback to first canteen
                var userOpt = userService.findById(userId);
                if (userOpt.isPresent() && userOpt.get().getRole() == User.UserRole.ADMIN) {
                    var all = canteenService.findAllCanteens();
                    if (!all.isEmpty()) canteen = all.get(0);
                }
            }
            if (canteen == null) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "No canteen found for this account"));
            }

            Canteen updated = canteenService.toggleOpen(canteen.getId());
            webSocketService.notifyCanteenStatusChange(updated);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "isOpen",  updated.getIsOpen(),
                    "canteen", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}/schedule")
    public ResponseEntity<?> getSchedule(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleRepository.findByCanteenId(id));
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<?> updateSchedule(@PathVariable Long id, @RequestBody List<com.charusat.canteen.model.CanteenSchedule> schedules) {
        if (schedules != null) {
            for (var s : schedules) {
                s.setCanteenId(id);
                scheduleRepository.save(s);
            }
        }
        return ResponseEntity.ok(Map.of("success", true, "schedule", scheduleRepository.findByCanteenId(id)));
    }
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
                    request
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
                    request
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
        boolean available = body.getOrDefault("available", true);
        canteenService.toggleMenuItemAvailability(itemId, available);
        MenuItem updated = canteenService.findMenuItemById(itemId).orElse(null);
        if (updated != null) {
            webSocketService.notifyMenuItemUpdated(updated);
        }
        return ResponseEntity.ok(Map.of("success", true, "available", available));
    }

    @PatchMapping("/menu/items/{id}/stock-status")
    public ResponseEntity<?> updateStockStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        Boolean inStock = body.getOrDefault("inStock", body.getOrDefault("isAvailable", true));
        canteenService.toggleMenuItemAvailability(id, inStock);
        MenuItem updated = canteenService.findMenuItemById(id).orElse(null);
        if (updated != null) {
            webSocketService.notifyMenuItemUpdated(updated);
        }
        return ResponseEntity.ok(Map.of("success", true, "inStock", inStock));
    }

    @PostMapping("/vendor/{canteenId}/deactivate")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CANTEEN_OWNER') or hasRole('ADMIN')")
    public ResponseEntity<?> deactivateCanteen(@PathVariable Long canteenId) {
        try {
            Long activeOrders = canteenService.countActiveOrders(canteenId);
            if (activeOrders != null && activeOrders > 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Cannot deactivate canteen with active orders (" + activeOrders + " active)"));
            }
            canteenService.deactivateCanteen(canteenId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Canteen deactivated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    // Request DTOs
    public record CreateCanteenRequest(String name, String location, String description, Long ownerId) {}
    public record UpdateCanteenRequest(
        String name, 
        String location, 
        String description,
        String imageUrl,
        String logoUrl,
        Boolean isOpen, 
        Boolean rushHourEnabled,
        String openingTime,
        String closingTime,
        String fssaiNumber,
        String gstNo,
        String bankName,
        String accountNumber,
        String ifscCode,
        String accountHolderName,
        String kycDocumentUrl
    ) {}
    
    public record VariantDto(String name, BigDecimal price) {}
    public record AddonOptionDto(String name, BigDecimal price) {}
    public record AddonGroupDto(String name, Integer minSelection, Integer maxSelection, List<AddonOptionDto> options) {}

    public record AddMenuItemRequest(
        String name, 
        String description, 
        BigDecimal price, 
        String category, 
        String subCategory,
        Integer displayOrder, // Added
        String availableFrom, // Added
        String availableTo, // Added
        Boolean isVeg, 
        Integer preparationTime,
        Boolean isRecommended, // Added
        Boolean hasVariants,
        List<VariantDto> variants,
        Boolean hasAddons,
        List<AddonGroupDto> addonGroups
    ) {}

    public record UpdateMenuItemRequest(
        String name, 
        String description, 
        BigDecimal price, 
        Boolean isAvailable, 
        String category,
        String subCategory,
        Integer displayOrder, // Added
        String availableFrom, // Added
        String availableTo, // Added
        Integer preparationTime,
        Boolean isRecommended, // Added
        Boolean hasVariants,
        List<VariantDto> variants,
        Boolean hasAddons,
        List<AddonGroupDto> addonGroups
    ) {}
}
