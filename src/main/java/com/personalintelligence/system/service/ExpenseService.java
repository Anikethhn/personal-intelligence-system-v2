package com.personalintelligence.system.service;

import com.personalintelligence.system.entity.Expense;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.ExpenseRepository;
import com.personalintelligence.system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            UserRepository userRepository) {

        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }



    public Expense createExpense(
            Expense expense,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        expense.setUser(user);

        return expenseRepository.save(expense);
    }



    public List<Expense> getMyExpenses(
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return expenseRepository.findByUser(user);
    }



    public List<Expense> getExpensesByCategory(
            String email,
            String category) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return expenseRepository.findByUserAndCategory(
                user,
                category
        );
    }



    public Double getTotalByCategory(
            String email,
            String category) {

        List<Expense> expenses =
                getExpensesByCategory(
                        email,
                        category
                );

        return expenses.stream()
                .mapToDouble(Expense::getAmount)
                .sum();
    }




    public Double getMonthlyTotal(
            String email,
            int year,
            int month) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        LocalDate start =
                LocalDate.of(year, month, 1);

        LocalDate end =
                start.plusMonths(1);

        List<Expense> expenses =
                expenseRepository
                        .findByUserAndExpenseDateBetween(
                                user,
                                start,
                                end
                        );

        return expenses.stream()
                .mapToDouble(Expense::getAmount)
                .sum();
    }

    public Expense getExpenseById(
            Long expenseId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        return expenseRepository.findByIdAndUser(
                expenseId,
                user
        ).orElseThrow(() ->
                new RuntimeException("Expense not found"));
    }

    public Expense updateExpense(
            Long expenseId,
            Expense updatedExpense,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Expense existingExpense =
                expenseRepository.findByIdAndUser(
                                expenseId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException("Expense not found"));

        existingExpense.setDescription(
                updatedExpense.getDescription()
        );

        existingExpense.setAmount(
                updatedExpense.getAmount()
        );

        existingExpense.setCategory(
                updatedExpense.getCategory()
        );

        existingExpense.setExpenseDate(
                updatedExpense.getExpenseDate()
        );

        return expenseRepository.save(existingExpense);
    }
    public void deleteExpense(
            Long expenseId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        Expense expense =
                expenseRepository
                        .findByIdAndUser(
                                expenseId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Expense not found"
                                ));

        expenseRepository.delete(expense);
    }
}