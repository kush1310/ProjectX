package com.charusat.canteen.controller;

import com.charusat.canteen.model.Coupon;
import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.repository.CouponRepository;
import com.charusat.canteen.repository.CanteenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendor/coupons")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CouponController {

    private final CouponRepository couponRepository;
    private final CanteenRepository canteenRepository;

    @GetMapping
    public List<Coupon> getCoupons() {
        // For simplicity assuming single vendor logged in or returning all for now.
        // In real app, filter by logged in vendor's canteen.
        return couponRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@RequestBody Coupon coupon) {
        if (couponRepository.existsByCode(coupon.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(couponRepository.save(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
    
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Coupon> toggleCoupon(@PathVariable Long id) {
        return couponRepository.findById(id).map(coupon -> {
            coupon.setIsActive(!coupon.getIsActive());
            return ResponseEntity.ok(couponRepository.save(coupon));
        }).orElse(ResponseEntity.notFound().build());
    }
}
