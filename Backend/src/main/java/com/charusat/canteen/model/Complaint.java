package com.charusat.canteen.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Complaint Entity — represents a customer support complaint tied to a specific order.
 *
 * Lifecycle: OPEN → IN_PROGRESS → RESOLVED
 * A unique reference ID (e.g. CMP-1716829200000) is generated on creation.
 * Email notifications are sent to both customer and vendor on creation and status changes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    private Long id;

    /** Human-readable reference ID: CMP-<timestamp>, e.g. CMP-1716829200000 */
    private String referenceId;

    private Long customerId;   // FK → users.id
    private Long canteenId;    // FK → canteens.id
    private Long orderId;      // FK → orders.id (nullable — complaint can be general)

    private String orderNumber; // Denormalised for display

    private String subject;     // Short complaint subject line
    private String description; // Full complaint body

    @Builder.Default
    private ComplaintStatus status = ComplaintStatus.OPEN;

    /** Vendor's response text — set when vendor replies */
    private String vendorReply;
    private LocalDateTime repliedAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    public enum ComplaintStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED
    }
}
