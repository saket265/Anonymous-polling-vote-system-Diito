package com.poll.repository;
import com.poll.model.Poll;
import com.poll.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface PollRepository extends JpaRepository<Poll,String> {
    List<Poll> findAllByOrderByCreatedAtDesc();
    List<Poll> findByOwnerOrderByCreatedAtDesc(User owner);
    long countByOwner(User owner);
    @Query("SELECT COUNT(p) FROM Poll p WHERE p.owner IS NOT NULL")
    long countRegisteredPolls();
}
