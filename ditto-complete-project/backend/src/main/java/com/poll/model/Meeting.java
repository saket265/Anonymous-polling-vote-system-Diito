package com.poll.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
@Entity @Table(name="meetings") @Getter @Setter @NoArgsConstructor
public class Meeting {
    @Id @Column(length=36) private String id = UUID.randomUUID().toString();
    @Column(nullable=false,length=500) private String title;
    @Column(length=1000) private String description;
    @Column(columnDefinition="TEXT") private String timeSlotsJson;
    @Column(nullable=false) private boolean aadhaarRequired = false;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="owner_id") private User owner;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable=false) private boolean active = true;
}
