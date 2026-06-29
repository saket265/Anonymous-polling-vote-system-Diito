package com.poll.repository;
import com.poll.model.Meeting;
import com.poll.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MeetingRepository extends JpaRepository<Meeting,String> {
    List<Meeting> findByOwnerOrderByCreatedAtDesc(User owner);
    List<Meeting> findAllByOrderByCreatedAtDesc();
}
