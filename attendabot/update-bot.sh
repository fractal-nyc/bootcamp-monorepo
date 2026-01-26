#!/bin/bash
set -euo pipefail

# Deploy attendabot to EC2 via AWS SSM (no SSH keys needed).
# This script runs on YOUR MACHINE (or in GitHub Actions). It sends a remote
# command to the EC2 instance to execute deploy-remote.sh, then waits and
# prints the output. The actual build/restart work happens on the instance.
# Requires: AWS CLI configured with deployer credentials or appropriate IAM role.
# See _devlogs/private/aws-setup.md for onboarding instructions.

INSTANCE_ID="${ATTENDABOT_INSTANCE_ID:-i-XXXXXXXXX}"  # default to your instance

echo "Deploying attendabot via SSM to $INSTANCE_ID..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "sudo -iu ec2-user bash -c \"cd ~/bootcamp-monorepo && git fetch origin && git reset --hard origin/main && cd attendabot && bash deploy-remote.sh\""
  ]' \
  --timeout-seconds 300 \
  --query "Command.CommandId" --output text)

echo "Command sent: $COMMAND_ID"
echo "Waiting for completion..."

aws ssm wait command-executed \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" 2>/dev/null || true

OUTPUT=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "[Status, StandardOutputContent, StandardErrorContent]" --output text)

echo "$OUTPUT"
