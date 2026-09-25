package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Decision;
import com.personalintelligence.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DecisionRepository extends JpaRepository<Decision, Long> {

    List<Decision> findByUser(User user);

    List<Decision> findByUserAndStatus(
            User user,
            Decision.Status status
    );

    Optional<Decision> findByIdAndUser(
            Long id,
            User user
    );
}