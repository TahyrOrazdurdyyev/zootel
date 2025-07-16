#!/bin/bash

# Zootel Deployment Script
# This script deploys the Zootel application to the VPS server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST=${VPS_HOST:-"31.187.72.39"}
VPS_USER=${VPS_USER:-"root"}
VPS_KEY=${VPS_KEY:-"~/.ssh/id_rsa"}
APP_DIR="/var/www/zootel"

echo -e "${YELLOW}🚀 Starting Zootel deployment...${NC}"

# Check if SSH key exists
if [ ! -f "$VPS_KEY" ]; then
    echo -e "${RED}❌ SSH key not found at $VPS_KEY${NC}"
    echo "Please ensure your SSH private key is available and update VPS_KEY environment variable."
    exit 1
fi

# SSH command function
ssh_exec() {
    ssh -i "$VPS_KEY" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

echo -e "${YELLOW}📡 Connecting to VPS...${NC}"

# Test SSH connection
if ! ssh_exec "echo 'SSH connection successful'"; then
    echo -e "${RED}❌ Failed to connect to VPS${NC}"
    exit 1
fi

echo -e "${GREEN}✅ SSH connection established${NC}"

# Execute deployment commands on VPS
ssh_exec "
    set -e
    echo '🔄 Navigating to application directory...'
    cd $APP_DIR || { echo 'Application directory not found. Please clone the repository first.'; exit 1; }
    
    echo '📥 Pulling latest changes...'
    git pull origin main
    
    echo '📦 Installing root dependencies...'
    npm install
    
    echo '📦 Installing frontend dependencies...'
    cd frontend && npm install && cd ..
    
    echo '📦 Installing backend dependencies...'
    cd backend && npm install && cd ..
    
    echo '🏗️ Building frontend...'
    npm run build:frontend
    
    echo '🏗️ Building backend...'
    npm run build:backend
    
    echo '🔄 Restarting application with PM2...'
    pm2 restart zootel-backend || pm2 start backend/src/server.js --name zootel-backend
    pm2 restart zootel-frontend || pm2 serve frontend/dist 3000 --name zootel-frontend --spa
    
    echo '💾 Saving PM2 configuration...'
    pm2 save
    
    echo '✅ Deployment completed successfully!'
"

echo -e "${GREEN}🎉 Zootel deployment completed successfully!${NC}"
echo -e "${YELLOW}📱 Frontend: http://$VPS_HOST:3000${NC}"
echo -e "${YELLOW}🔧 Backend: http://$VPS_HOST:5000${NC}" 