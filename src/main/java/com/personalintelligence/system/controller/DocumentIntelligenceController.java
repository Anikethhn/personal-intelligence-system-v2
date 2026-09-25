package com.personalintelligence.system.controller;

import com.personalintelligence.system.dto.DocumentIntelligenceResponse;
import com.personalintelligence.system.entity.Document;
import com.personalintelligence.system.entity.DocumentIntelligence;
import com.personalintelligence.system.service.DocumentIntelligenceService;
import com.personalintelligence.system.service.DocumentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/documents")
public class DocumentIntelligenceController {

    private final DocumentService documentService;
    private final DocumentIntelligenceService intelligenceService;

    public DocumentIntelligenceController(
            DocumentService documentService,
            DocumentIntelligenceService intelligenceService) {

        this.documentService = documentService;
        this.intelligenceService = intelligenceService;
    }

    @GetMapping("/{id}/intelligence")
    public ResponseEntity<DocumentIntelligenceResponse> getIntelligence(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        Document document =
                documentService.getMyDocument(id, email);

        DocumentIntelligence intelligence =
                intelligenceService
                        .getIntelligence(document.getId())
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Document intelligence not found"
                                ));

        return ResponseEntity.ok(
                new DocumentIntelligenceResponse(
                        intelligence
                )
        );
    }

    @PostMapping("/{id}/intelligence/process")
    public ResponseEntity<DocumentIntelligenceResponse> processIntelligence(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        DocumentIntelligence intelligence =
                documentService
                        .reprocessDocumentIntelligence(
                                id,
                                email
                        );

        return ResponseEntity.ok(
                new DocumentIntelligenceResponse(
                        intelligence
                )
        );
    }
}