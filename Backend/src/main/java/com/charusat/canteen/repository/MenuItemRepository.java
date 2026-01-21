package com.charusat.canteen.repository;

import com.charusat.canteen.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * MenuItem Repository - Database operations for menu items
 */
@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    
    List<MenuItem> findByCanteenId(Long canteenId);
    
    List<MenuItem> findByCanteenIdAndIsAvailableTrue(Long canteenId);
    
    List<MenuItem> findByCanteenIdAndCategory(Long canteenId, String category);
    
    List<MenuItem> findByCanteenIdAndIsVeg(Long canteenId, Boolean isVeg);
    
    List<MenuItem> findByNameContainingIgnoreCase(String name);
}
