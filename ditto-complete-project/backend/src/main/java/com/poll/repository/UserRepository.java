package com.poll.repository;
import com.poll.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByEmailVerifyToken(String token);
    Optional<User> findByPasswordResetToken(String token);
    long countByRole(User.Role role);
}
