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

OFFLINE_SERVICES=()

# Function to check an HTTP service URL
check_service_http() {
    local name=$1
    local url=$2
    local docker_name=$3
    
    # Try to curl the endpoint with a 2-second timeout
    if curl -s --max-time 2 "$url" | grep -q "ok\|OK\|true" || curl -s --max-time 2 -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        printf "%-25s [ ${GREEN}CONNECTED${RESET} ]\n" "$name"
    else
        printf "%-25s [ ${RED}OFFLINE${RESET}   ]\n" "$name"
        if [ ! -z "$docker_name" ]; then
            OFFLINE_SERVICES+=("$docker_name")
        fi
    fi
}

# Function to check a pure worker (no HTTP endpoint)
check_service_worker() {
    local name=$1
    local docker_name=$2
    
    if docker compose ps | grep "myeview-$docker_name" | grep -q "Up"; then
        printf "%-25s [ ${GREEN}CONNECTED${RESET} ]\n" "$name"
    else
        printf "%-25s [ ${RED}OFFLINE${RESET}   ]\n" "$name"
        OFFLINE_SERVICES+=("$docker_name")
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

echo ""

echo -e "${YELLOW}2. API Microservices (Internal Health)${RESET}"
check_service_http "IAM / Auth (8080)" "http://localhost:8080/health" "iam"
check_service_http "Discovery (8081)" "http://localhost:8081/health" "discovery"
check_service_worker "Verification (Worker)" "verification"
check_service_http "Enrichment (8083)" "http://localhost:8083/health" "enrichment"
check_service_http "Scoring (8084)" "http://localhost:8084/health" "scoring"
check_service_http "Graph (8085)" "http://localhost:8085/health" "graph"
check_service_http "Compliance (8086)" "http://localhost:8086/health" "compliance"

echo ""
echo -e "${YELLOW}3. Web Frontend & Connectivity Proxy${RESET}"
check_service_http "Web UI (3000)" "http://localhost:3000" "web"
check_service_http "Nginx Proxy Route" "http://localhost:3000/nginx-health" ""

echo ""
if [ ${#OFFLINE_SERVICES[@]} -ne 0 ]; then
    echo -e "${RED}Some services are OFFLINE. Fetching recent logs...${RESET}"
    echo "========================================================="
    for svc in "${OFFLINE_SERVICES[@]}"; do
        echo -e "\n${YELLOW}---> Logs for service: ${svc} <---${RESET}"
        docker compose logs --tail=15 "$svc" 2>/dev/null || echo "Could not fetch logs for $svc."
    done
    echo -e "\n========================================================="
    echo "Note: If the containers are still booting, wait a minute and run ./status.sh again."
else
    echo -e "${GREEN}All systems are go! No offline services detected.${RESET}"
fi
echo ""
