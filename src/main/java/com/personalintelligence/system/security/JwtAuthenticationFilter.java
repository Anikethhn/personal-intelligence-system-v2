package com.personalintelligence.system.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        System.out.println("========================================");
        System.out.println("JWT REQUEST: "
                + request.getMethod()
                + " "
                + requestURI);

        String authHeader =
                request.getHeader("Authorization");

        System.out.println(
                "AUTHORIZATION HEADER EXISTS: "
                        + (authHeader != null)
        );

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            System.out.println(
                    "NO BEARER TOKEN"
            );

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        String token =
                authHeader.substring(7).trim();

        if (token.isEmpty()) {

            System.out.println(
                    "EMPTY JWT TOKEN"
            );

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }

        try {

            String email =
                    jwtService.extractEmail(token);

            System.out.println(
                    "JWT EMAIL: "
                            + email
            );

            if (email != null &&
                    !email.isBlank()) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of(
                                        new SimpleGrantedAuthority(
                                                "ROLE_USER"
                                        )
                                )
                        );

                SecurityContextHolder
                        .getContext()
                        .setAuthentication(
                                authentication
                        );

                System.out.println(
                        "JWT AUTHENTICATION SUCCESS"
                );
            }

        } catch (Exception e) {

            System.out.println(
                    "JWT VALIDATION FAILED"
            );

            System.out.println(
                    "ERROR: "
                            + e.getClass().getName()
            );

            System.out.println(
                    "MESSAGE: "
                            + e.getMessage()
            );
        }

        System.out.println(
                "SECURITY CONTEXT: "
                        + SecurityContextHolder
                        .getContext()
                        .getAuthentication()
        );

        filterChain.doFilter(
                request,
                response
        );

        System.out.println("========================================");
    }
}