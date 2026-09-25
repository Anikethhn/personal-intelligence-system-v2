package com.personalintelligence.system.repository;

import com.personalintelligence.system.entity.Expense;
import com.personalintelligence.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserAndCategory(
            User user,
            String category
    );

    List<Expense> findByUserAndExpenseDateBetween(
            User user,
            LocalDate startDate,
            LocalDate endDate
    );

    Optional<Expense> findByIdAndUser(
            Long id,
            User user
    );
}