package com.poll.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.*;
@Entity @Table(name="polls") @Getter @Setter @NoArgsConstructor
public class Poll {
    @Id @Column(length=36) private String id = UUID.randomUUID().toString();
    @Column(nullable=false,length=500) private String question;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="owner_id") private User owner;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column private LocalDateTime expiresAt;
    @Column(nullable=false) private boolean aadhaarRequired = true;
    @Column(nullable=false) private boolean multiChoice = false;
    @Column(nullable=false) private boolean resultsPublic = false;
    @Column(nullable=false) private boolean ipCheck = false;
    @Column(nullable=false) private boolean trackParticipation = false;
    @OneToMany(mappedBy="poll",cascade=CascadeType.ALL,orphanRemoval=true)
    private List<PollOption> options = new ArrayList<>();
    public boolean isExpired() { return expiresAt!=null && LocalDateTime.now().isAfter(expiresAt); }
    public void addOption(PollOption o) { o.setPoll(this); options.add(o); }
}
