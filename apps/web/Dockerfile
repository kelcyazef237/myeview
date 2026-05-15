# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency caching
COPY apps/web/package.json apps/web/package-lock.json* ./

# Install dependencies
RUN npm ci --ignore-scripts 2>/dev/null || npm install

# Copy source
COPY apps/web/ .

# Build production bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ──
FROM nginx:1.25-alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/myeview.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Security: run as non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
