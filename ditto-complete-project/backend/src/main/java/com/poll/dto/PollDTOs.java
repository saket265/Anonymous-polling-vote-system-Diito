package com.poll.dto;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
public class PollDTOs {
    public record CreatePollRequest(
        @NotBlank(message="Question required") @Size(max=500) String question,
        @NotEmpty @Size(min=2,max=10) List<@NotBlank String> options,
        Integer expiresInHours,
        Boolean ipCheck,
        Boolean trackParticipation) {}
    public record CastVoteRequest(@NotNull Long optionId) {}
    public record PollOptionResponse(Long id, String text, long voteCount) {}
    public record PollResponse(
        String id, String question, String ownerName, String ownerId,
        LocalDateTime createdAt, LocalDateTime expiresAt,
        boolean expired, boolean alreadyVoted, boolean resultsPublic,
        boolean trackParticipation,
        List<PollOptionResponse> options, long totalVotes) {}
    public record VoteResponse(boolean success, String message, Map<Long,Long> results) {}
    public record VoterParticipationResponse(String name, String email, LocalDateTime votedAt) {}
}
