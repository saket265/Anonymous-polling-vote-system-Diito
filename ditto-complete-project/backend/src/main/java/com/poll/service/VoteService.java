package com.poll.service;
import com.poll.dto.PollDTOs.*;
import com.poll.exception.PollException;
import com.poll.model.*;
import com.poll.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
@Service @RequiredArgsConstructor
public class VoteService {
    private final PollRepository pollRepo;
    private final VoteRepository voteRepo;
    private final PollService pollService;
    @Transactional
    public VoteResponse castVote(String pollId, Long optionId, String rawToken, String ip, User voter) {
        Poll poll = pollRepo.findById(pollId).orElseThrow(() -> new PollException("Poll not found"));
        if (poll.isExpired()) throw new PollException("This poll has expired");
        String hash = sha256(rawToken);
        if (voteRepo.existsByPollIdAndTokenHash(pollId, hash)) throw new PollException("You have already voted on this poll");
        
        String ipHash = sha256(ip);
        if (poll.isIpCheck() && voteRepo.existsByPollIdAndIpHash(pollId, ipHash)) {
            throw new PollException("A vote from your IP address has already been recorded");
        }

        if (poll.isTrackParticipation() && voter == null) {
            throw new PollException("You must be logged in to vote on this poll (participation tracking is enabled)");
        }

        PollOption opt = poll.getOptions().stream().filter(o -> o.getId().equals(optionId)).findFirst()
            .orElseThrow(() -> new PollException("Invalid option"));
        Vote v = new Vote(); v.setPollId(pollId); v.setOption(opt); v.setTokenHash(hash); v.setIpHash(ipHash);
        if (poll.isTrackParticipation() && voter != null) {
            v.setVoter(voter);
        }
        voteRepo.save(v);
        return new VoteResponse(true, "Vote cast successfully", pollService.getVoteCounts(pollId));
    }
    public static String sha256(String input) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) { throw new RuntimeException(e); }
    }
}
