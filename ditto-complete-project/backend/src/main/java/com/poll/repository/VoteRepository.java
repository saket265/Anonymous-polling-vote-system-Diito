package com.poll.repository;
import com.poll.model.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface VoteRepository extends JpaRepository<Vote,Long> {
    boolean existsByPollIdAndTokenHash(String pollId, String tokenHash);
    boolean existsByPollIdAndIpHash(String pollId, String ipHash);
    @Query("SELECT v.option.id, COUNT(v) FROM Vote v WHERE v.pollId = :pollId GROUP BY v.option.id")
    List<Object[]> countVotesByOption(String pollId);
    List<Vote> findByPollId(String pollId);
    List<Vote> findByPollIdAndVoterIsNotNull(String pollId);
}
