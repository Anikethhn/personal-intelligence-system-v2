package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Notification;
import com.personalintelligence.system.entity.Priority;
import com.personalintelligence.system.entity.Subscription;
import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.NotificationRepository;
import com.personalintelligence.system.repository.SubscriptionRepository;
import com.personalintelligence.system.repository.TaskRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class NotificationAutomationService {

    private final TaskRepository taskRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    public NotificationAutomationService(
            TaskRepository taskRepository,
            SubscriptionRepository subscriptionRepository,
            NotificationRepository notificationRepository,
            NotificationService notificationService) {

        this.taskRepository = taskRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    public void generateTaskNotifications(User user) {

        List<Task> tasks =
                taskRepository.findByUser(user);

        LocalDateTime now =
                LocalDateTime.now();

        for (Task task : tasks) {

            if (task.isCompleted()) {
                continue;
            }


            if (task.getDueDate() != null &&
                    task.getDueDate().isBefore(now)) {

                createIfNotAlreadyExists(
                        "Overdue Task",
                        "Your task \"" +
                                task.getTitle() +
                                "\" is overdue.",
                        Notification.Type.TASK,
                        Notification.Priority.HIGH,
                        user
                );
            }

            if (task.getPriority() == Priority.HIGH) {

                createIfNotAlreadyExists(
                        "High Priority Task",
                        "You have a high-priority task: \"" +
                                task.getTitle() +
                                "\".",
                        Notification.Type.TASK,
                        Notification.Priority.HIGH,
                        user
                );
            }


            if (task.getDueDate() != null) {

                LocalDateTime dueDate =
                        task.getDueDate();

                LocalDateTime twentyFourHoursLater =
                        now.plusHours(24);

                if (!dueDate.isBefore(now) &&
                        !dueDate.isAfter(
                                twentyFourHoursLater
                        )) {

                    createIfNotAlreadyExists(
                            "Task Due Soon",
                            "Your task \"" +
                                    task.getTitle() +
                                    "\" is due within the next 24 hours.",
                            Notification.Type.TASK,
                            Notification.Priority.MEDIUM,
                            user
                    );
                }
            }
        }
    }


    public void generateSubscriptionNotifications(User user) {

        List<Subscription> subscriptions =
                subscriptionRepository
                        .findByUserAndActive(user, true);

        LocalDate today =
                LocalDate.now();

        for (Subscription subscription : subscriptions) {

            LocalDate billingDate =
                    subscription.getNextBillingDate();

            if (billingDate == null) {
                continue;
            }

            long daysUntilBilling =
                    ChronoUnit.DAYS.between(
                            today,
                            billingDate
                    );

            String title;
            String message;

            if (daysUntilBilling == 3) {

                title =
                        "Subscription Renewal Soon";

                message =
                        subscription.getName() +
                                " will renew in 3 days.";
            }


            else if (daysUntilBilling == 1) {

                title =
                        "Subscription Renews Tomorrow";

                message =
                        subscription.getName() +
                                " will renew tomorrow.";
            }


            else if (daysUntilBilling == 0) {

                title =
                        "Subscription Renewal Today";

                message =
                        subscription.getName() +
                                " renews today.";
            }

            else {

                continue;
            }


            createIfNotAlreadyExists(
                    title,
                    message,
                    Notification.Type.SUBSCRIPTION,
                    Notification.Priority.MEDIUM,
                    user
            );
        }
    }


    private void createIfNotAlreadyExists(
            String title,
            String message,
            Notification.Type type,
            Notification.Priority priority,
            User user) {

        List<Notification> notifications =
                notificationService
                        .getAllNotifications(user);

        boolean exists =
                notifications.stream()
                        .anyMatch(notification ->

                                notification
                                        .getTitle()
                                        .equals(title)

                                        &&

                                        notification
                                                .getMessage()
                                                .equals(message)

                                        &&

                                        !notification.isRead()
                        );


        if (!exists) {

            notificationService.createNotification(
                    title,
                    message,
                    type,
                    priority,
                    user
            );
        }
    }
}