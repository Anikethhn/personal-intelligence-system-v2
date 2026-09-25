package com.personalintelligence.system.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "document_intelligence",
        indexes = {
                @Index(
                        name = "idx_document_intelligence_document",
                        columnList = "document_id"
                )
        }
)
public class DocumentIntelligence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(
            fetch = FetchType.LAZY,
            optional = false
    )
    @JoinColumn(
            name = "document_id",
            nullable = false,
            unique = true
    )
    private Document document;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedText;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String summary;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String keywords;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedDates;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedAmounts;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedNames;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String extractedOrganizations;

    @Column(nullable = false)
    private LocalDateTime processedAt;

    public DocumentIntelligence() {
    }

    public Long getId() {
        return id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getExtractedDates() {
        return extractedDates;
    }

    public void setExtractedDates(String extractedDates) {
        this.extractedDates = extractedDates;
    }

    public String getExtractedAmounts() {
        return extractedAmounts;
    }

    public void setExtractedAmounts(String extractedAmounts) {
        this.extractedAmounts = extractedAmounts;
    }

    public String getExtractedNames() {
        return extractedNames;
    }

    public void setExtractedNames(String extractedNames) {
        this.extractedNames = extractedNames;
    }

    public String getExtractedOrganizations() {
        return extractedOrganizations;
    }

    public void setExtractedOrganizations(String extractedOrganizations) {
        this.extractedOrganizations = extractedOrganizations;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}