package com.charusat.canteen.repository;

import com.charusat.canteen.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    List<Coupon> findByCanteenId(Long canteenId);
    boolean existsByCode(String code);
}
