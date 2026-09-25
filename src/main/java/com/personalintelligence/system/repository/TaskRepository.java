package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUser(User user);

    List<Task> findByUserAndCompleted(User user, boolean completed);

    List<Task> findByCompletedFalseAndDueDateBetween(
            LocalDateTime start,
            LocalDateTime end
    );
}