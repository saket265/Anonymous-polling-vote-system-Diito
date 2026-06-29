package com.poll.dto;
import jakarta.validation.constraints.*;
public class AuthDTOs {
    public record RegisterRequest(
        @NotBlank @Size(min=2,max=100) String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min=8,max=100) String password) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record ForgotPasswordRequest(@NotBlank @Email String email) {}
    public record ResetPasswordRequest(@NotBlank String token, @NotBlank @Size(min=8) String newPassword) {}
    public record AuthResponse(String token, String userId, String name, String email, String role, boolean emailVerified) {}
    public record SharePollRequest(@NotBlank @Email String recipientEmail) {}
}
