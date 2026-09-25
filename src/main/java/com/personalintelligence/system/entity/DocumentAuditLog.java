package com.personalintelligence.system.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "document_audit_logs",
        indexes = {
                @Index(
                        name = "idx_document_audit_document",
                        columnList = "document_id"
                ),
                @Index(
                        name = "idx_document_audit_user",
                        columnList = "user_id"
                )
        }
)
public class DocumentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 30)
    private String action;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public DocumentAuditLog() {
    }

    public DocumentAuditLog(
            Document document,
            User user,
            String action) {

        this.document = document;
        this.user = user;
        this.action = action;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Document getDocument() {
        return document;
    }

    public User getUser() {
        return user;
    }

    public String getAction() {
        return action;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}