package com.poll.controller;
import com.poll.dto.PollDTOs.*;
import com.poll.filter.AnonymityFilter;
import com.poll.model.User;
import com.poll.repository.PollRepository;
import com.poll.service.PollService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import static com.poll.service.VoteService.sha256;
@RestController @RequestMapping("/api/polls") @RequiredArgsConstructor
public class PollController {
    private final PollService pollService;
    private final PollRepository pollRepo;

    @PostMapping
    public ResponseEntity<PollResponse> create(@Valid @RequestBody CreatePollRequest req, HttpServletRequest r) {
        return ResponseEntity.ok(pollService.createPoll(req, (User)r.getAttribute("authUser")));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PollResponse>> getAll(HttpServletRequest r) {
        String hash = getHash(r);
        return ResponseEntity.ok(pollRepo.findAllByOrderByCreatedAtDesc().stream()
            .map(p -> pollService.buildResponse(p, hash)).toList());
    }

    @GetMapping("/my")
    public ResponseEntity<List<PollResponse>> getMy(HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u == null) return ResponseEntity.status(401).build();
        String hash = getHash(r);
        return ResponseEntity.ok(pollRepo.findByOwnerOrderByCreatedAtDesc(u).stream()
            .map(p -> pollService.buildResponse(p, hash)).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PollResponse> get(@PathVariable String id, HttpServletRequest r) {
        return ResponseEntity.ok(pollService.getPoll(id, getHash(r)));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<String> export(@PathVariable String id, HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(pollService.exportPollResults(id, u));
    }

    @GetMapping("/{id}/participants")
    public ResponseEntity<List<VoterParticipationResponse>> getParticipants(@PathVariable String id, HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(pollService.getParticipants(id, u));
    }

    @GetMapping("/{id}/participants/export")
    public ResponseEntity<String> exportParticipants(@PathVariable String id, HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(pollService.exportParticipantsCSV(id, u));
    }

    private String getHash(HttpServletRequest r) {
        String t = (String)r.getAttribute(AnonymityFilter.TOKEN_ATTR);
        return t != null ? sha256(t) : "";
    }
}
