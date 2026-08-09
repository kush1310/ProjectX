package com.charusat.canteen.service;

import com.charusat.canteen.model.Favorite;
import com.charusat.canteen.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    /**
     * Get all favorite menu item IDs for a user
     */
    public List<Long> getFavoriteMenuItemIds(Long userId) {
        return favoriteRepository.findMenuItemIdsByUserId(userId);
    }

    /**
     * Get all favorites for a user
     */
    public List<Favorite> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserId(userId);
    }

    /**
     * Toggle a favorite — add if not exists, remove if exists
     * 
     * @return true if added, false if removed
     */
    public boolean toggleFavorite(Long userId, Long menuItemId) {
        if (favoriteRepository.existsByUserIdAndMenuItemId(userId, menuItemId)) {
            favoriteRepository.deleteByUserIdAndMenuItemId(userId, menuItemId);
            return false; // removed
        } else {
            favoriteRepository.save(userId, menuItemId);
            return true; // added
        }
    }

    /**
     * Check if a menu item is favorited by a user
     */
    public boolean isFavorite(Long userId, Long menuItemId) {
        return favoriteRepository.existsByUserIdAndMenuItemId(userId, menuItemId);
    }

    /**
     * Add a favorite
     */
    public Favorite addFavorite(Long userId, Long menuItemId) {
        return favoriteRepository.save(userId, menuItemId);
    }

    /**
     * Remove a favorite
     */
    public void removeFavorite(Long userId, Long menuItemId) {
        favoriteRepository.deleteByUserIdAndMenuItemId(userId, menuItemId);
    }

    // ── Canteen-level bookmark methods ──

    /**
     * Returns all bookmarked canteen IDs for the user.
     */
    public List<Long> getFavoriteCanteenIds(Long userId) {
        return favoriteRepository.findCanteenIdsByUserId(userId);
    }

    /**
     * Toggles a canteen bookmark. Returns true if added, false if removed.
     */
    public boolean toggleCanteenFavorite(Long userId, Long canteenId) {
        if (favoriteRepository.existsByUserIdAndCanteenId(userId, canteenId)) {
            favoriteRepository.deleteCanteenFavorite(userId, canteenId);
            return false;
        } else {
            favoriteRepository.saveCanteenFavorite(userId, canteenId);
            return true;
        }
    }

    /**
     * Checks whether a canteen is bookmarked by the user.
     */
    public boolean isCanteenFavorite(Long userId, Long canteenId) {
        return favoriteRepository.existsByUserIdAndCanteenId(userId, canteenId);
    }
}
