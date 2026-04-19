#!/bin/bash

# ============================================
# Nginx Configuration Script for EIAT
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-your-domain.com}"  # Use first argument or default
NGINX_CONFIG="/etc/nginx/sites-available/eiat"
NGINX_ENABLED="/etc/nginx/sites-enabled/eiat"

echo -e "${YELLOW}🔧 Setting up Nginx for domain: $DOMAIN${NC}"

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Nginx...${NC}"
    apt update
    apt install -y nginx
fi

# Create Nginx configuration
echo -e "${YELLOW}📝 Creating Nginx configuration...${NC}"
cat > $NGINX_CONFIG << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Increase body size limit for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
echo -e "${YELLOW}🔗 Enabling Nginx site...${NC}"
ln -sf $NGINX_CONFIG $NGINX_ENABLED

# Remove default site if exists
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Test Nginx configuration
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Restart Nginx
    echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
    systemctl restart nginx
    systemctl enable nginx
    
    echo -e "${GREEN}✅ Nginx setup completed!${NC}"
    echo -e "${GREEN}🌐 Your site should be accessible at http://$DOMAIN${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

