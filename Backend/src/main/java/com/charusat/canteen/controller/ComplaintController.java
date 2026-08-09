package com.charusat.canteen.controller;

import com.charusat.canteen.model.Complaint;
import com.charusat.canteen.model.Complaint.ComplaintStatus;
import com.charusat.canteen.service.ComplaintService;
import com.charusat.canteen.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * ComplaintController
 *
 * REST endpoints for the complaint lifecycle.
 * Base path: /api/complaints
 *
 * Endpoints:
 *   POST /api/complaints              — Customer raises a complaint
 *   GET  /api/complaints/my           — Customer views their own complaints
 *   GET  /api/complaints/vendor       — Vendor views complaints for their canteen
 *   PUT  /api/complaints/{id}/status  — Vendor updates complaint status
 *   PUT  /api/complaints/{id}/reply   — Vendor posts a reply to a complaint
 */
@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
@Slf4j
public class ComplaintController {

    private final ComplaintService complaintService;
    private final UserService      userService;

    /**
     * POST /api/complaints
     *
     * Raises a new complaint. Can be tied to a specific order or be a general complaint.
     * Generates a unique reference ID and sends email notifications to both customer and vendor.
     *
     * @param body      {Map}       JSON: canteenId (Long), orderId (Long, optional),
     *                              subject (String), description (String, required).
     * @param principal {Principal} JWT-derived customer email.
     * @returns 201 with created Complaint on success; 400 on validation failure.
     * @validates description not blank; order ownership if orderId provided.
     */
    @PostMapping
    public ResponseEntity<?> raiseComplaint(@RequestBody Map<String, Object> body, Principal principal) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("success", false, "message", "User not found"));

            Long   canteenId   = body.get("canteenId")   != null ? ((Number) body.get("canteenId")).longValue()   : null;
            Long   orderId     = body.get("orderId")      != null ? ((Number) body.get("orderId")).longValue()     : null;
            String subject     = (String) body.get("subject");
            String description = (String) body.get("description");

            if (description == null || description.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Complaint description is required"));
            }

            Complaint saved = complaintService.raiseComplaint(
                    user.get().getId(), canteenId, orderId, subject, description);

            return ResponseEntity.status(201).body(Map.of("success", true, "complaint", saved,
                    "referenceId", saved.getReferenceId()));

        } catch (IllegalArgumentException e) {
            log.warn("Complaint rejected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error raising complaint", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to submit complaint"));
        }
    }

    /**
     * GET /api/complaints/my
     *
     * Returns all complaints raised by the authenticated customer, newest first.
     * Used on the customer-facing complaint history tab.
     *
     * @param principal {Principal} JWT-derived customer email.
     * @returns {List<Complaint>} 200.
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyComplaints(
            Principal principal,
            @org.springframework.data.web.PageableDefault(size = 20) org.springframework.data.domain.Pageable pageable) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            org.springframework.data.domain.Page<Complaint> complaints = complaintService.getMyComplaints(user.get().getId(), pageable);
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            log.error("Error fetching customer complaints", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch complaints"));
        }
    }

    /**
     * GET /api/complaints/vendor
     *
     * Returns all complaints for the authenticated vendor's canteen, newest first.
     * The canteen is resolved from canteens.owner_id matching the JWT principal's user ID.
     *
     * @param principal {Principal} JWT-derived vendor email.
     * @returns {List<Complaint>} 200.
     */
    @GetMapping("/vendor")
    public ResponseEntity<?> getVendorComplaints(
            Principal principal,
            @org.springframework.data.web.PageableDefault(size = 50) org.springframework.data.domain.Pageable pageable) {
        try {
            var user = userService.findByEmail(principal.getName());
            if (user.isEmpty()) return ResponseEntity.status(401).body(Map.of("message", "User not found"));
            List<Complaint> complaints = complaintService.getVendorComplaintsByOwnerId(user.get().getId());
            return ResponseEntity.ok(complaints);
        } catch (Exception e) {
            log.error("Error fetching vendor complaints", e);
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to fetch complaints"));
        }
    }

    /**
     * PUT /api/complaints/{id}/status
     *
     * Transitions a complaint to a new status (OPEN → IN_PROGRESS → RESOLVED).
     * Sends an email notification to the customer on every transition.
     * Only CANTEEN_OWNER or ADMIN roles should call this endpoint (enforced by Spring Security config).
     *
     * @param id        {Long}      Path variable: complaint ID.
     * @param body      {Map}       JSON: {"status": "RESOLVED"}.
     * @param principal {Principal} JWT-derived vendor email.
     * @returns 200 with updated Complaint; 400 on invalid status or not-found.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> body,
                                           Principal principal) {
        try {
            String rawStatus = body.get("status");
            if (rawStatus == null || rawStatus.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "status is required"));
            }
            ComplaintStatus newStatus = ComplaintStatus.valueOf(rawStatus.toUpperCase());
            Complaint updated = complaintService.updateStatus(id, newStatus);
            return ResponseEntity.ok(Map.of("success", true, "complaint", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating complaint {} status", id, e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to update status"));
        }
    }

    /**
     * PUT /api/complaints/{id}/reply
     *
     * Vendor posts a response to a complaint. Auto-transitions to IN_PROGRESS if still OPEN.
     * Sends a reply notification email to the customer.
     *
     * @param id        {Long}      Path variable: complaint ID.
     * @param body      {Map}       JSON: {"reply": "..."}.
     * @param principal {Principal} JWT-derived vendor email.
     * @returns 200 with updated Complaint; 400 if reply is blank.
     */
    @PutMapping("/{id}/reply")
    public ResponseEntity<?> addReply(@PathVariable Long id,
                                       @RequestBody Map<String, String> body,
                                       Principal principal) {
        try {
            String replyText = body.get("reply");
            Complaint updated = complaintService.addVendorReply(id, replyText);
            return ResponseEntity.ok(Map.of("success", true, "complaint", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Error adding reply to complaint {}", id, e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to add reply"));
        }
    }
}
