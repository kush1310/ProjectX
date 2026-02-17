package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "menu_item_variants")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemVariant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // e.g., "Small", "Large"
    
    private BigDecimal price;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "menu_item_id")
    private MenuItem menuItem;
}
