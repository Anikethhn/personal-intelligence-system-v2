package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Subscription;
import com.personalintelligence.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUser(User user);

    List<Subscription> findByUserAndActive(
            User user,
            boolean active
    );

    Optional<Subscription> findByIdAndUser(
            Long id,
            User user
    );

    List<Subscription> findByUserAndCategory(
            User user,
            String category
    );
}