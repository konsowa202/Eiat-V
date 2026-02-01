#!/bin/bash

# ============================================
# EIAT Project Deployment Script for Hostinger VPS
# ============================================

set -e  # Exit on error

echo "🚀 Starting EIAT deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/var/www/eiat"
REPO_URL="https://github.com/konsowa202/Eiat-V.git"
PM2_APP_NAME="eiat-site"
NODE_PORT=3000

# Step 1: Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Step 2: Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Step 3: Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pnpm...${NC}"
    npm install -g pnpm
fi

# Step 4: Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing PM2...${NC}"
    npm install -g pm2
fi

# Step 5: Install Git if not installed
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    apt install -y git
fi

# Step 6: Clone or update repository
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📥 Updating existing repository...${NC}"
    cd $PROJECT_DIR
    git pull origin master
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    mkdir -p /var/www
    cd /var/www
    git clone $REPO_URL eiat
    cd $PROJECT_DIR
fi

# Step 7: Create .env file
echo -e "${YELLOW}⚙️  Setting up environment variables...${NC}"
cd $PROJECT_DIR/packages/eiat-site

if [ ! -f .env ]; then
    cat > .env << EOF
SANITY_TOKEN=sklM1PFIoMYkoolRlynCkgNgOp1YTF2OGOBRL0P1mKieYiHCfNNTRc7fL13NufBospyOWiCMtjspAHA9P5WE2ca8TMd6egKx4nzW71HrS3Tau73ks81gQJlD3WFb2bqCJ5TsEgXUQAOvOpcnu95HjyeD1qUbR43GMY4m3QaraNIQYpLn3kWT
NODE_ENV=production
PORT=3000
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping...${NC}"
fi

# Step 8: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd $PROJECT_DIR
pnpm install

# Step 9: Build project
echo -e "${YELLOW}🔨 Building project...${NC}"
pnpm build

# Step 10: Stop existing PM2 process if running
echo -e "${YELLOW}🛑 Stopping existing process...${NC}"
pm2 delete $PM2_APP_NAME 2>/dev/null || true

# Step 11: Start application with PM2
echo -e "${YELLOW}🚀 Starting application with PM2...${NC}"
cd $PROJECT_DIR/packages/eiat-site
pm2 start npm --name $PM2_APP_NAME -- start

# Step 12: Save PM2 configuration
pm2 save

# Step 13: Setup PM2 startup script
echo -e "${YELLOW}⚙️  Setting up PM2 startup...${NC}"
pm2 startup | grep -v "PM2" | bash || true

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}📊 Application status:${NC}"
pm2 status

echo -e "${GREEN}🌐 Your application should be running on http://localhost:$NODE_PORT${NC}"
echo -e "${YELLOW}💡 Don't forget to configure Nginx as reverse proxy!${NC}"

