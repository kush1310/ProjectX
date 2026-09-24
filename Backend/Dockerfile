# ===================================================================
# Multi-Stage Production Dockerfile for Charusat Needs Backend
# Stage 1: Maven Build
# Stage 2: Hardened, Non-root Eclipse Temurin JRE 17 Runtime
# ===================================================================

# --- Stage 1: Build ---
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Cache Maven dependencies
COPY pom.xml ./
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src/ ./src/
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:17-jre-jammy AS runner

WORKDIR /app

# Security: Create non-root system group and user, install healthcheck utilities
RUN apt-get update && apt-get install -y --no-install-recommends curl wget && rm -rf /var/lib/apt/lists/* \
    && groupadd -r spring && useradd -r -g spring spring

# Copy packaged jar from builder
COPY --from=builder /build/target/canteen-aggregator-1.0.0-SNAPSHOT.jar app.jar

# Set ownership
RUN chown -R spring:spring /app

USER spring:spring

EXPOSE 8000

ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/api/public/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
