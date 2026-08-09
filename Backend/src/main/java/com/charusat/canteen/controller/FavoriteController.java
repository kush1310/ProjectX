package com.charusat.canteen.controller;

import com.charusat.canteen.service.FavoriteService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserService userService;

    /**
     * Get all favorite menu item IDs for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getFavorites(Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        }
        var ids = favoriteService.getFavoriteMenuItemIds(user.get().getId());
        return ResponseEntity.ok(Map.of("success", true, "favorites", ids));
    }

    /**
     * Toggle a favorite — add if not favorited, remove if already favorited
     */
    @PostMapping("/toggle/{menuItemId}")
    public ResponseEntity<?> toggleFavorite(@PathVariable Long menuItemId, Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        }
        boolean added = favoriteService.toggleFavorite(user.get().getId(), menuItemId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "favorited", added,
                "message", added ? "Added to favorites" : "Removed from favorites"));
    }

    /**
     * Check if a specific menu item is favorited
     */
    @GetMapping("/check/{menuItemId}")
    public ResponseEntity<?> checkFavorite(@PathVariable Long menuItemId, Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        }
        boolean isFav = favoriteService.isFavorite(user.get().getId(), menuItemId);
        return ResponseEntity.ok(Map.of("success", true, "favorited", isFav));
    }

    /**
     * Remove a specific favorite
     */
    @DeleteMapping("/{menuItemId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long menuItemId, Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));
        }
        favoriteService.removeFavorite(user.get().getId(), menuItemId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Removed from favorites"));
    }

    // ── Canteen-level bookmark endpoints ──

    /**
     * GET /api/favorites/canteens
     * Returns all bookmarked canteen IDs for the authenticated user.
     */
    @GetMapping("/canteens")
    public ResponseEntity<?> getFavoriteCanteens(Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false));
        var ids = favoriteService.getFavoriteCanteenIds(user.get().getId());
        return ResponseEntity.ok(Map.of("success", true, "canteenIds", ids));
    }

    /**
     * POST /api/favorites/canteens/toggle/{canteenId}
     * Adds or removes a canteen bookmark. Returns the new state.
     */
    @PostMapping("/canteens/toggle/{canteenId}")
    public ResponseEntity<?> toggleCanteenFavorite(@PathVariable Long canteenId, Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false));
        boolean added = favoriteService.toggleCanteenFavorite(user.get().getId(), canteenId);
        return ResponseEntity.ok(Map.of(
                "success",   true,
                "bookmarked", added,
                "message",   added ? "Canteen bookmarked" : "Bookmark removed"));
    }

    /**
     * GET /api/favorites/canteens/check/{canteenId}
     * Checks whether a canteen is bookmarked by the current user.
     */
    @GetMapping("/canteens/check/{canteenId}")
    public ResponseEntity<?> checkCanteenFavorite(@PathVariable Long canteenId, Principal principal) {
        var user = userService.findByEmail(principal.getName());
        if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false));
        boolean isFav = favoriteService.isCanteenFavorite(user.get().getId(), canteenId);
        return ResponseEntity.ok(Map.of("success", true, "bookmarked", isFav));
    }
}
