#!/bin/bash
echo "Starting MYEVIEW Microservices Locally..."

# Export required environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=myeview
export DB_PASSWORD=myeview_password
export DB_NAME=myeview
export DB_SSL_MODE=disable
export NATS_URL=nats://localhost:4222
export REDIS_HOST=localhost
export REDIS_PORT=6379
export CORS_ORIGIN=http://localhost:3000
export JWT_SECRET=dev-secret-change-in-production

# Start Go Services in the background using subshells
echo "Starting IAM Service (Port 8080)..."
(cd services/iam && PORT=8080 go run ./cmd/server/main.go > ../../iam.log 2>&1) &
IAM_PID=$!

echo "Starting Discovery Service (Port 8081)..."
(cd services/discovery && PORT=8081 go run ./cmd/server/main.go > ../../discovery.log 2>&1) &
DISC_PID=$!

echo "Starting Verification Service (Port 8082)..."
(cd services/verification && PORT=8082 go run ./cmd/server/main.go > ../../verification.log 2>&1) &
VER_PID=$!

echo "Starting Enrichment Service (Port 8083)..."
(cd services/enrichment && PORT=8083 go run ./cmd/server/main.go > ../../enrichment.log 2>&1) &
ENR_PID=$!

echo "Starting Scoring Service (Port 8084)..."
(cd services/scoring && PORT=8084 go run ./cmd/server/main.go > ../../scoring.log 2>&1) &
SCORE_PID=$!

echo "Starting Graph Service (Port 8085)..."
(cd services/graph && PORT=8085 go run ./cmd/server/main.go > ../../graph.log 2>&1) &
GRAPH_PID=$!

echo "Starting Compliance Service (Port 8086)..."
(cd services/compliance && PORT=8086 go run ./cmd/server/main.go > ../../compliance.log 2>&1) &
COMP_PID=$!

# Start React Frontend
echo "Starting Vite Frontend (Port 3000)..."
(cd apps/web && npm run dev -- --port 3000 --host 0.0.0.0 > ../../web.log 2>&1) &
WEB_PID=$!

echo "========================================================="
echo "✅ All services successfully launched in the background!"
echo "========================================================="
echo "To view the React application, open your browser to:"
echo "http://localhost:3000"
echo "========================================================="
echo ""
echo "To stop all services later, run this exact command:"
echo "kill $IAM_PID $DISC_PID $VER_PID $ENR_PID $SCORE_PID $GRAPH_PID $COMP_PID $WEB_PID"
