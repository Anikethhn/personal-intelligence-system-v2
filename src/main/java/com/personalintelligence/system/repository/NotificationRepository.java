package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Notification;
import com.personalintelligence.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndReadFalseOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndReadTrueOrderByCreatedAtDesc(User user);

    List<Notification> findByUserAndTypeOrderByCreatedAtDesc(
            User user,
            Notification.Type type
    );

    List<Notification> findByUserAndPriorityOrderByCreatedAtDesc(
            User user,
            Notification.Priority priority
    );

    Optional<Notification> findByIdAndUser(
            Long id,
            User user
    );

    long countByUserAndReadFalse(User user);
}