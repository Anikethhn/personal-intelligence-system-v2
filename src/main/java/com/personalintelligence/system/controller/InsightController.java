package com.personalintelligence.system.controller;

import com.personalintelligence.system.service.InsightService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/insight")
public class InsightController {

    private final InsightService insightService;

    public InsightController(
            InsightService insightService) {

        this.insightService = insightService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getInsights(
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(401)
                    .body(
                            Map.of(
                                    "status",
                                    "UNAUTHORIZED",

                                    "message",
                                    "User authentication is required"
                            )
                    );
        }

        String email =
                authentication.getName();

        System.out.println(
                "INSIGHT REQUEST FOR: "
                        + email
        );

        Map<String, Object> insights =
                insightService.getInsights(email);

        return ResponseEntity.ok(insights);
    }
}