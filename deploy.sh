#!/bin/bash

# Deploy script for Eiat website on VPS

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install required packages
echo "📥 Installing dependencies..."
apt install -y curl git nginx certbot python3-certbot-nginx

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt install -y docker-compose
fi

# Clone or update repository
if [ -d "/var/www/eiat" ]; then
    echo "🔄 Updating repository..."
    cd /var/www/eiat
    git pull origin master
else
    echo "📥 Cloning repository..."
    mkdir -p /var/www
    cd /var/www
    git clone https://github.com/konsowa202/Eiat-V.git eiat
    cd eiat
fi

# Create .env file if it doesn't exist (landing-page only — Studio is deployed to Vercel separately)
if [ ! -f "packages/eiat-site/.env" ]; then
    echo "📝 Creating .env file..."
    cat > packages/eiat-site/.env << EOF
NEXT_PUBLIC_SANITY_PROJECT_ID=f46widyg
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_TOKEN=sklM1PFIoMYkoolRlynCkgNgOp1YTF2OGOBRL0P1mKieYiHCfNNTRc7fL13NufBospyOWiCMtjspAHA9P5WE2ca8TMd6egKx4nzW71HrS3Tau73ks81gQJlD3WFb2bqCJ5TsEgXUQAOvOpcnu95HjyeD1qUbR43GMY4m3QaraNIQYpLn3kWT
EMAIL_USER=Eiatclinicad@gmail.com
EMAIL_PASS=xhja bebi hicg khkc
NODE_ENV=production
EOF
fi

# Build and start with Docker Compose
echo "🏗️ Building and starting containers..."
cd /var/www/eiat
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/eiatclinics.com << 'EOF'
server {
    listen 80;
    server_name eiatclinics.com www.eiatclinics.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/eiatclinics.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificate..."
certbot --nginx -d eiatclinics.com -d www.eiatclinics.com --non-interactive --agree-tos --email eiatclinicad@gmail.com

echo "✅ Deployment completed!"
echo "🌐 Your site should be available at: https://eiatclinics.com"





