package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.DocumentIntelligence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentIntelligenceRepository
        extends JpaRepository<DocumentIntelligence, Long> {

    Optional<DocumentIntelligence> findByDocumentId(Long documentId);

    void deleteByDocumentId(Long documentId);
}