package com.poll.controller;
import com.poll.dto.PollDTOs.*;
import com.poll.filter.AnonymityFilter;
import com.poll.model.User;
import com.poll.service.VoteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/polls") @RequiredArgsConstructor
public class VoteController {
    private final VoteService voteService;
    @PostMapping("/{id}/vote")
    public ResponseEntity<VoteResponse> vote(@PathVariable String id,
            @Valid @RequestBody CastVoteRequest req, HttpServletRequest r) {
        String raw = (String)r.getAttribute(AnonymityFilter.TOKEN_ATTR);
        String ip = r.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) ip = r.getRemoteAddr();
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        User voter = (User) r.getAttribute("authUser");
        return ResponseEntity.ok(voteService.castVote(id, req.optionId(), raw, ip, voter));
    }
}
