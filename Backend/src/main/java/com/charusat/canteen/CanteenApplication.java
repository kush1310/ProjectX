package com.charusat.canteen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * CHARUSAT Campus Canteen Aggregator
 * Main Spring Boot Application Entry Point
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CanteenApplication {

    public static void main(String[] args) {
        SpringApplication.run(CanteenApplication.class, args);
    }
}
