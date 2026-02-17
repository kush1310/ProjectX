package com.charusat.canteen.repository;

import com.charusat.canteen.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByCanteenId(Long canteenId);
    boolean existsByNameAndCanteenId(String name, Long canteenId);
}
