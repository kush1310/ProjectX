package com.charusat.canteen.repository;

import com.charusat.canteen.model.Canteen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Canteen Repository - Database operations for canteens
 */
@Repository
public interface CanteenRepository extends JpaRepository<Canteen, Long> {
    
    List<Canteen> findByIsOpenTrue();
    
    List<Canteen> findByOwnerId(Long ownerId);
    
    List<Canteen> findByNameContainingIgnoreCase(String name);
}
