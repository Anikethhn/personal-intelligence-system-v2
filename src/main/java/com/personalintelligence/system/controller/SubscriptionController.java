package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Subscription;
import com.personalintelligence.system.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(
            SubscriptionService subscriptionService) {

        this.subscriptionService = subscriptionService;
    }

    @PostMapping
    public ResponseEntity<Subscription> createSubscription(
            @RequestBody Subscription subscription,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.createSubscription(
                        subscription,
                        email
                )
        );
    }



    @GetMapping
    public ResponseEntity<List<Subscription>> getMySubscriptions(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.getMySubscriptions(email)
        );
    }



    @GetMapping("/active")
    public ResponseEntity<List<Subscription>> getActiveSubscriptions(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.getActiveSubscriptions(email)
        );
    }



    @GetMapping("/inactive")
    public ResponseEntity<List<Subscription>> getInactiveSubscriptions(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.getInactiveSubscriptions(email)
        );
    }


    @GetMapping("/category/{category}")
    public ResponseEntity<List<Subscription>>
    getSubscriptionsByCategory(
            @PathVariable String category,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService
                        .getSubscriptionsByCategory(
                                category,
                                email
                        )
        );
    }


    @GetMapping("/{id}")
    public ResponseEntity<Subscription> getSubscriptionById(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.getSubscriptionById(
                        id,
                        email
                )
        );
    }


    @PutMapping("/{id}")
    public ResponseEntity<Subscription> updateSubscription(
            @PathVariable Long id,
            @RequestBody Subscription subscription,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.updateSubscription(
                        id,
                        subscription,
                        email
                )
        );
    }



    @PutMapping("/{id}/toggle")
    public ResponseEntity<Subscription> toggleSubscription(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                subscriptionService.toggleSubscription(
                        id,
                        email
                )
        );
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubscription(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        subscriptionService.deleteSubscription(
                id,
                email
        );

        return ResponseEntity.noContent().build();
    }
}