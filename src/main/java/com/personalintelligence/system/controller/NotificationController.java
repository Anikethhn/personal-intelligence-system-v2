package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Notification;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.service.NotificationService;
import com.personalintelligence.system.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    public NotificationController(
            NotificationService notificationService,
            UserRepository userRepository) {

        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }


    private User getCurrentUser(Authentication authentication) {

        String email = authentication.getName();

        return userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );
    }


    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService.getAllNotifications(user)
        );
    }


    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService.getUnreadNotifications(user)
        );
    }




    @GetMapping("/read")
    public ResponseEntity<List<Notification>> getReadNotifications(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService.getReadNotifications(user)
        );
    }


    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        long count =
                notificationService.getUnreadCount(user);

        return ResponseEntity.ok(
                Map.of("unreadCount", count)
        );
    }


    @GetMapping("/type/{type}")
    public ResponseEntity<List<Notification>> getByType(
            @PathVariable Notification.Type type,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService
                        .getNotificationsByType(user, type)
        );
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<Notification>> getByPriority(
            @PathVariable Notification.Priority priority,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService
                        .getNotificationsByPriority(
                                user,
                                priority
                        )
        );
    }



    @GetMapping("/{id}")
    public ResponseEntity<Notification> getNotification(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService
                        .getNotification(id, user)
        );
    }




    @PostMapping
    public ResponseEntity<Notification> createNotification(
            @RequestBody CreateNotificationRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        Notification notification =
                notificationService.createNotification(
                        request.title(),
                        request.message(),
                        request.type(),
                        request.priority(),
                        user
                );

        if (request.reminderTime() != null) {
            notification.setReminderTime(
                    request.reminderTime()
            );
        }

        return ResponseEntity.ok(notification);
    }



    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService.markAsRead(
                        id,
                        user
                )
        );
    }


    @PutMapping("/{id}/unread")
    public ResponseEntity<Notification> markAsUnread(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        return ResponseEntity.ok(
                notificationService.markAsUnread(
                        id,
                        user
                )
        );
    }


    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        int count =
                notificationService.markAllAsRead(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Notifications marked as read",
                        "updatedCount",
                        count
                )
        );
    }



    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        notificationService.deleteNotification(
                id,
                user
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Notification deleted successfully"
                )
        );
    }



    @DeleteMapping("/read")
    public ResponseEntity<Map<String, Object>> deleteAllRead(
            Authentication authentication) {

        User user = getCurrentUser(authentication);

        int count =
                notificationService
                        .deleteAllReadNotifications(user);

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Read notifications deleted",
                        "deletedCount",
                        count
                )
        );
    }


    public record CreateNotificationRequest(
            String title,
            String message,
            Notification.Type type,
            Notification.Priority priority,
            java.time.LocalDateTime reminderTime
    ) {
    }
}