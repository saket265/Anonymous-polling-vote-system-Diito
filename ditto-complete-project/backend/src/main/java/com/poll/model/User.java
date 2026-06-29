package com.poll.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor
public class User {
    @Id @Column(length=36) private String id = UUID.randomUUID().toString();
    @Column(nullable=false,length=100) private String name;
    @Column(nullable=false,unique=true,length=150) private String email;
    @Column(nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) private Role role = Role.USER;
    @Column(nullable=false) private boolean emailVerified = false;
    @Column(length=64) private String emailVerifyToken;
    @Column(length=64) private String passwordResetToken;
    @Column private LocalDateTime passwordResetExpiry;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column private LocalDateTime lastLoginAt;
    public enum Role { USER, ADMIN }
}
