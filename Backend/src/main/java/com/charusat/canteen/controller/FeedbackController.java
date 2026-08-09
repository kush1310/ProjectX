package com.charusat.canteen.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

/**
 * FeedbackController
 *
 * Accepts vendor/user feedback submissions from the Help Centre page.
 * Logs the feedback to the application log and returns a success response.
 * In production, this can be extended to store feedback in a DB table
 * or forward it via email to the operations team.
 *
 * Endpoint: POST /api/feedback
 * Auth:     Required (Principal resolved via JWT)
 */
@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Slf4j
public class FeedbackController {

    /**
     * submitFeedback
     *
     * Accepts a JSON body with:
     *   type    {String} - "bug" | "feature" | "general"
     *   message {String} - The feedback message text.
     *   source  {String} - Originating UI surface (e.g., "VENDOR_HELP_PAGE").
     *
     * @param body      {Map}       - Parsed request body fields.
     * @param principal {Principal} - Authenticated user's email from JWT.
     * @returns {ResponseEntity}    - 200 OK with success=true on acceptance.
     * @validates  message must not be blank (client-side enforced; logged if missing).
     * @edge-cases Returns 400 if message field is absent or blank.
     */
    @PostMapping
    public ResponseEntity<?> submitFeedback(@RequestBody Map<String, String> body,
                                            Principal principal) {
        String message = body.getOrDefault("message", "").trim();
        if (message.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Feedback message must not be blank"));
        }

        String type   = body.getOrDefault("type", "general");
        String source = body.getOrDefault("source", "UNKNOWN");
        String sender = principal != null ? principal.getName() : "anonymous";

        log.info("[FEEDBACK] type={} source={} sender={} message={}",
                type, source, sender, message.length() > 200 ? message.substring(0, 200) + "..." : message);

        return ResponseEntity.ok(Map.of("success", true,
                "message", "Thank you for your feedback! Our team will review it shortly."));
    }
}
