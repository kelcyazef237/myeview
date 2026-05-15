#!/bin/bash
# MYEVIEW Automated Setup Script
# Run this immediately after cloning the repository.

set -e

echo -e "\033[1;34m=========================================================\033[0m"
echo -e "\033[1;34m   MYEVIEW Automated Setup & Installation Script         \033[0m"
echo -e "\033[1;34m=========================================================\033[0m"
echo ""

# 1. Environment Setup
echo -e "\033[1;36m[1/4] Setting up environment variables...\033[0m"
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    
    # Generate secure random secrets for new deployments
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
    DB_PASS=$(openssl rand -base64 16 | tr -d '\n')
    MINIO_PASS=$(openssl rand -base64 16 | tr -d '\n')
    
    # Replace default templates with secure randoms
    sed -i "s/CHANGE_ME_LONG_RANDOM_SECRET/${JWT_SECRET}/g" .env
    sed -i "s/CHANGE_ME_STRONG_PASSWORD/${DB_PASS}/g" .env
    sed -i "s/CHANGE_ME_MINIO_PASSWORD/${MINIO_PASS}/g" .env
    
    echo -e "\033[1;32m✅ Generated secure JWT and database passwords in .env\033[0m"
else
    echo -e "\033[1;33m⚠️ .env already exists. Skipping environment generation.\033[0m"
fi

# 2. Check System Dependencies
echo ""
echo -e "\033[1;36m[2/4] Checking system dependencies...\033[0m"

install_docker() {
    echo "Docker not found. Attempting to install Docker..."
    if [ -x "$(command -v apt-get)" ]; then
        # 1. Clean up any previous broken attempts
        sudo rm -f /etc/apt/sources.list.d/docker.list
        
        # 2. Detect OS and Codename
        ID=$(grep -E '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')
        VERSION_CODENAME=$(grep -E '^VERSION_CODENAME=' /etc/os-release | cut -d= -f2 | tr -d '"')
        
        if [ -z "$VERSION_CODENAME" ]; then
             VERSION_CODENAME=$(grep -E '^VERSION_ID=' /etc/os-release | cut -d= -f2 | tr -d '"')
        fi

        echo "Detected OS: $ID, Codename: $VERSION_CODENAME"

        # Docker repo path (debian or ubuntu)
        REPO_OS=$ID
        if [ "$ID" = "debian" ] || [ "$ID" = "ubuntu" ]; then
            if [ "$ID" = "debian" ] && [ "$VERSION_CODENAME" = "trixie" ]; then
                echo "Detected Debian Trixie. Falling back to Bookworm for Docker repo..."
                VERSION_CODENAME="bookworm"
            fi
        else
            # Fallback to debian if unknown but apt-based
            REPO_OS="debian"
            VERSION_CODENAME="bookworm"
        fi

        # 3. Now try update after cleaning
        sudo apt-get update || true # Continue even if some repos fail
        sudo apt-get install -y ca-certificates curl gnupg lsb-release

        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/$REPO_OS/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg || (echo "Failed to download GPG key"; exit 1)
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$REPO_OS $VERSION_CODENAME stable" | \
            sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo usermod -aG docker $USER
        echo -e "\033[1;33m⚠️ Docker installed. You may need to log out and log back in for permissions to apply.\033[0m"
    else


        echo -e "\033[1;31m❌ Please install Docker manually: https://docs.docker.com/get-docker/\033[0m"
        exit 1
    fi
}

if ! command -v docker &> /dev/null; then
    install_docker
else
    echo -e "\033[1;32m✅ Docker is installed\033[0m"
fi

if ! docker compose version &> /dev/null; then
    echo -e "\033[1;31m❌ Docker Compose v2 is required but not found.\033[0m"
    exit 1
else
    echo -e "\033[1;32m✅ Docker Compose is available\033[0m"
fi

# 3. Local Development (Optional) Dependencies
echo ""
echo -e "\033[1;36m[3/4] Checking local development tools (Go, Node.js)...\033[0m"
echo "Note: These are only needed if you plan to run/build outside of Docker."

if ! command -v go &> /dev/null; then
    echo -e "\033[1;33m⚠️ Go not found. To develop locally, install Go 1.22+: https://go.dev/doc/install\033[0m"
else
    echo -e "\033[1;32m✅ Go is installed ($(go version))\033[0m"
    echo "Downloading Go modules..."
    go work sync || echo "Minor sync issue, continuing..."
fi

if ! command -v npm &> /dev/null; then
    echo -e "\033[1;33m⚠️ Node.js/npm not found. To develop frontend locally, install Node 20+: https://nodejs.org/\033[0m"
else
    echo -e "\033[1;32m✅ Node.js is installed ($(node -v))\033[0m"
    echo "Installing frontend dependencies..."
    (cd apps/web && npm install)
fi

# 4. Start the Stack
echo ""
echo -e "\033[1;36m[4/4] Starting MYEVIEW Production Stack...\033[0m"
echo "Building and starting Docker containers..."

docker compose up -d --build

echo ""
echo -e "\033[1;34m=========================================================\033[0m"
echo -e "\033[1;32m 🎉 Setup Complete! MYEVIEW is starting up in the background.\033[0m"
echo -e "\033[1;34m=========================================================\033[0m"
echo ""
echo "It may take a few minutes for the databases and services to become fully ready."
echo ""
echo "Access the platform:"
echo "➡️  Web UI: http://localhost:3000"
echo ""
echo "Important Commands:"
echo "- View logs: docker compose logs -f"
echo "- Stop stack: docker compose down"
echo "- Check status: docker compose ps"
echo ""
echo -e "\033[1;33mNext Steps:\033[0m"
echo "1. Edit .env to add your CENSYS_API_ID and DASHSCOPE_API_KEY (for full RAG capabilities)"
echo "2. Run 'docker compose restart discovery compliance' to apply any key updates."
echo "3. Open http://localhost:3000 and create your first administrator account."
