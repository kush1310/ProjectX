package com.charusat.canteen;

import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.repository.MenuItemRepository;
import com.charusat.canteen.service.CanteenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class MenuHiddenTagIntegrationTest {

    @Autowired
    private CanteenService canteenService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Test
    public void customerViewExcludesHiddenTag_vendorViewIncludesIt() {
        Long canteenId = 1L;

        MenuItem item = MenuItem.builder()
                .canteenId(canteenId)
                .name("Secret Special Dish")
                .price(new BigDecimal("150"))
                .isAvailable(true)
                .tags(List.of("#hidden"))
                .build();

        MenuItem saved = menuItemRepository.save(item);

        // Customer view: getAvailableMenuItems
        List<MenuItem> customerMenu = canteenService.getAvailableMenuItems(canteenId);
        boolean foundInCustomer = customerMenu.stream().anyMatch(i -> i.getId().equals(saved.getId()));
        assertFalse(foundInCustomer, "Hidden item must not be visible in customer menu");

        // Vendor view: getMenuItems
        List<MenuItem> vendorMenu = canteenService.getMenuItems(canteenId);
        boolean foundInVendor = vendorMenu.stream().anyMatch(i -> i.getId().equals(saved.getId()));
        assertTrue(foundInVendor, "Hidden item must be visible in vendor menu management view");
    }
}
