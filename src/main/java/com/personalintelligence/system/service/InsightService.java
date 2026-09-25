package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Decision;
import com.personalintelligence.system.entity.Expense;
import com.personalintelligence.system.entity.Subscription;
import com.personalintelligence.system.entity.Task;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.DecisionRepository;
import com.personalintelligence.system.repository.ExpenseRepository;
import com.personalintelligence.system.repository.SubscriptionRepository;
import com.personalintelligence.system.repository.TaskRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InsightService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ExpenseRepository expenseRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final DecisionRepository decisionRepository;

    public InsightService(
            UserRepository userRepository,
            TaskRepository taskRepository,
            ExpenseRepository expenseRepository,
            SubscriptionRepository subscriptionRepository,
            DecisionRepository decisionRepository) {

        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.expenseRepository = expenseRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.decisionRepository = decisionRepository;
    }

    public Map<String, Object> getInsights(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Task> tasks = taskRepository.findByUser(user);

        if (tasks == null) {
            tasks = new ArrayList<>();
        }

        long totalTasks = tasks.size();

        long completedTasks = tasks.stream()
                .filter(task -> task != null && task.isCompleted())
                .count();

        long pendingTasks = tasks.stream()
                .filter(task -> task != null && !task.isCompleted())
                .count();

        long highPriorityTasks = tasks.stream()
                .filter(task ->
                        task != null
                                && !task.isCompleted()
                                && task.getPriority() != null
                                && (
                                task.getPriority().name().equalsIgnoreCase("HIGH")
                                        || task.getPriority().name().equalsIgnoreCase("CRITICAL")
                        )
                )
                .count();

        double taskCompletionRate = 0.0;

        if (totalTasks > 0) {
            taskCompletionRate =
                    ((double) completedTasks / totalTasks) * 100.0;
        }

        List<Expense> expenses = expenseRepository.findByUser(user);

        if (expenses == null) {
            expenses = new ArrayList<>();
        }

        double totalExpenses = expenses.stream()
                .filter(expense -> expense != null)
                .mapToDouble(expense ->
                        expense.getAmount() != null
                                ? expense.getAmount()
                                : 0.0
                )
                .sum();

        double averageExpense = 0.0;

        if (!expenses.isEmpty()) {
            averageExpense = totalExpenses / expenses.size();
        }

        double highestExpense = expenses.stream()
                .filter(expense -> expense != null)
                .mapToDouble(expense ->
                        expense.getAmount() != null
                                ? expense.getAmount()
                                : 0.0
                )
                .max()
                .orElse(0.0);

        Map<String, Double> categorySpending = new HashMap<>();

        for (Expense expense : expenses) {

            if (expense == null) {
                continue;
            }

            String category = expense.getCategory();

            if (category == null || category.isBlank()) {
                category = "Other";
            }

            double amount =
                    expense.getAmount() != null
                            ? expense.getAmount()
                            : 0.0;

            categorySpending.put(
                    category,
                    categorySpending.getOrDefault(category, 0.0) + amount
            );
        }

        String highestSpendingCategory = "None";
        double highestCategoryAmount = 0.0;

        for (Map.Entry<String, Double> entry :
                categorySpending.entrySet()) {

            if (entry.getValue() > highestCategoryAmount) {
                highestCategoryAmount = entry.getValue();
                highestSpendingCategory = entry.getKey();
            }
        }

        List<Subscription> subscriptions =
                subscriptionRepository.findByUser(user);

        if (subscriptions == null) {
            subscriptions = new ArrayList<>();
        }

        long activeSubscriptions = subscriptions.stream()
                .filter(subscription ->
                        subscription != null
                                && subscription.isActive()
                )
                .count();

        long inactiveSubscriptions = subscriptions.stream()
                .filter(subscription ->
                        subscription != null
                                && !subscription.isActive()
                )
                .count();

        double monthlySubscriptionCost = 0.0;

        for (Subscription subscription : subscriptions) {

            if (subscription == null || !subscription.isActive()) {
                continue;
            }

            double amount =
                    subscription.getAmount() != null
                            ? subscription.getAmount()
                            : 0.0;

            String cycle = subscription.getBillingCycle();

            if (cycle == null || cycle.isBlank()) {
                continue;
            }

            cycle = cycle.trim().toUpperCase();

            if (cycle.contains("MONTH")) {

                monthlySubscriptionCost += amount;

            } else if (
                    cycle.contains("YEAR")
                            || cycle.contains("ANNUAL")
            ) {

                monthlySubscriptionCost += amount / 12.0;

            } else if (cycle.contains("WEEK")) {

                monthlySubscriptionCost += amount * 4.33;

            } else if (cycle.contains("DAY")) {

                monthlySubscriptionCost += amount * 30.44;
            }
        }

        double yearlySubscriptionCost =
                monthlySubscriptionCost * 12.0;

        List<Decision> decisions =
                decisionRepository.findByUser(user);

        if (decisions == null) {
            decisions = new ArrayList<>();
        }

        long pendingDecisions = decisions.stream()
                .filter(decision ->
                        decision != null
                                && decision.getStatus() != null
                                && decision.getStatus()
                                == Decision.Status.PENDING
                )
                .count();

        long decidedDecisions = decisions.stream()
                .filter(decision ->
                        decision != null
                                && decision.getStatus() != null
                                && decision.getStatus()
                                == Decision.Status.DECIDED
                )
                .count();

        long completedDecisions = decisions.stream()
                .filter(decision ->
                        decision != null
                                && decision.getStatus() != null
                                && decision.getStatus()
                                == Decision.Status.COMPLETED
                )
                .count();

        long cancelledDecisions = decisions.stream()
                .filter(decision ->
                        decision != null
                                && decision.getStatus() != null
                                && decision.getStatus()
                                == Decision.Status.CANCELLED
                )
                .count();

        List<String> observations = generateObservations(
                totalTasks,
                completedTasks,
                pendingTasks,
                highPriorityTasks,
                taskCompletionRate,
                totalExpenses,
                highestSpendingCategory,
                monthlySubscriptionCost,
                activeSubscriptions,
                pendingDecisions
        );

        Map<String, Object> insights = new HashMap<>();

        insights.put("totalTasks", totalTasks);
        insights.put("completedTasks", completedTasks);
        insights.put("pendingTasks", pendingTasks);
        insights.put("highPriorityTasks", highPriorityTasks);
        insights.put("taskCompletionRate", taskCompletionRate);

        insights.put("totalExpenses", totalExpenses);
        insights.put("averageExpense", averageExpense);
        insights.put("highestExpense", highestExpense);
        insights.put("highestSpendingCategory", highestSpendingCategory);
        insights.put("highestCategoryAmount", highestCategoryAmount);

        insights.put("activeSubscriptions", activeSubscriptions);
        insights.put("inactiveSubscriptions", inactiveSubscriptions);
        insights.put("monthlySubscriptionCost", monthlySubscriptionCost);
        insights.put("yearlySubscriptionCost", yearlySubscriptionCost);

        insights.put("pendingDecisions", pendingDecisions);
        insights.put("decidedDecisions", decidedDecisions);
        insights.put("completedDecisions", completedDecisions);
        insights.put("cancelledDecisions", cancelledDecisions);

        insights.put("observations", observations);

        return insights;
    }

    private List<String> generateObservations(
            long totalTasks,
            long completedTasks,
            long pendingTasks,
            long highPriorityTasks,
            double taskCompletionRate,
            double totalExpenses,
            String highestSpendingCategory,
            double monthlySubscriptionCost,
            long activeSubscriptions,
            long pendingDecisions) {

        List<String> observations = new ArrayList<>();

        if (totalTasks == 0) {
            observations.add(
                    "You currently have no tasks recorded."
            );
        } else if (taskCompletionRate >= 80) {
            observations.add(
                    "Your task completion rate is above 80%."
            );
        } else if (taskCompletionRate >= 50) {
            observations.add(
                    "You have completed more than half of your tasks."
            );
        } else {
            observations.add(
                    "You have more pending work than completed work."
            );
        }

        if (highPriorityTasks > 0) {
            observations.add(
                    "You have "
                            + highPriorityTasks
                            + " high-priority task(s) requiring attention."
            );
        }

        if (totalExpenses == 0) {
            observations.add(
                    "No expenses have been recorded yet."
            );
        } else {
            observations.add(
                    "Your recorded expenses total ₹"
                            + String.format("%.2f", totalExpenses)
                            + "."
            );

            if (!"None".equals(highestSpendingCategory)) {
                observations.add(
                        "Your highest spending category is "
                                + highestSpendingCategory
                                + "."
                );
            }
        }

        if (activeSubscriptions > 0) {
            observations.add(
                    "Your active subscriptions cost approximately ₹"
                            + String.format(
                            "%.2f",
                            monthlySubscriptionCost
                    )
                            + " per month."
            );
        } else {
            observations.add(
                    "You currently have no active subscriptions."
            );
        }

        if (pendingDecisions > 0) {
            observations.add(
                    "You have "
                            + pendingDecisions
                            + " pending decision(s)."
            );
        } else if (totalTasks > 0) {
            observations.add(
                    "You currently have no pending decisions."
            );
        }

        return observations;
    }
}