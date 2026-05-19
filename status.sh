#!/bin/bash
# MYEVIEW Status & Connectivity Check
# This script provides a clean overview of service health and frontend connectivity.

# Set colors
GREEN="\033[1;32m"
RED="\033[1;31m"
YELLOW="\033[1;33m"
RESET="\033[0m"

echo -e "\033[1;34m=========================================================\033[0m"
echo -e "\033[1;34m           MYEVIEW Service Status Dashboard              \033[0m"
echo -e "\033[1;34m=========================================================\033[0m"
echo ""

# Function to check a service URL
check_service() {
    local name=$1
    local url=$2
    
    # Try to curl the endpoint with a 2-second timeout
    if curl -s --max-time 2 "$url" | grep -q "ok\|OK\|true" || curl -s --max-time 2 -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        printf "%-25s [ ${GREEN}CONNECTED${RESET} ]\n" "$name"
    else
        printf "%-25s [ ${RED}OFFLINE${RESET}   ]\n" "$name"
    fi
}

echo -e "${YELLOW}1. Core Infrastructure${RESET}"
if docker compose ps | grep -q "Up"; then
    printf "%-25s [ ${GREEN}RUNNING${RESET}   ]\n" "Docker Daemon/Compose"
else
    printf "%-25s [ ${RED}STOPPED${RESET}   ]\n" "Docker Daemon/Compose"
    echo -e "\n${RED}Docker containers are not running. Use './daemon.sh start' to start them.${RESET}"
    exit 1
fi

# Check DBs via docker exec if possible, or just assume connected if container is up
# For simplicity, we just rely on the API health endpoints which check the DB anyway.
echo ""

echo -e "${YELLOW}2. API Microservices (Internal Health)${RESET}"
check_service "IAM / Auth (8080)" "http://localhost:8080/health"
check_service "Discovery (8081)" "http://localhost:8081/health"
check_service "Verification (8082)" "http://localhost:8082/health"
check_service "Enrichment (8083)" "http://localhost:8083/health"
check_service "Scoring (8084)" "http://localhost:8084/health"
check_service "Graph (8085)" "http://localhost:8085/health"
check_service "Compliance (8086)" "http://localhost:8086/health"

echo ""
echo -e "${YELLOW}3. Web Frontend & Connectivity Proxy${RESET}"
check_service "Web UI (3000)" "http://localhost:3000"
# Test proxy routing by hitting IAM through Nginx proxy
check_service "Nginx Proxy -> IAM" "http://localhost:3000/api/v1/auth/health"

echo ""
echo "Note: If API Microservices are OFFLINE, wait a few minutes for them to boot."
echo "If they stay OFFLINE, run 'docker compose logs <service_name>' to check for errors."
echo ""
