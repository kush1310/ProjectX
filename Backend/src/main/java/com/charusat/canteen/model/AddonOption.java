package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddonOption {
    private Long id;
    private String name;
    private BigDecimal price;

    @JsonBackReference
    private AddonGroup addonGroup;
    private Long addonGroupId; // For JDBC convenience
}
