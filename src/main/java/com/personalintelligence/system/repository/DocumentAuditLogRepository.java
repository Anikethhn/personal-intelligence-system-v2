package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.DocumentAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentAuditLogRepository
        extends JpaRepository<DocumentAuditLog, Long> {

    List<DocumentAuditLog> findByDocumentIdOrderByTimestampDesc(Long documentId);

    void deleteByDocumentId(Long documentId);
}