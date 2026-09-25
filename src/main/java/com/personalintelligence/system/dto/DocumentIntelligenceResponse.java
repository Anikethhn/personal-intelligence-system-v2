package com.personalintelligence.system.dto;

import com.personalintelligence.system.entity.DocumentIntelligence;
import java.time.LocalDateTime;

public class DocumentIntelligenceResponse {

    private Long id;
    private Long documentId;
    private String extractedText;
    private String summary;
    private String keywords;
    private String extractedDates;
    private String extractedAmounts;
    private String extractedNames;
    private String extractedOrganizations;
    private LocalDateTime processedAt;

    public DocumentIntelligenceResponse() {
    }

    public DocumentIntelligenceResponse(DocumentIntelligence intelligence) {
        this.id = intelligence.getId();
        this.documentId = intelligence.getDocument().getId();
        this.extractedText = intelligence.getExtractedText();
        this.summary = intelligence.getSummary();
        this.keywords = intelligence.getKeywords();
        this.extractedDates = intelligence.getExtractedDates();
        this.extractedAmounts = intelligence.getExtractedAmounts();
        this.extractedNames = intelligence.getExtractedNames();
        this.extractedOrganizations = intelligence.getExtractedOrganizations();
        this.processedAt = intelligence.getProcessedAt();
    }

    public Long getId() {
        return id;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public String getSummary() {
        return summary;
    }

    public String getKeywords() {
        return keywords;
    }

    public String getExtractedDates() {
        return extractedDates;
    }

    public String getExtractedAmounts() {
        return extractedAmounts;
    }

    public String getExtractedNames() {
        return extractedNames;
    }

    public String getExtractedOrganizations() {
        return extractedOrganizations;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }
}