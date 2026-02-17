package com.charusat.canteen.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Canteen Entity - Represents a canteen on campus
 */
@Entity
@Table(name = "canteens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Canteen {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String location;
    
    private String description;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(name = "is_open")
    @Builder.Default
    private Boolean isOpen = true;
    
    @Column(name = "rush_hour_enabled")
    @Builder.Default
    private Boolean rushHourEnabled = false;
    
    @Column(name = "opening_time")
    private String openingTime;
    
    @Column(name = "closing_time")
    private String closingTime;
    
    // Compliance Details
    @Column(name = "fssai_number")
    private String fssaiNumber;
    
    @Column(name = "gst_no")
    private String gstNo;
    
    // Bank Details
    @Column(name = "bank_name")
    private String bankName;
    
    @Column(name = "account_number")
    private String accountNumber;
    
    @Column(name = "ifsc_code")
    private String ifscCode;
    
    @Column(name = "account_holder_name")
    private String accountHolderName;
    
    // Documents
    @Column(name = "kyc_document_url")
    private String kycDocumentUrl;
    

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @JsonIgnore
    @OneToMany(mappedBy = "canteen", cascade = CascadeType.ALL)
    private List<MenuItem> menuItems;
    
    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
