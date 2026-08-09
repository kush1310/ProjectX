package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Canteen Entity - Represents a canteen on campus
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Canteen {

    private Long id;
    private String name;
    private String location;
    private String description;
    private String imageUrl;
    private String logoUrl;

    private Double pickupLat;
    private Double pickupLng;

    @Builder.Default
    private Boolean isOpen = true;

    @Builder.Default
    private Boolean rushHourEnabled = false;

    private String openingTime;
    private String closingTime;
    private String fssaiNumber;
    private String gstNo;
    private String bankName;
    private String accountNumber;
    private String ifscCode;
    private String accountHolderName;
    private String kycDocumentUrl;

    @JsonIgnore
    private User owner;
    private Long ownerId; // For JDBC convenience

    @JsonIgnore
    private List<MenuItem> menuItems;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
