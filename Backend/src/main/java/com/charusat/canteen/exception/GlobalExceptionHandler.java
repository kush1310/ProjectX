package com.charusat.canteen.exception;

import com.charusat.canteen.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Global Exception Handler - Handles all exceptions and returns consistent API responses
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        log.warn("Validation error: {}", errors);
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("Validation failed", errors));
    }

    /**
     * Handle bad request exceptions
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle resource not found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(
            ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle authentication errors
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(
            BadCredentialsException ex) {
        log.warn("Authentication failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
    }

    /**
     * Handle Razorpay payment gateway exceptions
     */
    @ExceptionHandler(com.razorpay.RazorpayException.class)
    public ResponseEntity<ApiResponse<Void>> handleRazorpayException(
            com.razorpay.RazorpayException ex) {
        log.error("Razorpay payment gateway error: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.error("Payment gateway error. Please try again later."));
    }

    /**
     * handleAccessDeniedException
     *
     * Intercepts Spring Security access control rejections triggered by @PreAuthorize
     * annotations and method security rules. Returns a standardized HTTP 403 Forbidden
     * response without masking the authorization failure as an internal server error.
     *
     * @param  ex  - AccessDeniedException thrown by Spring Security authorization interceptors.
     * @returns    - HTTP 403 response with standardized error body.
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(
            org.springframework.security.access.AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied: Insufficient privileges"));
    }

    /**
     * handleNoResourceFoundException
     *
     * Intercepts requests to non-existent API endpoints and missing resources in Spring Boot 3.2+.
     * Returns an RFC 7231 compliant HTTP 404 Not Found response instead of an unhandled 500 error.
     *
     * @param  ex  - NoResourceFoundException thrown when no handler mapping exists.
     * @returns    - HTTP 404 response with standardized error body.
     */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResourceFoundException(
            org.springframework.web.servlet.resource.NoResourceFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("Resource not found"));
    }

    /**
     * handleHttpMessageNotReadableException
     *
     * Intercepts malformed JSON payloads, unparseable enum values, and syntax errors.
     * Returns an HTTP 400 Bad Request response with a sanitized message instead of a 500 error.
     *
     * @param  ex  - HttpMessageNotReadableException thrown by Jackson during deserialization.
     * @returns    - HTTP 400 response with sanitized error message.
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadableException(
            org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed request payload: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Malformed request payload or invalid parameter format"));
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAllExceptions(Exception ex) {
        log.error("Unexpected error: ", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred. Please try again."));
    }
}
