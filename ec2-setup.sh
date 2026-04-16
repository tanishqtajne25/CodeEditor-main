#!/bin/bash
# CodeEditor EC2 Deployment Script (Launch Template User Data)
# Ubuntu 24.04 LTS — Docker Redis (local, free-tier safe)
# This script is pasted verbatim into the Launch Template "User Data" field.

set -e  # Exit on any error

# ── 0. Swap space (t3.micro = 1 GB RAM; npm build needs breathing room) ──────
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab   # persist across reboots

# ── 1. System packages ─────────────────────────────────────────────────────────
apt-get update -y
apt-get install -y curl git apt-transport-https ca-certificates \
                   software-properties-common

# ── 2. Node.js v20 ────────────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# ── 3. Docker (used for Redis + code-execution sandboxes) ─────────────────────
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# ── 4. Start Redis (local, Docker-based — free-tier safe) ─────────────────────
docker run -d \
  --name redis-server \
  --restart unless-stopped \
  -p 6379:6379 \
  redis:7

# ── 5. Clone the repository ───────────────────────────────────────────────────
git clone https://github.com/tanishqtajne25/CodeEditor-main.git /home/ubuntu/CodeEditor
cd /home/ubuntu/CodeEditor

# ── 6. Environment variables ──────────────────────────────────────────────────
# Redis points to the local Docker container on this same instance.
# AWS credentials are picked up from the attached IAM Instance Profile (CodeEditor-EC2-Role).
# VITE_BACKEND_HOST must match your ALB DNS name — set it BEFORE running npm run build.

cat > apps/express-server/.env << 'ENVEOF'
REDIS_URL=redis://localhost:6379
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=code-editor-snippets-tanishq
ENVEOF

cat > apps/websocket-server/.env << 'ENVEOF'
REDIS_URL=redis://localhost:6379
ENVEOF

cat > apps/worker/.env << 'ENVEOF'
REDIS_URL=redis://localhost:6379
ENVEOF

# Frontend: embed the ALB DNS name at build time
# Replace the value below with your actual ALB DNS before baking the AMI!
cat > apps/frontend/.env << 'ENVEOF'
VITE_BACKEND_HOST=CodeEditor-ALB-1911604777.ap-south-1.elb.amazonaws.com
ENVEOF

# ── 7. Install dependencies & build all packages ──────────────────────────────
npm install
npm run build

# ── 8. Fix ownership ──────────────────────────────────────────────────────────
chown -R ubuntu:ubuntu /home/ubuntu/CodeEditor

# ── 9. Install PM2 and start all 3 backend services ──────────────────────────
npm install -g pm2

sudo -u ubuntu bash -c '
  cd /home/ubuntu/CodeEditor
  pm2 start apps/express-server/dist/index.js   --name "express-server"
  pm2 start apps/websocket-server/dist/index.js --name "websocket-server"
  pm2 start apps/worker/dist/index.js           --name "worker"
  pm2 save
'

# Make PM2 auto-start on system reboot
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "=== CodeEditor deployment complete! ==="
echo "  Express  -> http://localhost:3000"
echo "  WS       -> ws://localhost:5000"
echo "  Redis    -> localhost:6379 (Docker)"
