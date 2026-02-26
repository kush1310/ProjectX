package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Canteen Entity - Plain POJO (JDBC)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Canteen {
    
    private Long id;
    private String name;
    private String location;
    private String description;
    private String imageUrl;
    
    @Builder.Default
    private Boolean isOpen = true;
    
    @Builder.Default
    private Boolean rushHourEnabled = false;
    
    private String openingTime;
    private String closingTime;
    
    // Compliance
    private String fssaiNumber;
    private String gstNo;
    
    // Bank Details
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String accountHolderName;
    
    // Documents
    private String kycDocumentUrl;
    
    // FK instead of @ManyToOne User
    private Long ownerId;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
