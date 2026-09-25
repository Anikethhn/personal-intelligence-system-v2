package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.TaskRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    public DashboardController(
            UserRepository userRepository,
            TaskRepository taskRepository) {

        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<Task> tasks =
                taskRepository.findByUser(user);

        long totalTasks = tasks.size();

        long completedTasks = tasks.stream()
                .filter(Task::isCompleted)
                .count();

        long pendingTasks = tasks.stream()
                .filter(task -> !task.isCompleted())
                .count();

        long highPriorityTasks = tasks.stream()
                .filter(task ->
                        !task.isCompleted()
                                &&
                                (
                                        task.getPriority() != null
                                                &&
                                                (
                                                        task.getPriority().name().equals("HIGH")
                                                                ||
                                                                task.getPriority().name().equals("CRITICAL")
                                                )
                                )
                )
                .count();

        Map<String, Object> summary =
                new HashMap<>();

        summary.put("totalTasks", totalTasks);
        summary.put("completedTasks", completedTasks);
        summary.put("pendingTasks", pendingTasks);
        summary.put("highPriorityTasks", highPriorityTasks);

        return ResponseEntity.ok(summary);
    }
}