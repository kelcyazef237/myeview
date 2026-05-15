#!/bin/bash
# ────────────────────────────────────────────────
# MYEVIEW — EC2 Deployment Script
# Usage: ./scripts/deploy.sh [production|staging]
# ────────────────────────────────────────────────
set -euo pipefail

ENVIRONMENT="${1:-staging}"
COMPOSE_FILES="-f docker-compose.yml"

echo "🛡️  MYEVIEW Deployment — ${ENVIRONMENT}"
echo "──────────────────────────────────"

# Production uses overrides
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -f docker-compose.prod.yml"

    # Check .env exists
    if [ ! -f .env ]; then
        echo "❌ ERROR: .env file not found. Copy .env.example to .env and configure."
        exit 1
    fi
fi

# Step 1: Pull latest code (if using git)
echo "📦 Pulling latest code..."
git pull origin main 2>/dev/null || echo "⚠️  Git pull skipped (not a git repo or no remote)"

# Step 2: Build containers
echo "🔨 Building containers..."
docker compose $COMPOSE_FILES build --no-cache

# Step 3: Run database migrations (via IAM auto-migrate on startup)
echo "📊 Starting infrastructure..."
docker compose $COMPOSE_FILES up -d postgres redis

# Wait for Postgres
echo "⏳ Waiting for PostgreSQL..."
until docker compose $COMPOSE_FILES exec -T postgres pg_isready -U myeview > /dev/null 2>&1; do
    sleep 2
done
echo "✅ PostgreSQL is ready"

# Step 4: Start all services
echo "🚀 Starting all services..."
docker compose $COMPOSE_FILES up -d

# Step 5: Health checks
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "🏥 Health Checks:"
echo "──────────────────"

# IAM health
IAM_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null || echo "000")
if [ "$IAM_HEALTH" = "200" ]; then
    echo "  ✅ IAM Service:  healthy"
else
    echo "  ❌ IAM Service:  unhealthy (HTTP $IAM_HEALTH)"
fi

# Web health
WEB_PORT="3000"
[ "$ENVIRONMENT" = "production" ] && WEB_PORT="80"
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_PORT/ 2>/dev/null || echo "000")
if [ "$WEB_HEALTH" = "200" ]; then
    echo "  ✅ Web Frontend: healthy"
else
    echo "  ❌ Web Frontend: unhealthy (HTTP $WEB_HEALTH)"
fi

echo ""
echo "──────────────────────────────────"
echo "🛡️  MYEVIEW deployed successfully!"
echo ""
if [ "$ENVIRONMENT" = "production" ]; then
    echo "  🌐 Dashboard: http://$(hostname -I | awk '{print $1}')"
else
    echo "  🌐 Dashboard: http://localhost:3000"
    echo "  🔑 IAM API:   http://localhost:8080"
    echo "  📊 NATS:      http://localhost:8222"
    echo "  📦 MinIO:     http://localhost:9001"
fi
echo ""
