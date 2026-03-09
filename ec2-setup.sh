#!/bin/bash
# CodeEditor EC2 Deployment Script
# This script is designed to be pasted into the "User Data" section when launching an Ubuntu EC2 instance.

# 1. Update system and install dependencies
sudo apt-get update -y
sudo apt-get install -y curl git nginx

# 2. Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install Docker (for Redis)
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository -y "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update -y
sudo apt-get install -y docker-ce
sudo systemctl enable docker
sudo systemctl start docker

# 4. Clone the repository
git clone https://github.com/Tanishq-Tajne/CodeEditor-main.git /home/ubuntu/CodeEditor
cd /home/ubuntu/CodeEditor

# 5. Create .env file for the express server
# NOTE: Replace these values with your actual AWS keys before running!
cat <<EOT > apps/express-server/.env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE
AWS_S3_BUCKET_NAME=code-editor-snippets-tanishq

EOT

# 6. Install project dependencies and build
npm install
npm run build

# 7. Start Redis
sudo docker compose up -d

# 8. Install PM2 to run the Node.js services in the background
sudo npm install -g pm2

# 9. Start the 3 backend services using PM2
pm2 start apps/express-server/dist/index.js --name "express-server"
pm2 start apps/websocket-server/dist/index.js --name "websocket-server"
pm2 start apps/worker/dist/index.js --name "worker"

# Save PM2 process list to start on boot
pm2 save
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

echo "Deployment complete! Your backend services are running."
EOT
