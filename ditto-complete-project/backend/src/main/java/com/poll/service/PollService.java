package com.poll.service;
import com.poll.dto.PollDTOs.*;
import com.poll.email.EmailService;
import com.poll.exception.PollException;
import com.poll.model.*;
import com.poll.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
@Service @RequiredArgsConstructor
public class PollService {
    private final PollRepository pollRepo;
    private final VoteRepository voteRepo;
    private final EmailService emailService;
    @PersistenceContext
    private EntityManager entityManager;
    @Value("${app.frontend.url:http://localhost:3000}") private String frontendUrl;

    @Transactional
    public PollResponse createPoll(CreatePollRequest req, User owner) {
        Poll poll = new Poll();
        poll.setQuestion(req.question());
        poll.setOwner(owner);
        if (req.expiresInHours() != null && req.expiresInHours() > 0)
            poll.setExpiresAt(LocalDateTime.now().plusHours(req.expiresInHours()));
        poll.setIpCheck(req.ipCheck() != null ? req.ipCheck() : false);
        poll.setTrackParticipation(req.trackParticipation() != null ? req.trackParticipation() : false);
        req.options().forEach(t -> poll.addOption(new PollOption(t)));
        Poll savedPoll = pollRepo.saveAndFlush(poll);
        entityManager.refresh(savedPoll);

        if (owner != null)
            emailService.sendPollCreated(owner.getEmail(), owner.getName(), savedPoll.getQuestion(), savedPoll.getId());
        return buildResponse(savedPoll, "");
    }

    @Transactional(readOnly=true)
    public PollResponse getPoll(String id, String tokenHash) {
        Poll poll = pollRepo.findById(id).orElseThrow(() -> new PollException("Poll not found"));
        return buildResponse(poll, tokenHash);
    }

    public PollResponse buildResponse(Poll poll, String tokenHash) {
        boolean voted = !tokenHash.isEmpty() && voteRepo.existsByPollIdAndTokenHash(poll.getId(), tokenHash);
        Map<Long,Long> counts = getVoteCounts(poll.getId());
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        List<PollOptionResponse> opts = poll.getOptions().stream()
            .map(o -> new PollOptionResponse(o.getId(), o.getText(), counts.getOrDefault(o.getId(),0L))).toList();
        String owner = poll.getOwner() != null ? poll.getOwner().getName() : "Anonymous";
        String ownerId = poll.getOwner() != null ? poll.getOwner().getId() : null;
        return new PollResponse(poll.getId(), poll.getQuestion(), owner, ownerId,
            poll.getCreatedAt(), poll.getExpiresAt(), poll.isExpired(), voted,
            poll.isResultsPublic(), poll.isTrackParticipation(), opts, total);
    }

    public Map<Long,Long> getVoteCounts(String pollId) {
        Map<Long,Long> m = new HashMap<>();
        voteRepo.countVotesByOption(pollId).forEach(r -> m.put((Long)r[0],(Long)r[1]));
        return m;
    }

    @Transactional(readOnly=true)
    public String exportPollResults(String id, User user) {
        Poll poll = pollRepo.findById(id).orElseThrow(() -> new PollException("Poll not found"));
        if (poll.getOwner() == null || !poll.getOwner().getId().equals(user.getId())) {
            throw new PollException("Only the creator can download results");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Vote Timestamp,Option Chosen,Voter Signature (Hash),IP Signature (Hash)\n");
        List<Vote> votes = voteRepo.findByPollId(id);
        for (Vote v : votes) {
            sb.append(v.getVotedAt().toString()).append(",");
            sb.append("\"").append(v.getOption().getText().replace("\"", "\"\"")).append("\",");
            sb.append(v.getTokenHash()).append(",");
            sb.append(v.getIpHash() != null ? v.getIpHash() : "N/A").append("\n");
        }
        return sb.toString();
    }

    @Transactional(readOnly=true)
    public List<VoterParticipationResponse> getParticipants(String id, User user) {
        Poll poll = pollRepo.findById(id).orElseThrow(() -> new PollException("Poll not found"));
        if (poll.getOwner() == null || !poll.getOwner().getId().equals(user.getId())) {
            throw new PollException("Only the poll creator can view participation data");
        }
        if (!poll.isTrackParticipation()) {
            throw new PollException("Participation tracking is not enabled for this poll");
        }
        return voteRepo.findByPollIdAndVoterIsNotNull(id).stream()
            .map(v -> new VoterParticipationResponse(
                v.getVoter().getName(), v.getVoter().getEmail(), v.getVotedAt()))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly=true)
    public String exportParticipantsCSV(String id, User user) {
        List<VoterParticipationResponse> participants = getParticipants(id, user);
        StringBuilder sb = new StringBuilder();
        sb.append("Name,Email,Voted At\n");
        for (VoterParticipationResponse p : participants) {
            sb.append("\"").append(p.name().replace("\"", "\"\"")).append("\",");
            sb.append(p.email()).append(",");
            sb.append(p.votedAt().toString()).append("\n");
        }
        return sb.toString();
    }
}
