package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.TaskRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository) {

        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public Task createTask(Task task, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        task.setId(null);
        task.setUser(user);
        task.setCompleted(false);

        if (task.getPriority() == null) {
            task.setPriority(
                    com.personalintelligence.system.entity.Priority.MEDIUM
            );
        }

        return taskRepository.save(task);
    }

    public List<Task> getMyTasks(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return taskRepository.findByUser(user);
    }

    public List<Task> getPendingTasks(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return taskRepository.findByUserAndCompleted(user, false);
    }

    public List<Task> getPriorityTasks(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        List<Task> tasks =
                taskRepository.findByUserAndCompleted(user, false);

        tasks.sort(
                Comparator
                        .comparingInt(this::priorityScore)
                        .reversed()
                        .thenComparing(Task::getDueDate)
        );

        return tasks;
    }

    private int priorityScore(Task task) {

        if (task.getPriority() == null) {
            return 0;
        }

        return switch (task.getPriority()) {
            case CRITICAL -> 4;
            case HIGH -> 3;
            case MEDIUM -> 2;
            case LOW -> 1;
        };
    }

    public Task toggleTask(Long taskId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to modify this task"
            );
        }

        task.setCompleted(!task.isCompleted());

        return taskRepository.save(task);
    }
    public Task getTaskById(
            Long taskId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));


        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to view this task"
            );
        }

        return task;
    }
    public Task updateTask(
            Long taskId,
            Task updatedTask,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Task existingTask = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        // Make sure the task belongs to the logged-in user
        if (!existingTask.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to modify this task"
            );
        }

        existingTask.setTitle(updatedTask.getTitle());
        existingTask.setDescription(updatedTask.getDescription());
        existingTask.setDueDate(updatedTask.getDueDate());
        existingTask.setPriority(updatedTask.getPriority());

        return taskRepository.save(existingTask);
    }
    public void deleteTask(Long taskId, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() ->
                        new RuntimeException("Task not found"));

        if (!task.getUser().getId().equals(user.getId())) {
            throw new RuntimeException(
                    "You are not allowed to delete this task"
            );
        }

        taskRepository.delete(task);
    }
}