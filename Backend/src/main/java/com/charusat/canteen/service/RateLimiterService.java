package com.charusat.canteen.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory sliding window rate limiter.
 * Lighter than Bucket4j (no Redis dependency) — good for single-instance deployments.
 * For multi-instance production, replace with Bucket4j + Redis.
 */
@Service
@Slf4j
public class RateLimiterService {

    // key -> deque of timestamps in millis
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Long>> windows = new ConcurrentHashMap<>();

    /**
     * Check if a request is allowed under the rate limit.
     *
     * @param key           unique identifier (e.g., "payment:userId:42")
     * @param maxRequests   max requests allowed in window
     * @param windowSeconds window duration in seconds
     * @return true if allowed, false if rate limited
     */
    public boolean isAllowed(String key, int maxRequests, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);

        ConcurrentLinkedDeque<Long> timestamps = windows.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Evict expired entries
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxRequests) {
            log.warn("Rate limit exceeded for key: {}", key);
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    /**
     * Get remaining requests for a key within the current window.
     */
    public int remaining(String key, int maxRequests, int windowSeconds) {
        long windowStart = System.currentTimeMillis() - (windowSeconds * 1000L);
        ConcurrentLinkedDeque<Long> timestamps = windows.get(key);
        if (timestamps == null) return maxRequests;

        // Count active timestamps
        long active = timestamps.stream().filter(t -> t >= windowStart).count();
        return Math.max(0, maxRequests - (int) active);
    }
}
