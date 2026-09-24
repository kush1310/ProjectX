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

# Security: Create non-root system group and user, install healthcheck utilities and font libraries
RUN apt-get update && apt-get install -y --no-install-recommends curl wget fontconfig libfreetype6 fonts-dejavu-core && rm -rf /var/lib/apt/lists/* \
    && groupadd -r spring && useradd -r -g spring spring

# Copy packaged jar from builder
COPY --from=builder /build/target/canteen-aggregator-1.0.0-SNAPSHOT.jar app.jar

# Download OpenTelemetry Java Agent for Grafana Cloud telemetry export
ARG OTEL_AGENT_VERSION=2.13.0
RUN curl -fsSL -o /app/opentelemetry-javaagent.jar \
    https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v${OTEL_AGENT_VERSION}/opentelemetry-javaagent.jar \
    && chmod 644 /app/opentelemetry-javaagent.jar

# Set ownership
RUN chown -R spring:spring /app

USER spring:spring

EXPOSE 8000

ENV JAVA_OPTS="-Djava.awt.headless=true -XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
ENV OTEL_SERVICE_NAME="charusatneeds-backend"
ENV OTEL_RESOURCE_ATTRIBUTES="service.name=charusatneeds-backend,service.version=1.0.0,deployment.environment=production"
ENV OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/api/public/health || exit 1

# Fail-safe startup: attach OpenTelemetry agent when OTLP endpoint is configured and agent is not disabled
ENTRYPOINT ["sh", "-c", "if [ \"$OTEL_JAVAAGENT_ENABLED\" = \"false\" ] || [ -z \"$OTEL_EXPORTER_OTLP_ENDPOINT\" ]; then exec java $JAVA_OPTS -jar app.jar; else exec java $JAVA_OPTS -javaagent:/app/opentelemetry-javaagent.jar -jar app.jar; fi"]

