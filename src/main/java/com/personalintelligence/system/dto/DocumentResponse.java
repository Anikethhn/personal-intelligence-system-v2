package com.personalintelligence.system.dto;

import com.personalintelligence.system.entity.Document;

import java.time.LocalDateTime;

public class DocumentResponse {

    private Long id;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String category;
    private String description;
    private LocalDateTime uploadedAt;

    public DocumentResponse() {
    }

    public DocumentResponse(Document document) {

        this.id = document.getId();
        this.originalFilename =
                document.getOriginalFilename();

        this.contentType =
                document.getContentType();

        this.fileSize =
                document.getFileSize();

        this.category =
                document.getCategory();

        this.description =
                document.getDescription();

        this.uploadedAt =
                document.getUploadedAt();
    }

    public Long getId() {
        return id;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public String getCategory() {
        return category;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
}