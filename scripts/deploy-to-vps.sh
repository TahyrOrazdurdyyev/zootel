#!/bin/bash

# Zootel VPS Deployment Script
# Complete deployment setup for production VPS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="31.187.72.39"
VPS_USER="root"
APP_DIR="/var/www/zootel"
GITHUB_REPO="https://github.com/TahyrOrazdurdyyev/zootel.git"

echo -e "${BLUE}🚀 Zootel VPS Deployment Script${NC}"
echo -e "${BLUE}================================${NC}"

# Function to execute commands on VPS
ssh_exec() {
    ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$1"
}

# Function to copy files to VPS
scp_copy() {
    scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_HOST:$2"
}

echo -e "${YELLOW}📡 Step 1: Testing VPS connection...${NC}"
if ! ssh_exec "echo 'SSH connection successful'"; then
    echo -e "${RED}❌ Failed to connect to VPS${NC}"
    echo "Please check:"
    echo "- VPS is running and accessible"
    echo "- SSH key is properly configured"
    echo "- Firewall allows SSH connections"
    exit 1
fi
echo -e "${GREEN}✅ VPS connection established${NC}"

echo -e "${YELLOW}📦 Step 2: Installing system dependencies...${NC}"
ssh_exec "
    apt update
    apt install -y curl git nginx mysql-server certbot python3-certbot-nginx
    
    # Install Node.js 18
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Setup PM2 startup
    pm2 startup
    
    echo '✅ System dependencies installed'
"

echo -e "${YELLOW}📁 Step 3: Setting up application directory...${NC}"
ssh_exec "
    # Create app directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Clone or update repository
    if [ -d '.git' ]; then
        echo 'Updating existing repository...'
        git pull origin main
    else
        echo 'Cloning repository...'
        git clone $GITHUB_REPO .
    fi
    
    echo '✅ Application code ready'
"

echo -e "${YELLOW}🔧 Step 4: Installing application dependencies...${NC}"
ssh_exec "
    cd $APP_DIR
    
    # Install root dependencies
    npm install
    
    # Install frontend dependencies
    cd frontend && npm install && cd ..
    
    # Install backend dependencies  
    cd backend && npm install && cd ..
    
    echo '✅ Dependencies installed'
"

echo -e "${YELLOW}🏗️ Step 5: Building applications...${NC}"
ssh_exec "
    cd $APP_DIR
    
    # Build frontend
    npm run build:frontend
    
    echo '✅ Applications built'
"

echo -e "${YELLOW}🌐 Step 6: Configuring Nginx...${NC}"
ssh_exec "
    # Backup default nginx config
    cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup
    
    # Create Nginx configuration for Zootel
    cat > /etc/nginx/sites-available/zootel << 'EOF'
server {
    listen 80;
    server_name zootel.shop www.zootel.shop;
    
    # Frontend
    location / {
        root /var/www/zootel/frontend/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options \"SAMEORIGIN\" always;
        add_header X-XSS-Protection \"1; mode=block\" always;
        add_header X-Content-Type-Options \"nosniff\" always;
        add_header Referrer-Policy \"no-referrer-when-downgrade\" always;
        add_header Content-Security-Policy \"default-src 'self' http: https: data: blob: 'unsafe-inline'\" always;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Enable the site
    ln -sf /etc/nginx/sites-available/zootel /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx
    
    echo '✅ Nginx configured'
"

echo -e "${YELLOW}🔐 Step 7: Setting up SSL with Let's Encrypt...${NC}"
ssh_exec "
    # Get SSL certificate
    certbot --nginx -d zootel.shop -d www.zootel.shop --non-interactive --agree-tos --email tahyr.orazdurdyyev@icloud.com
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    
    echo '✅ SSL certificate installed'
"

echo -e "${YELLOW}🎯 Step 8: Setting up environment configuration...${NC}"
ssh_exec "
    cd $APP_DIR
    
    # Run the production environment setup script
    ./scripts/setup-production-env.sh
    
    echo '✅ Environment template created'
"

echo -e "${YELLOW}🚀 Step 9: Starting applications with PM2...${NC}"
ssh_exec "
    cd $APP_DIR
    
    # Start backend
    pm2 start backend/src/server.js --name zootel-backend
    
    # Save PM2 configuration
    pm2 save
    
    echo '✅ Applications started'
"

echo -e "${YELLOW}🔍 Step 10: Verification...${NC}"
ssh_exec "
    # Check PM2 status
    pm2 status
    
    # Check nginx status
    systemctl status nginx --no-pager -l
    
    # Check if backend is responding
    sleep 5
    curl -f http://localhost:5000/api/health || echo 'Backend health check failed'
    
    echo '✅ Deployment verification complete'
"

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Configure Firebase credentials:"
echo "   ssh root@31.187.72.39"
echo "   cd /var/www/zootel"
echo "   nano .env"
echo "   # Replace FIREBASE_PRIVATE_KEY with your actual Firebase service account key"
echo ""
echo "2. Restart backend:"
echo "   pm2 restart zootel-backend"
echo ""
echo "3. Test your application:"
echo "   https://zootel.shop"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Update your Firebase credentials in the .env file"
echo "- Check PM2 logs: pm2 logs zootel-backend"
echo "- Monitor system: pm2 monit" 