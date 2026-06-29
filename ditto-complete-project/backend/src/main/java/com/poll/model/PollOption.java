package com.poll.model;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="poll_options") @Getter @Setter @NoArgsConstructor
public class PollOption {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=300) private String text;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="poll_id",nullable=false) private Poll poll;
    public PollOption(String text) { this.text = text; }
}
