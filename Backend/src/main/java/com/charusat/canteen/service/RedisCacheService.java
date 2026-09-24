package com.charusat.canteen.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * RedisCacheService
 *
 * Implements resilient Cache-Aside for Charusat Needs.
 * Wraps all Redis operations with graceful degradation.
 * If Redis is unavailable, timing out, or invalid, all methods fail open
 * (falling back cleanly to PostgreSQL source-of-truth) without throwing.
 */
@Service
@Slf4j
public class RedisCacheService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${redis.enabled:false}")
    private boolean redisEnabled;

    @Value("${redis.default-ttl-seconds:300}")
    private long defaultTtlSeconds;

    @Autowired
    public RedisCacheService(
            @Autowired(required = false) StringRedisTemplate redisTemplate,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Retrieve cached value by key
     */
    public <T> Optional<T> get(String key, Class<T> targetClass) {
        if (!isAvailable()) {
            return Optional.empty();
        }
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readValue(value, targetClass));
        } catch (Exception ex) {
            log.warn("Redis GET failed for key '{}': {}. Falling back to database.", key, ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Retrieve cached list / complex type by key
     */
    public <T> Optional<T> get(String key, TypeReference<T> typeReference) {
        if (!isAvailable()) {
            return Optional.empty();
        }
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value == null) {
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readValue(value, typeReference));
        } catch (Exception ex) {
            log.warn("Redis GET failed for key '{}': {}. Falling back to database.", key, ex.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Cache value with custom TTL in seconds
     */
    public void set(String key, Object value, long ttlSeconds) {
        if (!isAvailable()) {
            return;
        }
        try {
            String json = objectMapper.writeValueAsString(value);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
        } catch (Exception ex) {
            log.warn("Redis SET failed for key '{}': {}. Continuing without cache.", key, ex.getMessage());
        }
    }

    /**
     * Cache value with default TTL
     */
    public void set(String key, Object value) {
        set(key, value, defaultTtlSeconds);
    }

    /**
     * Invalidate specific key
     */
    public void evict(String key) {
        if (!isAvailable()) {
            return;
        }
        try {
            redisTemplate.delete(key);
            log.debug("Evicted Redis cache key: {}", key);
        } catch (Exception ex) {
            log.warn("Redis EVICT failed for key '{}': {}", key, ex.getMessage());
        }
    }

    /**
     * Invalidate menu cache for a canteen
     */
    public void evictMenu(Long canteenId) {
        evict("menu:" + canteenId);
    }

    /**
     * Invalidate canteens list and specific canteen cache
     */
    public void evictCanteen(Long canteenId) {
        evict("canteens:all");
        if (canteenId != null) {
            evict("canteen:" + canteenId);
            evict("menu:" + canteenId);
        }
    }

    /**
     * Check if Redis service is active and available
     */
    public boolean isAvailable() {
        return redisEnabled && redisTemplate != null;
    }
}
