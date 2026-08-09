package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorApplication {

    public enum ApplicationStatus {
        SUBMITTED,
        UNDER_REVIEW,
        APPROVED,
        REJECTED
    }

    private Long id;
    private String applicantName;
    private String email;
    private String phone;
    private String canteenName;
    private String canteenType;
    private String description;
    private String address;
    private String bankName;
    private String accountNumberEnc;
    private String ifscCodeEnc;
    private String fssaiLicenseEnc;

    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;

    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String rejectionReason;
}
