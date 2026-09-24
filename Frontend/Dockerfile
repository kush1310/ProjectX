# ===================================================================
# Multi-Stage Production Dockerfile for Charusat Needs Frontend
# Stage 1: Build static assets via Node.js
# Stage 2: High-performance, hardened Nginx server
# ===================================================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Cache dependencies
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source and configuration files
COPY tsconfig*.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/

# Production build
ENV NODE_ENV=production
RUN npm run build

# --- Stage 2: Runtime Nginx ---
FROM nginx:1.27-alpine AS runner

# Remove default configuration
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copy built artifacts from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy optimized production Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Security: Set permissions
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
