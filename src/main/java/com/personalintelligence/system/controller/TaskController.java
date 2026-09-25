package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<Task> createTask(
            @RequestBody Task task,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.createTask(task, email)
        );
    }

    @GetMapping
    public ResponseEntity<List<Task>> getMyTasks(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.getMyTasks(email)
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Task>> getPendingTasks(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.getPendingTasks(email)
        );
    }

    @GetMapping("/priority")
    public ResponseEntity<List<Task>> getPriorityTasks(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.getPriorityTasks(email)
        );
    }
    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.getTaskById(id, email)
        );
    }
    @PutMapping("/{id}/toggle")
    public ResponseEntity<Task> toggleTask(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.toggleTask(id, email)
        );
    }
    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @PathVariable Long id,
            @RequestBody Task task,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                taskService.updateTask(
                        id,
                        task,
                        email
                )
        );
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        taskService.deleteTask(id, email);

        return ResponseEntity.noContent().build();
    }
}