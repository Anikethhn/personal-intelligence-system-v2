package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Decision;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.UserRepository;
import com.personalintelligence.system.service.DecisionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decisions")
public class DecisionController {

    private final DecisionService decisionService;
    private final UserRepository userRepository;

    public DecisionController(
            DecisionService decisionService,
            UserRepository userRepository
    ) {
        this.decisionService = decisionService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Decision> createDecision(
            @RequestBody Decision decision,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        Decision savedDecision =
                decisionService.createDecision(
                        decision,
                        user
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedDecision);
    }

    @GetMapping
    public ResponseEntity<List<Decision>> getAllDecisions(
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                decisionService.getAllDecisions(user)
        );
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Decision>> getByStatus(
            @PathVariable Decision.Status status,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                decisionService.getByStatus(
                        user,
                        status
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Decision> getDecision(
            @PathVariable Long id,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                decisionService.getDecision(
                        id,
                        user
                )
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Decision> updateDecision(
            @PathVariable Long id,
            @RequestBody Decision decision,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                decisionService.updateDecision(
                        id,
                        decision,
                        user
                )
        );
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Decision> updateStatus(
            @PathVariable Long id,
            @RequestParam Decision.Status status,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                decisionService.updateStatus(
                        id,
                        status,
                        user
                )
        );
    }

    // Delete decision
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDecision(
            @PathVariable Long id,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        decisionService.deleteDecision(
                id,
                user
        );

        return ResponseEntity.noContent().build();
    }

    private User getAuthenticatedUser(
            Authentication authentication
    ) {

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Authenticated user not found"
                        )
                );
    }
}