package com.poll.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity
@Table(name="votes",uniqueConstraints=@UniqueConstraint(columnNames={"poll_id","token_hash"}))
@Getter @Setter @NoArgsConstructor
public class Vote {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="poll_id",nullable=false,length=36) private String pollId;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="option_id",nullable=false) private PollOption option;
    @Column(name="token_hash",nullable=false,length=64) private String tokenHash;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="voter_id") private User voter;
    @Column(name="ip_hash",length=64) private String ipHash;
    @Column(nullable=false) private LocalDateTime votedAt = LocalDateTime.now();
}
