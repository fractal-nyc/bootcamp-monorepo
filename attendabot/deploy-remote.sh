#!/bin/bash
set -euo pipefail

# deploy-remote.sh -- Runs ON the EC2 instance during deployment.
# Triggered remotely by update-bot.sh (or GitHub Actions) via SSM send-command.
# Does the actual work: pulls secrets from Secrets Manager, writes .env,
# installs deps, builds frontend/backend, and restarts PM2.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Pulling secrets from AWS Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id attendabot/env \
  --query SecretString --output text)

# Convert JSON to .env format
echo "$SECRET_JSON" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for k, v in d.items():
    print(f'{k}={v}')
" > "$SCRIPT_DIR/.env"

cd "$SCRIPT_DIR"

export NODE_ENV=production

echo "Installing backend dependencies..."
cd backend && bun install && bun run build && cd ..

echo "Installing frontend dependencies..."
cd frontend && bun install && bun run build && cd ..

echo "Restarting bot..."
pm2 restart attendabot --update-env --cwd "$SCRIPT_DIR/backend"

echo "Done!"
pm2 status attendabot
