package com.poll.controller;
import com.poll.model.Meeting;
import com.poll.model.User;
import com.poll.repository.MeetingRepository;
import com.poll.exception.PollException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
@RestController @RequestMapping("/api/meetings") @RequiredArgsConstructor
public class MeetingController {
    private final MeetingRepository meetingRepo;
    @PostMapping
    public ResponseEntity<Meeting> create(@RequestBody Map<String,Object> body, HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        Meeting m = new Meeting();
        m.setTitle((String)body.getOrDefault("title","Untitled Meeting"));
        m.setDescription((String)body.getOrDefault("description",""));
        m.setTimeSlotsJson((String)body.getOrDefault("timeSlotsJson","[]"));
        m.setAadhaarRequired(Boolean.TRUE.equals(body.get("aadhaarRequired")));
        m.setOwner(u); meetingRepo.save(m);
        return ResponseEntity.ok(m);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Meeting> get(@PathVariable String id) {
        return ResponseEntity.ok(meetingRepo.findById(id).orElseThrow(() -> new PollException("Not found")));
    }
    @GetMapping("/all")
    public ResponseEntity<List<Meeting>> all() { return ResponseEntity.ok(meetingRepo.findAllByOrderByCreatedAtDesc()); }
    @GetMapping("/my")
    public ResponseEntity<List<Meeting>> my(HttpServletRequest r) {
        User u = (User)r.getAttribute("authUser");
        if (u==null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(meetingRepo.findByOwnerOrderByCreatedAtDesc(u));
    }
}
