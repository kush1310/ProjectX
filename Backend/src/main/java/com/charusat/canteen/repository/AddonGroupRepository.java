package com.charusat.canteen.repository;

import com.charusat.canteen.model.AddonGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AddonGroupRepository extends JpaRepository<AddonGroup, Long> {
    List<AddonGroup> findByMenuItemId(Long menuItemId);
}
