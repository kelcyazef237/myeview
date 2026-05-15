#!/bin/bash

# MYEVIEW Log Inspector
# This script provides a quick overview of all service logs and statuses.

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================================${NC}"
echo -e "${BLUE}           MYEVIEW Stack Health & Log Overview           ${NC}"
echo -e "${BLUE}=========================================================${NC}"

# 1. Check Container Statuses
echo -e "\n${CYAN}[1/2] Container Statuses:${NC}"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Fetch last logs for each service
echo -e "\n${CYAN}[2/2] Recent Service Logs (Last 20 lines):${NC}"

SERVICES=$(sudo docker compose ps --services)

for SERVICE in $SERVICES; do
    echo -e "\n${GREEN}--- $SERVICE ---${NC}"
    sudo docker compose logs --tail=20 $SERVICE
done

echo -e "\n${BLUE}=========================================================${NC}"
echo -e "To follow all logs in real-time, run: ${GREEN}sudo docker compose logs -f${NC}"
echo -e "${BLUE}=========================================================${NC}"
