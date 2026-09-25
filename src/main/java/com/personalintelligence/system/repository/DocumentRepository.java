package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentRepository
        extends JpaRepository<Document, Long> {

    List<Document> findByUserIdOrderByUploadedAtDesc(Long userId);

    Optional<Document> findByIdAndUserId(
            Long documentId,
            Long userId
    );
}