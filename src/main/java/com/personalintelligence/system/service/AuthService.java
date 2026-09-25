package com.personalintelligence.system.service;

import com.personalintelligence.system.dto.LoginRequest;
import com.personalintelligence.system.dto.RegisterRequest;
import com.personalintelligence.system.entity.User;
import com.personalintelligence.system.repository.UserRepository;
import com.personalintelligence.system.security.JwtService;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtService = jwtService;
    }


    public String register(RegisterRequest request) {

        if (request == null) {
            throw new RuntimeException("Registration request is required");
        }

        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {

            throw new RuntimeException("Email is required");
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            throw new RuntimeException("Password is required");
        }

        String email = request.getEmail().trim();

        if (userRepository.existsByEmail(email)) {

            throw new RuntimeException(
                    "Email already registered"
            );
        }

        String hashedPassword =
                passwordEncoder.encode(
                        request.getPassword()
                );

        User user = new User(

                request.getName(),

                email,

                hashedPassword,

                request.getPhone(),

                request.getDateOfBirth(),

                request.getOccupation(),

                request.getCity(),

                request.getBio()
        );

        userRepository.save(user);

        return "User registered successfully";
    }
    public String login(LoginRequest request) {
        if (request == null) {
            throw new RuntimeException(
                    "Login request is required"
            );
        }
        if (request.getEmail() == null ||
                request.getEmail().isBlank()) {

            throw new RuntimeException(
                    "Email is required"
            );
        }

        if (request.getPassword() == null ||
                request.getPassword().isBlank()) {

            throw new RuntimeException(
                    "Password is required"
            );
        }

        String email = request.getEmail().trim();

        System.out.println(
                "LOGIN EMAIL: [" + email + "]"
        );


        User user =
                userRepository
                        .findByEmail(email)
                        .orElseThrow(() -> {

                            System.out.println(
                                    "USER NOT FOUND: [" + email + "]"
                            );

                            return new RuntimeException(
                                    "Invalid email or password"
                            );
                        });

        System.out.println(
                "DB EMAIL: [" + user.getEmail() + "]"
        );
        String storedHash = user.getPassword();

        System.out.println(
                "HASH LENGTH: " +
                        (storedHash == null
                                ? "NULL"
                                : storedHash.length())
        );

        if (storedHash == null ||
                storedHash.isBlank()) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }


        boolean passwordMatches =
                passwordEncoder.matches(
                        request.getPassword(),
                        storedHash
                );

        System.out.println(
                "PASSWORD MATCH: " +
                        passwordMatches
        );

        if (!passwordMatches) {

            throw new RuntimeException(
                    "Invalid email or password"
            );
        }

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        System.out.println(
                "JWT GENERATED SUCCESSFULLY"
        );

        return token;
    }
}