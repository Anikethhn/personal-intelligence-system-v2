package com.personalintelligence.system.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "decisions")
public class Decision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(length = 2000)
    private String options;

    @Column(length = 2000)
    private String pros;

    @Column(length = 2000)
    private String cons;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    @Column(length = 2000)
    private String chosenOption;

    @Column(length = 2000)
    private String outcome;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public enum Status {
        PENDING,
        DECIDED,
        COMPLETED,
        CANCELLED
    }

    public Decision() {
    }

    public Decision(
            String title,
            String description,
            String options,
            String pros,
            String cons,
            User user
    ) {
        this.title = title;
        this.description = description;
        this.options = options;
        this.pros = pros;
        this.cons = cons;
        this.user = user;
        this.status = Status.PENDING;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }

        if (status == null) {
            status = Status.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getOptions() {
        return options;
    }

    public String getPros() {
        return pros;
    }

    public String getCons() {
        return cons;
    }

    public Status getStatus() {
        return status;
    }

    public String getChosenOption() {
        return chosenOption;
    }

    public String getOutcome() {
        return outcome;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public User getUser() {
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setOptions(String options) {
        this.options = options;
    }

    public void setPros(String pros) {
        this.pros = pros;
    }

    public void setCons(String cons) {
        this.cons = cons;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setChosenOption(String chosenOption) {
        this.chosenOption = chosenOption;
    }

    public void setOutcome(String outcome) {
        this.outcome = outcome;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setUser(User user) {
        this.user = user;
    }
}