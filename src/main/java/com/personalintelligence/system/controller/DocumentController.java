package com.personalintelligence.system.controller;

import com.personalintelligence.system.dto.DocumentResponse;
import com.personalintelligence.system.entity.Document;
import com.personalintelligence.system.service.DocumentService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }


    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") String category,
            @RequestParam(
                    value = "description",
                    required = false
            ) String description,
            Authentication authentication) {

        String email = authentication.getName();

        Document document =
                documentService.upload(
                        file,
                        category,
                        description,
                        email
                );

        return ResponseEntity.ok(
                new DocumentResponse(document)
        );
    }


    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getMyDocuments(
            Authentication authentication) {

        String email = authentication.getName();

        List<DocumentResponse> documents =
                documentService
                        .getMyDocuments(email)
                        .stream()
                        .map(DocumentResponse::new)
                        .toList();

        return ResponseEntity.ok(documents);
    }


    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        Document document =
                documentService.getMyDocument(
                        id,
                        email
                );

        return ResponseEntity.ok(
                new DocumentResponse(document)
        );
    }


    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        Document document =
                documentService.getMyDocument(
                        id,
                        email
                );

        InputStream inputStream =
                documentService.download(
                        id,
                        email
                );

        InputStreamResource resource =
                new InputStreamResource(inputStream);

        return ResponseEntity.ok()
                .contentType(
                        MediaType.parseMediaType(
                                document.getContentType()
                        )
                )
                .contentLength(
                        document.getFileSize()
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" +
                                document.getOriginalFilename() +
                                "\""
                )
                .body(resource);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        documentService.delete(
                id,
                email
        );

        return ResponseEntity.noContent().build();
    }
}