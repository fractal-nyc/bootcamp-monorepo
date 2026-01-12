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
    if [ -f ~/.bash_profile ]; then
        source ~/.bash_profile
    fi

    cd ~/bootcamp-monorepo
    echo "Pulling latest code..."
    git stash
    git pull

    cd attendabot

    # Determine API port for status message
    API_PORT_MSG="${API_PORT:-}"
    if [ -z "$API_PORT_MSG" ] && [ -f .env ]; then
        API_PORT_MSG=$(grep -E '^API_PORT=' .env | tail -n 1 | cut -d '=' -f2-)
    fi
    if [ -z "$API_PORT_MSG" ]; then
        API_PORT_MSG="3001"
    fi

    # Ensure production mode so Express serves the built frontend
    if [ -z "$NODE_ENV" ]; then
        export NODE_ENV=production
    fi
    echo "Using NODE_ENV=$NODE_ENV (required for frontend static serving)"

    echo "Installing backend dependencies..."
    cd backend
    pwd
    bun install

    echo "Building backend..."
    bun run build

    cd ..

    echo "Installing frontend dependencies..."
    cd frontend
    pwd
    bun install

    echo "Building frontend..."
    bun run build

    cd ..

    echo "Restarting bot..."
    pm2 restart attendabot --update-env --cwd ~/bootcamp-monorepo/attendabot/backend

    echo "Done! Current status:"
    pm2 status attendabot
    echo "Admin panel should now be reachable via the API server (port $API_PORT_MSG)."
EOF
