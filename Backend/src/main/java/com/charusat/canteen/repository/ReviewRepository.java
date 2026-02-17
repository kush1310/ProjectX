package com.charusat.canteen.repository;

import com.charusat.canteen.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByCanteenIdOrderByCreatedAtDesc(Long canteenId);
    
    Optional<Review> findByOrderId(Long orderId);
    
    List<Review> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.canteen.id = :canteenId")
    Double getAverageRatingByCanteenId(Long canteenId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.canteen.id = :canteenId")
    Long countByCanteenId(Long canteenId);
    
    List<Review> findTop5ByCanteenIdOrderByCreatedAtDesc(Long canteenId);
}
