package com.personalintelligence.system.controller;

import com.personalintelligence.system.entity.Expense;
import com.personalintelligence.system.service.ExpenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @RequestBody Expense expense,
            Authentication authentication) {

        String email = authentication.getName();

        Expense savedExpense =
                expenseService.createExpense(expense, email);

        return ResponseEntity.ok(savedExpense);
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getMyExpenses(
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                expenseService.getMyExpenses(email)
        );
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Expense>> getExpensesByCategory(
            @PathVariable String category,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                expenseService.getExpensesByCategory(
                        email,
                        category
                )
        );
    }

    @GetMapping("/category/{category}/total")
    public ResponseEntity<Double> getTotalByCategory(
            @PathVariable String category,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                expenseService.getTotalByCategory(
                        email,
                        category
                )
        );
    }

    @GetMapping("/monthly-total/{year}/{month}")
    public ResponseEntity<Double> getMonthlyTotal(
            @PathVariable int year,
            @PathVariable int month,
            Authentication authentication) {

        String email = authentication.getName();

        return ResponseEntity.ok(
                expenseService.getMonthlyTotal(
                        email,
                        year,
                        month
                )
        );
    }
    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        Expense expense =
                expenseService.getExpenseById(id, email);

        return ResponseEntity.ok(expense);
    }
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long id,
            @RequestBody Expense expense,
            Authentication authentication) {

        String email = authentication.getName();

        Expense updatedExpense =
                expenseService.updateExpense(
                        id,
                        expense,
                        email
                );

        return ResponseEntity.ok(updatedExpense);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        expenseService.deleteExpense(id, email);

        return ResponseEntity.noContent().build();
    }
}

