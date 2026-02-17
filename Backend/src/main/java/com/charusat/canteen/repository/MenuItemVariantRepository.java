package com.charusat.canteen.repository;

import com.charusat.canteen.model.MenuItemVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemVariantRepository extends JpaRepository<MenuItemVariant, Long> {
    List<MenuItemVariant> findByMenuItemId(Long menuItemId);
}
