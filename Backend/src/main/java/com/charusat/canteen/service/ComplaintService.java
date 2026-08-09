package com.charusat.canteen.service;

import com.charusat.canteen.model.Complaint;
import com.charusat.canteen.model.Complaint.ComplaintStatus;
import com.charusat.canteen.repository.ComplaintRepository;
import com.charusat.canteen.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ComplaintService
 *
 * Business logic for the complaint lifecycle: raise, respond, update status.
 *
 * Email notifications are dispatched asynchronously via EmailService for:
 *   - Complaint raised       → customer receives reference ID + tracking URL
 *   - Complaint raised       → vendor receives new complaint notification
 *   - Status updated         → customer receives status change email
 *   - Vendor reply posted    → customer receives reply notification email
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final OrderRepository     orderRepository;
    private final UserService         userService;
    private final EmailService        emailService;

    /**
     * raiseComplaint
     *
     * Creates a new complaint record for a customer. Validates that the referenced
     * order (if provided) belongs to the authenticated customer.
     * Generates a unique reference ID of format CMP-<epochMillis>.
     * Sends email to both customer and vendor asynchronously.
     *
     * @param customerId  {Long}   - Authenticated customer's user ID from JWT.
     * @param canteenId   {Long}   - Target canteen ID.
     * @param orderId     {Long}   - Optional: specific order being complained about.
     * @param subject     {String} - Short summary of the complaint (max 200 chars).
     * @param description {String} - Detailed complaint text; required and non-blank.
     * @returns {Complaint} — The persisted complaint with generated ID and referenceId.
     * @throws IllegalArgumentException if description is blank or order not found/not owned.
     */
    public Complaint raiseComplaint(Long customerId, Long canteenId, Long orderId,
                                    String subject, String description) {

        if (description == null || description.isBlank()) {
            throw new IllegalArgumentException("Complaint description must not be blank");
        }

        String referenceId = "CMP-" + System.currentTimeMillis();
        String orderNumber = null;

        if (orderId != null) {
            var orderOpt = orderRepository.findById(orderId);
            if (orderOpt.isEmpty()) {
                throw new IllegalArgumentException("Order not found: " + orderId);
            }
            var order = orderOpt.get();

            Long orderCustomerId = order.getCustomerId() != null
                    ? order.getCustomerId()
                    : (order.getCustomer() != null ? order.getCustomer().getId() : null);

            if (orderCustomerId == null || !orderCustomerId.equals(customerId)) {
                throw new IllegalArgumentException("Order does not belong to this customer");
            }

            // Resolve canteenId from order if not explicitly provided
            if (canteenId == null) {
                canteenId = order.getCanteenId() != null
                        ? order.getCanteenId()
                        : (order.getCanteen() != null ? order.getCanteen().getId() : null);
            }

            orderNumber = order.getOrderNumber();
        }

        Complaint complaint = Complaint.builder()
                .referenceId(referenceId)
                .customerId(customerId)
                .canteenId(canteenId)
                .orderId(orderId)
                .orderNumber(orderNumber)
                .subject(subject != null ? subject.trim() : "General Complaint")
                .description(description.trim())
                .status(ComplaintStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .build();

        Complaint saved = complaintRepository.save(complaint);
        log.info("Complaint raised: refId={} customerId={} canteenId={} orderId={}", referenceId, customerId, canteenId, orderId);

        // — Async email notifications — failure does not block the response
        final String finalOrderNumber = orderNumber;
        try {
            userService.findById(customerId).ifPresent(customer ->
                    emailService.sendComplaintRaisedToCustomer(
                            customer.getEmail(), customer.getFullName(),
                            referenceId, saved.getSubject(), finalOrderNumber));
        } catch (Exception e) {
            log.warn("Failed to send complaint confirmation to customer: {}", e.getMessage());
        }

        // Notify vendor: only if a valid canteenId is known (skip gracefully when canteen is unresolved)
        Long finalCanteenId = canteenId;
        if (finalCanteenId != null && finalCanteenId > 0) {
            try {
                userService.findVendorByCanteenId(finalCanteenId).ifPresent(vendor ->
                        emailService.sendComplaintRaisedToVendor(
                                vendor.getEmail(), vendor.getFullName(),
                                referenceId, saved.getSubject(), finalOrderNumber, description));
            } catch (Exception e) {
                log.warn("Failed to send complaint notification to vendor for canteenId={}: {}", finalCanteenId, e.getMessage());
            }
        } else {
            log.warn("Complaint {} saved without vendor notification — canteenId is unresolved ({})", referenceId, finalCanteenId);
        }

        return saved;
    }

    /**
     * updateStatus
     *
     * Transitions a complaint to a new status. Only the vendor (or admin) may call
     * this — enforcement is done at the controller layer via role check.
     * Sends an email to the customer notifying them of the status change.
     *
     * @param complaintId {Long}            - ID of the complaint to update.
     * @param newStatus   {ComplaintStatus} - Target status (OPEN / IN_PROGRESS / RESOLVED).
     * @returns {Complaint} — Updated complaint entity.
     * @throws IllegalArgumentException if complaint not found.
     */
    public Complaint updateStatus(Long complaintId, ComplaintStatus newStatus) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        complaint.setStatus(newStatus);
        complaint.setUpdatedAt(LocalDateTime.now());
        Complaint updated = complaintRepository.save(complaint);

        // Notify the customer about the status change
        try {
            userService.findById(complaint.getCustomerId()).ifPresent(customer ->
                    emailService.sendComplaintStatusUpdate(
                            customer.getEmail(), customer.getFullName(),
                            updated.getReferenceId(), updated.getSubject(),
                            newStatus.name()));
        } catch (Exception e) {
            log.warn("Failed to send status-update email for complaint {}: {}", complaintId, e.getMessage());
        }

        return updated;
    }

    /**
     * addVendorReply
     *
     * Persists the vendor's reply text on a complaint and transitions it to
     * IN_PROGRESS if still OPEN. Sends a reply notification email to the customer.
     *
     * @param complaintId {Long}   - Target complaint ID.
     * @param replyText   {String} - Vendor's reply; must not be blank.
     * @returns {Complaint} — Updated complaint with vendorReply set.
     * @throws IllegalArgumentException if complaint not found or reply is blank.
     */
    public Complaint addVendorReply(Long complaintId, String replyText) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found: " + complaintId));

        if (replyText == null || replyText.isBlank()) {
            throw new IllegalArgumentException("Reply text must not be blank");
        }

        complaint.setVendorReply(replyText.trim());
        complaint.setRepliedAt(LocalDateTime.now());
        complaint.setUpdatedAt(LocalDateTime.now());

        // Auto-transition to IN_PROGRESS if still OPEN when vendor first replies
        if (complaint.getStatus() == ComplaintStatus.OPEN) {
            complaint.setStatus(ComplaintStatus.IN_PROGRESS);
        }

        Complaint updated = complaintRepository.save(complaint);

        // Notify customer of vendor's reply
        try {
            userService.findById(complaint.getCustomerId()).ifPresent(customer ->
                    emailService.sendComplaintReplyToCustomer(
                            customer.getEmail(), customer.getFullName(),
                            updated.getReferenceId(), updated.getSubject(), replyText));
        } catch (Exception e) {
            log.warn("Failed to send reply notification email for complaint {}: {}", complaintId, e.getMessage());
        }

        return updated;
    }

    /**
     * getMyComplaints — returns all complaints raised by the authenticated customer.
     *
     * @param customerId {Long} - JWT-derived customer ID.
     * @returns {List<Complaint>} — Complaints, newest first.
     */
    public List<Complaint> getMyComplaints(Long customerId) {
        return complaintRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public org.springframework.data.domain.Page<Complaint> getMyComplaints(Long customerId, org.springframework.data.domain.Pageable pageable) {
        return complaintRepository.findByCustomerId(customerId, pageable);
    }

    /**
     * getVendorComplaints — returns all complaints for the vendor's canteen.
     *
     * @param canteenId {Long} - The vendor's canteen ID (resolved from JWT at controller layer).
     * @returns {List<Complaint>} — Complaints, newest first.
     */
    public List<Complaint> getVendorComplaints(Long canteenId) {
        return complaintRepository.findByCanteenIdOrderByCreatedAtDesc(canteenId);
    }

    public org.springframework.data.domain.Page<Complaint> getVendorComplaints(Long canteenId, org.springframework.data.domain.Pageable pageable) {
        return complaintRepository.findByCanteenId(canteenId, pageable);
    }

    /**
     * getVendorComplaintsByOwnerId
     *
     * Resolves the vendor's canteen from canteens.owner_id and returns all complaints for it.
     * Called by ComplaintController which only has the vendor's user ID from JWT.
     *
     * @param vendorUserId {Long} - The vendor's user ID (owner_id in canteens table).
     * @returns {List<Complaint>} — Complaints for the vendor's canteen, newest first.
     */
    public List<Complaint> getVendorComplaintsByOwnerId(Long vendorUserId) {
        return complaintRepository.findByVendorUserId(vendorUserId);
    }

    public org.springframework.data.domain.Page<Complaint> getVendorComplaintsByOwnerId(Long vendorUserId, org.springframework.data.domain.Pageable pageable) {
        return complaintRepository.findByVendorUserId(vendorUserId, pageable);
    }
}
