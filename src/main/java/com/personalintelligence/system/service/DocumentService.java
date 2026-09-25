package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Document;
import com.personalintelligence.system.entity.DocumentAuditLog;
import com.personalintelligence.system.entity.DocumentIntelligence;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.DocumentAuditLogRepository;
import com.personalintelligence.system.repository.DocumentIntelligenceRepository;
import com.personalintelligence.system.repository.DocumentRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    private final DocumentRepository documentRepository;
    private final DocumentAuditLogRepository documentAuditLogRepository;
    private final DocumentIntelligenceRepository documentIntelligenceRepository;
    private final UserRepository userRepository;
    private final DocumentStorageService documentStorageService;
    private final DocumentTextExtractionService documentTextExtractionService;
    private final DocumentIntelligenceService documentIntelligenceService;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentAuditLogRepository documentAuditLogRepository,
            DocumentIntelligenceRepository documentIntelligenceRepository,
            UserRepository userRepository,
            DocumentStorageService documentStorageService,
            DocumentTextExtractionService documentTextExtractionService,
            DocumentIntelligenceService documentIntelligenceService) {

        this.documentRepository = documentRepository;
        this.documentAuditLogRepository = documentAuditLogRepository;
        this.documentIntelligenceRepository = documentIntelligenceRepository;
        this.userRepository = userRepository;
        this.documentStorageService = documentStorageService;
        this.documentTextExtractionService = documentTextExtractionService;
        this.documentIntelligenceService = documentIntelligenceService;
    }

    @Transactional
    public Document upload(
            MultipartFile file,
            String category,
            String description,
            String email) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Please select a file"
            );
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size must not exceed 10 MB"
            );
        }

        String contentType = file.getContentType();

        if (!isSupportedContentType(contentType)) {
            throw new IllegalArgumentException(
                    "Unsupported document type"
            );
        }

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        String originalFilename =
                sanitizeFilename(
                        file.getOriginalFilename()
                );

        String storageFilename =
                documentStorageService.store(file);

        Document document =
                new Document();

        document.setOriginalFilename(
                originalFilename
        );

        document.setStorageFilename(
                storageFilename
        );

        document.setContentType(
                contentType
        );

        document.setFileSize(
                file.getSize()
        );

        document.setCategory(
                category
        );

        document.setDescription(
                description
        );

        document.setUploadedAt(
                LocalDateTime.now()
        );

        document.setUser(
                user
        );

        Document savedDocument =
                documentRepository.save(
                        document
                );

        DocumentAuditLog auditLog =
                new DocumentAuditLog(
                        savedDocument,
                        user,
                        "UPLOAD"
                );

        documentAuditLogRepository.save(
                auditLog
        );

        processDocumentIntelligence(
                savedDocument
        );

        return savedDocument;
    }

    public List<Document> getMyDocuments(
            String email) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        return documentRepository
                .findByUserIdOrderByUploadedAtDesc(
                        user.getId()
                );
    }

    public Document getMyDocument(
            Long id,
            String email) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        return documentRepository
                .findByIdAndUserId(
                        id,
                        user.getId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Document not found"
                        )
                );
    }

    public InputStream download(
            Long id,
            String email) {

        Document document =
                getMyDocument(
                        id,
                        email
                );

        DocumentAuditLog auditLog =
                new DocumentAuditLog(
                        document,
                        document.getUser(),
                        "DOWNLOAD"
                );

        documentAuditLogRepository.save(
                auditLog
        );

        return documentStorageService
                .openDecryptedStream(
                        document.getStorageFilename()
                );
    }

    @Transactional
    public void delete(
            Long id,
            String email) {

        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                )
                        );

        Document document =
                documentRepository
                        .findByIdAndUserId(
                                id,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document not found"
                                )
                        );

        String storageFilename =
                document.getStorageFilename();

        documentIntelligenceRepository
                .deleteByDocumentId(
                        document.getId()
                );

        documentAuditLogRepository
                .deleteByDocumentId(
                        document.getId()
                );

        documentRepository.delete(
                document
        );

        documentRepository.flush();

        documentStorageService.delete(
                storageFilename
        );
    }

    @Transactional
    public DocumentIntelligence reprocessDocumentIntelligence(
            Long id,
            String email) {

        Document document =
                getMyDocument(
                        id,
                        email
                );

        return processDocumentIntelligence(
                document
        );
    }

    private DocumentIntelligence processDocumentIntelligence(
            Document document) {

        if (!isIntelligenceSupported(
                document.getContentType()
        )) {
            return null;
        }

        try {

            InputStream inputStream =
                    documentStorageService
                            .openDecryptedStream(
                                    document.getStorageFilename()
                            );

            String extractedText;

            try (InputStream stream =
                         inputStream) {

                extractedText =
                        documentTextExtractionService
                                .extractText(
                                        stream,
                                        document.getOriginalFilename(),
                                        document.getContentType()
                                );
            }

            if (extractedText == null) {
                extractedText = "";
            }

            return documentIntelligenceService
                    .processDocument(
                            document,
                            extractedText
                    );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to process document intelligence",
                    e
            );
        }
    }

    private boolean isIntelligenceSupported(
            String contentType) {

        return "application/pdf"
                .equalsIgnoreCase(contentType)

                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                .equalsIgnoreCase(contentType)

                || "text/plain"
                .equalsIgnoreCase(contentType)

                || "image/png"
                .equalsIgnoreCase(contentType)

                || "image/jpeg"
                .equalsIgnoreCase(contentType)

                || "image/jpg"
                .equalsIgnoreCase(contentType);
    }

    private boolean isSupportedContentType(
            String contentType) {

        return "application/pdf"
                .equalsIgnoreCase(contentType)

                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                .equalsIgnoreCase(contentType)

                || "text/plain"
                .equalsIgnoreCase(contentType)

                || "image/png"
                .equalsIgnoreCase(contentType)

                || "image/jpeg"
                .equalsIgnoreCase(contentType)

                || "image/jpg"
                .equalsIgnoreCase(contentType);
    }

    private String sanitizeFilename(
            String filename) {

        if (filename == null ||
                filename.isBlank()) {

            return "document";
        }

        String sanitized =
                filename
                        .replace("\\", "_")
                        .replace("/", "_")
                        .replace("..", "_")
                        .trim();

        if (sanitized.length() > 255) {
            sanitized =
                    sanitized.substring(
                            0,
                            255
                    );
        }

        return sanitized;
    }
}