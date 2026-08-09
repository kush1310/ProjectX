package com.charusat.canteen.controller;

import com.charusat.canteen.model.VendorApplication;
import com.charusat.canteen.service.UserService;
import com.charusat.canteen.service.VendorApplicationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor-applications")
@RequiredArgsConstructor
@Slf4j
public class VendorApplicationController {

    private final VendorApplicationService applicationService;
    private final UserService userService;

    public record SubmitApplicationRequest(
            @NotBlank String applicantName,
            @NotBlank @Email String email,
            String phone,
            @NotBlank String canteenName,
            String canteenType,
            String description,
            String address,
            String bankName,
            String accountNumber,
            String ifscCode,
            String fssaiLicense
    ) {}

    public record RejectApplicationRequest(String reason) {}

    @PostMapping
    public ResponseEntity<?> submitApplication(@Valid @RequestBody SubmitApplicationRequest req) {
        try {
            VendorApplication app = applicationService.submitApplication(
                    req.applicantName(), req.email(), req.phone(),
                    req.canteenName(), req.canteenType(), req.description(),
                    req.address(), req.bankName(), req.accountNumber(),
                    req.ifscCode(), req.fssaiLicense());
            return ResponseEntity.status(201).body(Map.of("success", true, "application", app));
        } catch (Exception e) {
            log.error("Vendor application submission failed", e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<VendorApplication>> getApplications(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(applicationService.getApplications(pageable));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveApplication(@PathVariable Long id, Principal principal) {
        try {
            Long reviewerId = 1L;
            if (principal != null) {
                reviewerId = userService.findByEmail(principal.getName()).map(u -> u.getId()).orElse(1L);
            }
            VendorApplication app = applicationService.approveApplication(id, reviewerId);
            return ResponseEntity.ok(Map.of("success", true, "application", app));
        } catch (Exception e) {
            log.error("Error approving application #{}", id, e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectApplication(@PathVariable Long id, @RequestBody(required = false) RejectApplicationRequest req, Principal principal) {
        try {
            Long reviewerId = 1L;
            if (principal != null) {
                reviewerId = userService.findByEmail(principal.getName()).map(u -> u.getId()).orElse(1L);
            }
            String reason = req != null ? req.reason() : "Application rejected by administrator";
            VendorApplication app = applicationService.rejectApplication(id, reviewerId, reason);
            return ResponseEntity.ok(Map.of("success", true, "application", app));
        } catch (Exception e) {
            log.error("Error rejecting application #{}", id, e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
