package com.charusat.canteen.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "addon_options")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddonOption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    
    private BigDecimal price;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "addon_group_id")
    private AddonGroup addonGroup;
}
