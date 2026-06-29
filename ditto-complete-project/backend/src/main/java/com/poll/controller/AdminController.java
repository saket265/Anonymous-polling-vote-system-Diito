package com.poll.controller;
import com.poll.email.EmailService;
import com.poll.exception.PollException;
import com.poll.model.Poll;
import com.poll.model.User;
import com.poll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController @RequestMapping("/api/admin") @PreAuthorize("hasRole('ADMIN')") @RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepo;
    private final PollRepository pollRepo;
    private final VoteRepository voteRepo;
    private final EmailService emailService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String,Object>> stats() {
        return ResponseEntity.ok(Map.of(
            "totalUsers", userRepo.count(),
            "totalPolls", pollRepo.count(),
            "totalVotes", voteRepo.count(),
            "adminCount", userRepo.countByRole(User.Role.ADMIN),
            "verifiedPolls", pollRepo.countRegisteredPolls()
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String,Object>>> users() {
        return ResponseEntity.ok(userRepo.findAll().stream().map(u -> Map.<String,Object>of(
            "id",u.getId(),"name",u.getName(),"email",u.getEmail(),
            "role",u.getRole().name(),"emailVerified",u.isEmailVerified(),
            "createdAt",u.getCreatedAt().toString(),"pollCount",pollRepo.countByOwner(u)
        )).toList());
    }

    @GetMapping("/polls")
    public ResponseEntity<List<Map<String,Object>>> polls() {
        return ResponseEntity.ok(pollRepo.findAllByOrderByCreatedAtDesc().stream().map(p -> {
            long votes = p.getOptions().stream().mapToLong(o -> voteRepo.countVotesByOption(p.getId()).stream()
                .filter(r -> r[0].equals(o.getId())).mapToLong(r -> (Long)r[1]).sum()).sum();
            return Map.<String,Object>of(
                "id",p.getId(),"question",p.getQuestion(),
                "ownerName", p.getOwner()!=null?p.getOwner().getName():"Anonymous",
                "ownerEmail", p.getOwner()!=null?p.getOwner().getEmail():"",
                "totalVotes",votes,"optionCount",p.getOptions().size(),
                "expired",p.isExpired(),"aadhaarRequired",p.isAadhaarRequired(),
                "createdAt",p.getCreatedAt().toString()
            );
        }).toList());
    }

    @PatchMapping("/users/{id}/promote")
    public ResponseEntity<Map<String,String>> promote(@PathVariable String id) {
        User u = userRepo.findById(id).orElseThrow(() -> new PollException("User not found"));
        u.setRole(User.Role.ADMIN); userRepo.save(u);
        return ResponseEntity.ok(Map.of("message",u.getName()+" promoted to admin"));
    }

    @DeleteMapping("/polls/{id}")
    public ResponseEntity<Map<String,String>> deletePoll(@PathVariable String id) {
        Poll p = pollRepo.findById(id).orElseThrow(() -> new PollException("Poll not found"));
        pollRepo.delete(p);
        return ResponseEntity.ok(Map.of("message","Poll deleted"));
    }

    @PostMapping("/polls/{id}/share")
    public ResponseEntity<Map<String,String>> share(@PathVariable String id, @RequestBody Map<String,String> body) {
        Poll p = pollRepo.findById(id).orElseThrow(() -> new PollException("Poll not found"));
        String email = body.get("email");
        if (email==null||email.isBlank()) throw new PollException("Email required");
        emailService.sendPollInvite(email,"Ditto Admin",p.getQuestion(),id);
        return ResponseEntity.ok(Map.of("message","Poll shared to "+email));
    }
}
