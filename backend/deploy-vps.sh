#!/bin/bash

###############################################################################
# PersonalityMatch VPS Deployment Script
#
# Deploys backend to a single VPS (Hetzner, DigitalOcean, Vultr, etc.)
# Target cost: $5-8/month
#
# Prerequisites:
# - VPS with Ubuntu 22.04 LTS
# - SSH access to VPS
# - Domain name pointed to VPS IP
#
# Usage:
#   ./deploy-vps.sh <vps-ip> <domain>
#   Example: ./deploy-vps.sh 159.69.123.456 api.personalitymatch.com
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ "$#" -ne 2 ]; then
    echo -e "${RED}Usage: $0 <vps-ip> <domain>${NC}"
    echo "Example: $0 159.69.123.456 api.personalitymatch.com"
    exit 1
fi

VPS_IP=$1
DOMAIN=$2
SSH_USER=${SSH_USER:-root}

echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  PersonalityMatch VPS Deployment                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo "VPS IP: $VPS_IP"
echo "Domain: $DOMAIN"
echo "SSH User: $SSH_USER"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
ssh -o ConnectTimeout=5 $SSH_USER@$VPS_IP "echo 'SSH connection successful'" || {
    echo -e "${RED}Failed to connect to VPS${NC}"
    exit 1
}

echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

# Deploy to VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"

ssh $SSH_USER@$VPS_IP 'bash -s' <<'ENDSSH'

set -e

echo "====================================="
echo "Step 1: Update system packages"
echo "====================================="
apt-get update
apt-get upgrade -y

echo ""
echo "====================================="
echo "Step 2: Install Docker & Docker Compose"
echo "====================================="

# Install Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo "✓ Docker installed"
else
    echo "✓ Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo "✓ Docker Compose installed"
else
    echo "✓ Docker Compose already installed"
fi

echo ""
echo "====================================="
echo "Step 3: Install NGINX"
echo "====================================="

if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
    systemctl enable nginx
    echo "✓ NGINX installed"
else
    echo "✓ NGINX already installed"
fi

echo ""
echo "====================================="
echo "Step 4: Install Certbot (Let's Encrypt)"
echo "====================================="

if ! command -v certbot &> /dev/null; then
    apt-get install -y certbot python3-certbot-nginx
    echo "✓ Certbot installed"
else
    echo "✓ Certbot already installed"
fi

echo ""
echo "====================================="
echo "Step 5: Configure firewall (UFW)"
echo "====================================="

ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

echo "✓ Firewall configured"

echo ""
echo "====================================="
echo "Step 6: Install security tools"
echo "====================================="

# Install fail2ban (brute force protection)
if ! command -v fail2ban-client &> /dev/null; then
    apt-get install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    echo "✓ Fail2ban installed"
else
    echo "✓ Fail2ban already installed"
fi

# Install unattended-upgrades (automatic security updates)
apt-get install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades

echo "✓ Security tools configured"

echo ""
echo "====================================="
echo "Step 7: Create application directory"
echo "====================================="

mkdir -p /opt/personalitymatch
mkdir -p /opt/personalitymatch/data
mkdir -p /opt/personalitymatch/logs
mkdir -p /opt/personalitymatch/backups

echo "✓ Application directories created"

echo ""
echo "====================================="
echo "VPS Initial Setup Complete!"
echo "====================================="

ENDSSH

echo -e "${GREEN}✓ VPS initial setup complete${NC}"
echo ""

# Copy application files
echo -e "${YELLOW}Copying application files...${NC}"

# Create deployment package
tar -czf deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='data' \
    --exclude='uploads' \
    -C .. backend

# Upload to VPS
scp deployment.tar.gz $SSH_USER@$VPS_IP:/opt/personalitymatch/
rm deployment.tar.gz

echo -e "${GREEN}✓ Application files copied${NC}"
echo ""

# Extract and setup application
echo -e "${YELLOW}Setting up application...${NC}"

ssh $SSH_USER@$VPS_IP "bash -s" -- "$DOMAIN" <<'ENDSSH'

set -e

DOMAIN=$1

cd /opt/personalitymatch

# Extract files
tar -xzf deployment.tar.gz
rm deployment.tar.gz

cd backend

echo ""
echo "====================================="
echo "Installing Node.js dependencies"
echo "====================================="

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install dependencies
npm ci --only=production

echo ""
echo "====================================="
echo "Configuring NGINX"
echo "====================================="

# Create NGINX configuration
cat > /etc/nginx/sites-available/personalitymatch <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect to HTTPS (will be enabled after SSL setup)
    # return 301 https://\$server_name\$request_uri;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Socket.io support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # File upload size
    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/personalitymatch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test NGINX configuration
nginx -t

# Restart NGINX
systemctl restart nginx

echo "✓ NGINX configured"

echo ""
echo "====================================="
echo "Creating systemd service"
echo "====================================="

# Create systemd service for Node.js app
cat > /etc/systemd/system/personalitymatch.service <<EOF
[Unit]
Description=PersonalityMatch Backend API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/personalitymatch/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=append:/opt/personalitymatch/logs/app.log
StandardError=append:/opt/personalitymatch/logs/error.log

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload
systemctl enable personalitymatch

echo "✓ Systemd service created"

echo ""
echo "====================================="
echo "Setup complete!"
echo "====================================="
echo ""
echo "Next steps:"
echo "1. Copy .env file to /opt/personalitymatch/backend/.env"
echo "2. Start the service: systemctl start personalitymatch"
echo "3. Setup SSL: certbot --nginx -d $DOMAIN"
echo "4. Enable HTTPS redirect in NGINX config"
echo ""

ENDSSH

echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Manual steps required:${NC}"
echo ""
echo "1. SSH to VPS:"
echo "   ssh $SSH_USER@$VPS_IP"
echo ""
echo "2. Create environment file:"
echo "   nano /opt/personalitymatch/backend/.env"
echo "   # Copy from .env.example and fill in values"
echo ""
echo "3. Start the application:"
echo "   systemctl start personalitymatch"
echo "   systemctl status personalitymatch"
echo ""
echo "4. Setup SSL certificate:"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "5. View logs:"
echo "   tail -f /opt/personalitymatch/logs/app.log"
echo ""
echo "6. Test the API:"
echo "   curl https://$DOMAIN/health"
echo ""
echo -e "${GREEN}Deployment script finished!${NC}"
