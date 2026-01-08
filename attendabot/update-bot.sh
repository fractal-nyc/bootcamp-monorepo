#!/bin/bash
# Update attendabot on EC2 instance

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load EC2_HOST from .env
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep EC2_HOST | xargs)
fi

if [ -z "$EC2_HOST" ]; then
    echo "Error: EC2_HOST not set. Add it to .env file."
    exit 1
fi

INSTANCE_IP="$EC2_HOST"
SSH_KEY="$HOME/.ssh/attendabot.pem"

echo "Updating attendabot on $INSTANCE_IP..."

ssh -i "$SSH_KEY" ec2-user@$INSTANCE_IP << 'EOF'
    cd ~/bootcamp-monorepo
    echo "Pulling latest code..."
    git pull

    cd attendabot
    echo "Installing backend dependencies..."
    npm install

    echo "Building backend..."
    npm run build

    echo "Installing frontend dependencies..."
    cd src/frontend && npm install

    echo "Building frontend..."
    npm run build
    cd ../..

    echo "Restarting bot..."
    pm2 restart attendabot

    echo "Done! Current status:"
    pm2 status attendabot
EOF
