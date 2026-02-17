package com.charusat.canteen.dto;

import com.charusat.canteen.model.AddonGroup;
import com.charusat.canteen.model.MenuItem;
import com.charusat.canteen.model.MenuItemVariant;
import lombok.Data;

import java.util.List;

@Data
public class CreateMenuItemRequest {
    private MenuItem menuItem;
    private List<MenuItemVariant> variants;
    private List<AddonGroup> addonGroups;
}
