# Multi-stage build with jlink for minimal image size

# Build stage: Full JDK for compilation and jlink
FROM eclipse-temurin:21-jdk-alpine AS builder

# Set working directory
WORKDIR /workspace

# Copy Gradle wrapper and build files
COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle gradle

# Copy source code
COPY src src

# Make gradlew executable and build the application
RUN chmod +x gradlew && \
    ./gradlew bootJar --no-daemon

# Extract JAR layers for better caching
WORKDIR /workspace/extracted
RUN java -Djarmode=layertools -jar /workspace/build/libs/*.jar extract

# Analyze dependencies to determine required modules
RUN jdeps --ignore-missing-deps \
    --recursive \
    --multi-release 21 \
    --print-module-deps \
    --class-path 'dependencies/BOOT-INF/lib/*' \
    /workspace/build/libs/*.jar > /tmp/modules.txt

# Create custom JRE with jlink
RUN jlink \
    --add-modules $(cat /tmp/modules.txt),jdk.crypto.ec \
    --strip-debug \
    --no-man-pages \
    --no-header-files \
    --compress=2 \
    --output /custom-jre

# Runtime stage: Minimal base image with custom JRE
FROM alpine:3.19

# Install only essential packages
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy custom JRE from builder
COPY --from=builder /custom-jre /opt/java

# Copy application layers (better caching)
COPY --from=builder /workspace/extracted/dependencies/ ./
COPY --from=builder /workspace/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/extracted/application/ ./

# Create non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
RUN chown -R spring:spring /app
USER spring:spring

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV JAVA_HOME=/opt/java
ENV PATH="$JAVA_HOME/bin:$PATH"
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]