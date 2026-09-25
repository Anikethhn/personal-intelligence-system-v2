package com.personalintelligence.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableScheduling
public class PersonalIntelligenceSystemV2Application {

    public static void main(String[] args) {

        SpringApplication.run(
                PersonalIntelligenceSystemV2Application.class,
                args
        );
    }
}