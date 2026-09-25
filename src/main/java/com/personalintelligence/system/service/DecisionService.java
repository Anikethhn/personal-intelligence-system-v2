package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Decision;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.DecisionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DecisionService {

    private final DecisionRepository decisionRepository;

    public DecisionService(DecisionRepository decisionRepository) {
        this.decisionRepository = decisionRepository;
    }

    public Decision createDecision(
            Decision decision,
            User user
    ) {
        decision.setUser(user);
        return decisionRepository.save(decision);
    }

    public List<Decision> getAllDecisions(User user) {
        return decisionRepository.findByUser(user);
    }

    public List<Decision> getByStatus(
            User user,
            Decision.Status status
    ) {
        return decisionRepository.findByUserAndStatus(
                user,
                status
        );
    }

    public Decision getDecision(
            Long id,
            User user
    ) {
        return decisionRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Decision not found"
                        )
                );
    }

    public Decision updateDecision(
            Long id,
            Decision updatedDecision,
            User user
    ) {
        Decision existingDecision =
                getDecision(id, user);

        existingDecision.setTitle(
                updatedDecision.getTitle()
        );

        existingDecision.setDescription(
                updatedDecision.getDescription()
        );

        existingDecision.setOptions(
                updatedDecision.getOptions()
        );

        existingDecision.setPros(
                updatedDecision.getPros()
        );

        existingDecision.setCons(
                updatedDecision.getCons()
        );

        existingDecision.setStatus(
                updatedDecision.getStatus()
        );

        existingDecision.setChosenOption(
                updatedDecision.getChosenOption()
        );

        existingDecision.setOutcome(
                updatedDecision.getOutcome()
        );

        return decisionRepository.save(
                existingDecision
        );
    }

    public Decision updateStatus(
            Long id,
            Decision.Status status,
            User user
    ) {
        Decision decision =
                getDecision(id, user);

        decision.setStatus(status);

        return decisionRepository.save(decision);
    }

    public void deleteDecision(
            Long id,
            User user
    ) {
        Decision decision =
                getDecision(id, user);

        decisionRepository.delete(decision);
    }
}