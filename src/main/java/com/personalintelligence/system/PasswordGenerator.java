package com.personalintelligence.system;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {

    public static void main(String[] args) {

        BCryptPasswordEncoder encoder =
                new BCryptPasswordEncoder();

        String password = "NewTest@123";

        String hash = encoder.encode(password);

        System.out.println("HASH:");
        System.out.println(hash);

        System.out.println("MATCH:");
        System.out.println(
                encoder.matches(password, hash)
        );
    }
}