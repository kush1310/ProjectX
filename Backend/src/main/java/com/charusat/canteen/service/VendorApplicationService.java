package com.charusat.canteen.service;

import com.charusat.canteen.model.Canteen;
import com.charusat.canteen.model.User;
import com.charusat.canteen.model.VendorApplication;
import com.charusat.canteen.repository.CanteenRepository;
import com.charusat.canteen.repository.UserRepository;
import com.charusat.canteen.repository.VendorApplicationRepository;
import com.charusat.canteen.util.FieldEncryptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorApplicationService {

    private final VendorApplicationRepository applicationRepository;
    private final CanteenRepository canteenRepository;
    private final UserRepository userRepository;
    private final FieldEncryptor fieldEncryptor;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final WebSocketService webSocketService;
    private final JdbcTemplate jdbc;

    @Transactional
    public VendorApplication submitApplication(String applicantName, String email, String phone,
                                               String canteenName, String canteenType, String description,
                                               String address, String bankName, String accountNumber,
                                               String ifscCode, String fssaiLicense) {

        String accEnc = accountNumber != null && !accountNumber.isBlank() ? fieldEncryptor.encrypt(accountNumber) : null;
        String ifscEnc = ifscCode != null && !ifscCode.isBlank() ? fieldEncryptor.encrypt(ifscCode) : null;
        String fssaiEnc = fssaiLicense != null && !fssaiLicense.isBlank() ? fieldEncryptor.encrypt(fssaiLicense) : null;

        VendorApplication app = VendorApplication.builder()
                .applicantName(applicantName)
                .email(email)
                .phone(phone)
                .canteenName(canteenName)
                .canteenType(canteenType)
                .description(description)
                .address(address)
                .bankName(bankName)
                .accountNumberEnc(accEnc)
                .ifscCodeEnc(ifscEnc)
                .fssaiLicenseEnc(fssaiEnc)
                .status(VendorApplication.ApplicationStatus.SUBMITTED)
                .submittedAt(LocalDateTime.now())
                .build();

        VendorApplication saved = applicationRepository.save(app);

        // Broadcast STOMP event to admin dashboard
        try {
            webSocketService.notifyNewOrder(null); // triggers STOMP ping or dedicated topic
        } catch (Exception e) {
            log.warn("STOMP broadcast for vendor application failed", e);
        }

        return saved;
    }

    public Page<VendorApplication> getApplications(Pageable pageable) {
        return applicationRepository.findAll(pageable);
    }

    @Transactional
    public VendorApplication approveApplication(Long applicationId, Long reviewerId) {
        VendorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        if (app.getStatus() == VendorApplication.ApplicationStatus.APPROVED) {
            throw new IllegalStateException("Application is already approved");
        }

        // Provision User Account
        User vendorUser = userRepository.findByEmail(app.getEmail()).orElse(null);
        if (vendorUser == null) {
            String tempPassword = "Vendor@" + UUID.randomUUID().toString().substring(0, 8);
            vendorUser = User.builder()
                    .email(app.getEmail())
                    .fullName(app.getApplicantName())
                    .password(passwordEncoder.encode(tempPassword))
                    .role(User.UserRole.CANTEEN_OWNER)
                    .isActive(true)
                    .isEmailVerified(true)
                    .createdAt(LocalDateTime.now())
                    .build();
            vendorUser = userRepository.save(vendorUser);

            // Send welcome email with login credentials
            try {
                emailService.sendVerificationEmail(vendorUser.getEmail(), tempPassword);
            } catch (Exception e) {
                log.warn("Failed to send vendor welcome email: {}", e.getMessage());
            }
        }

        // Provision Canteen
        Canteen canteen = Canteen.builder()
                .name(app.getCanteenName())
                .location(app.getAddress())
                .description(app.getDescription())
                .isOpen(true)
                .ownerId(vendorUser.getId())
                .createdAt(LocalDateTime.now())
                .build();
        Canteen savedCanteen = canteenRepository.save(canteen);

        // Provision canteen_bank_details (with FieldEncryptor)
        jdbc.update("INSERT INTO canteen_bank_details (canteen_id, bank_name, account_number, ifsc_code, account_holder_name, fssai_number) VALUES (?,?,?,?,?,?) ON CONFLICT (canteen_id) DO NOTHING",
                savedCanteen.getId(), app.getBankName(), app.getAccountNumberEnc(), app.getIfscCodeEnc(), app.getApplicantName(), app.getFssaiLicenseEnc());

        app.setStatus(VendorApplication.ApplicationStatus.APPROVED);
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        return applicationRepository.save(app);
    }

    @Transactional
    public VendorApplication rejectApplication(Long applicationId, Long reviewerId, String reason) {
        VendorApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found: " + applicationId));

        app.setStatus(VendorApplication.ApplicationStatus.REJECTED);
        app.setReviewedBy(reviewerId);
        app.setReviewedAt(LocalDateTime.now());
        app.setRejectionReason(reason);
        return applicationRepository.save(app);
    }
}
