package com.poll.controller;
import com.poll.dto.AuthDTOs.*;
import com.poll.email.EmailService;
import com.poll.exception.PollException;
import com.poll.model.Poll;
import com.poll.model.User;
import com.poll.repository.PollRepository;
import com.poll.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final EmailService emailService;
    private final PollRepository pollRepo;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }
    @GetMapping("/verify-email")
    public ResponseEntity<Map<String,String>> verify(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message","Email verified successfully"));
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String,String>> forgot(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return ResponseEntity.ok(Map.of("message","If that email exists, a reset link has been sent"));
    }
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String,String>> reset(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message","Password reset successfully"));
    }
    @PostMapping("/polls/{pollId}/share")
    public ResponseEntity<Map<String,String>> share(@PathVariable String pollId,
            @Valid @RequestBody SharePollRequest req, HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u == null) throw new PollException("Authentication required");
        Poll poll = pollRepo.findById(pollId).orElseThrow(() -> new PollException("Poll not found"));
        if (poll.getOwner()==null || (!poll.getOwner().getId().equals(u.getId()) && u.getRole()!=User.Role.ADMIN))
            throw new PollException("You can only share your own polls");
        emailService.sendPollInvite(req.recipientEmail(), u.getName(), poll.getQuestion(), pollId);
        return ResponseEntity.ok(Map.of("message","Poll invitation sent to "+req.recipientEmail()));
    }
}
