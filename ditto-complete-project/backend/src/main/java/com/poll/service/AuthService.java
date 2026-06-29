package com.poll.service;
import com.poll.config.JwtUtil;
import com.poll.dto.AuthDTOs.*;
import com.poll.email.EmailService;
import com.poll.exception.PollException;
import com.poll.model.User;
import com.poll.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;
@Service @RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwt;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.email())) throw new PollException("Email already exists");
        User u = new User();
        u.setName(req.name()); u.setEmail(req.email().toLowerCase().trim());
        u.setPasswordHash(encoder.encode(req.password()));
        u.setEmailVerified(false);
        String verifyToken = UUID.randomUUID().toString().replace("-", "");
        u.setEmailVerifyToken(verifyToken);
        userRepo.save(u);
        
        try { 
            emailService.sendWelcomeVerification(u.getEmail(), u.getName(), verifyToken); 
        } catch (Exception e) {
            System.err.println("\n\n=== EMAIL SENDING FAILED ===");
            System.err.println("Could not send verification email. Have you set up your Gmail App Password in application.properties?");
            System.err.println("For testing purposes, here is the verification link: http://localhost:3000/verify-email?token=" + verifyToken);
            System.err.println("==============================\n\n");
        }
        
        return toRes(jwt.generate(u.getId(), u.getRole().name()), u);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User u = userRepo.findByEmail(req.email().toLowerCase().trim())
            .orElseThrow(() -> new PollException("Invalid email or password"));
        if (!encoder.matches(req.password(), u.getPasswordHash())) throw new PollException("Invalid email or password");
        u.setLastLoginAt(LocalDateTime.now()); userRepo.save(u);
        return toRes(jwt.generate(u.getId(), u.getRole().name()), u);
    }

    @Transactional
    public void verifyEmail(String token) {
        User u = userRepo.findByEmailVerifyToken(token).orElseThrow(() -> new PollException("Invalid token"));
        u.setEmailVerified(true); u.setEmailVerifyToken(null); userRepo.save(u);
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepo.findByEmail(email.toLowerCase().trim()).ifPresent(u -> {
            String t = UUID.randomUUID().toString().replace("-","");
            u.setPasswordResetToken(t); u.setPasswordResetExpiry(LocalDateTime.now().plusHours(1));
            userRepo.save(u); emailService.sendPasswordReset(u.getEmail(), u.getName(), t);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        User u = userRepo.findByPasswordResetToken(req.token()).orElseThrow(() -> new PollException("Invalid token"));
        if (u.getPasswordResetExpiry().isBefore(LocalDateTime.now())) throw new PollException("Token expired");
        u.setPasswordHash(encoder.encode(req.newPassword()));
        u.setPasswordResetToken(null); u.setPasswordResetExpiry(null); userRepo.save(u);
    }

    private AuthResponse toRes(String token, User u) {
        return new AuthResponse(token, u.getId(), u.getName(), u.getEmail(), u.getRole().name(), u.isEmailVerified());
    }
}
