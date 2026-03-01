package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddonGroup {
    private Long id;
    private String name;
    private Integer minSelection;
    private Integer maxSelection;

    @JsonBackReference
    private MenuItem menuItem;
    private Long menuItemId; // For JDBC convenience

    @Builder.Default
    private List<AddonOption> options = new ArrayList<>();
}
