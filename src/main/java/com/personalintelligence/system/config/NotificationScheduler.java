package com.personalintelligence.system.config;

import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.UserRepository;
import com.personalintelligence.system.service.NotificationAutomationService;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotificationScheduler {

    private final UserRepository userRepository;
    private final NotificationAutomationService notificationAutomationService;

    public NotificationScheduler(
            UserRepository userRepository,
            NotificationAutomationService notificationAutomationService) {

        this.userRepository = userRepository;
        this.notificationAutomationService = notificationAutomationService;
    }

    @Scheduled(fixedRate = 1800000)
    public void checkNotifications() {

        List<User> users = userRepository.findAll();

        for (User user : users) {

            try {

                notificationAutomationService
                        .generateTaskNotifications(user);

                notificationAutomationService
                        .generateSubscriptionNotifications(user);

            } catch (Exception exception) {

                System.err.println(
                        "Unable to generate notifications for user "
                                + user.getId()
                                + ": "
                                + exception.getMessage()
                );
            }
        }
    }
}