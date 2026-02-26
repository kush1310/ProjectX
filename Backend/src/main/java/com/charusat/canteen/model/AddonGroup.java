package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * AddonGroup - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddonGroup {
    private Long id;
    private String name;
    private Integer minSelection;
    private Integer maxSelection;
    private Long menuItemId; // FK

    @Builder.Default
    private List<AddonOption> options = new ArrayList<>();
}
