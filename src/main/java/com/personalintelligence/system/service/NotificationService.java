package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Notification;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }


    public Notification createNotification(
            String title,
            String message,
            Notification.Type type,
            Notification.Priority priority,
            User user) {

        Notification notification = new Notification(
                title,
                message,
                type,
                priority,
                user
        );

        return notificationRepository.save(notification);
    }


    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications(User user) {

        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user);
    }


    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(User user) {

        return notificationRepository
                .findByUserAndReadFalseOrderByCreatedAtDesc(user);
    }



    @Transactional(readOnly = true)
    public List<Notification> getReadNotifications(User user) {

        return notificationRepository
                .findByUserAndReadTrueOrderByCreatedAtDesc(user);
    }



    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByType(
            User user,
            Notification.Type type) {

        return notificationRepository
                .findByUserAndTypeOrderByCreatedAtDesc(
                        user,
                        type
                );
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotificationsByPriority(
            User user,
            Notification.Priority priority) {

        return notificationRepository
                .findByUserAndPriorityOrderByCreatedAtDesc(
                        user,
                        priority
                );
    }



    @Transactional(readOnly = true)
    public Notification getNotification(
            Long id,
            User user) {

        return notificationRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Notification not found"
                        )
                );
    }


    public Notification markAsRead(
            Long id,
            User user) {

        Notification notification =
                getNotification(id, user);

        notification.setRead(true);

        return notificationRepository.save(notification);
    }

    public Notification markAsUnread(
            Long id,
            User user) {

        Notification notification =
                getNotification(id, user);

        notification.setRead(false);

        return notificationRepository.save(notification);
    }


    public int markAllAsRead(User user) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserAndReadFalseOrderByCreatedAtDesc(
                                user
                        );

        for (Notification notification : notifications) {
            notification.setRead(true);
        }

        notificationRepository.saveAll(notifications);

        return notifications.size();
    }


    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {

        return notificationRepository
                .countByUserAndReadFalse(user);
    }


    public void deleteNotification(
            Long id,
            User user) {

        Notification notification =
                getNotification(id, user);

        notificationRepository.delete(notification);
    }



    public int deleteAllReadNotifications(User user) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserAndReadTrueOrderByCreatedAtDesc(
                                user
                        );

        notificationRepository.deleteAll(notifications);

        return notifications.size();
    }
}