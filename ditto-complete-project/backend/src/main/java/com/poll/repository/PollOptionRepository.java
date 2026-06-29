package com.poll.repository;
import com.poll.model.PollOption;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PollOptionRepository extends JpaRepository<PollOption,Long> {}
