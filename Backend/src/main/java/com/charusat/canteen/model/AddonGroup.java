package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "addon_groups")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddonGroup {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g., "Crusts", "Toppings"
    
    private Integer minSelection; // 0 for optional
    private Integer maxSelection; 

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;

    @JsonManagedReference
    @OneToMany(mappedBy = "addonGroup", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AddonOption> options = new ArrayList<>();
}
