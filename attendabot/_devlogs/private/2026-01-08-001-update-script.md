# 2026-01-08-001: Update Script

## Summary

Created an automated deployment update script for pulling latest code to EC2.

## What We Did

### 1. AWS CLI Cleanup
- Removed old default AWS profile (account `365371133459` from previous job)
- Made `dsshimel` profile the new default (account `317772403147`)
- No longer need `--profile dsshimel` for AWS commands
- Updated `~/.aws/credentials` and `~/.aws/config`

### 2. Created `update-bot.sh`
A script to pull latest code and restart the bot on EC2:
```bash
bash attendabot/update-bot.sh
```

The script:
- Reads `EC2_HOST` from `.env` (keeps IP out of git)
- SSHs into the instance
- Runs `git pull`
- Runs `npm install` and `npm run build`
- Restarts the bot with `pm2 restart attendabot`

### 3. Updated `.env` Files
- Added `EC2_HOST=54.87.34.182` to `.env` (gitignored)
- Added `EC2_HOST` placeholder to `.env.example`

## Current Deployment Info

| Resource | Value |
|----------|-------|
| **Instance IP** | `54.87.34.182` |
| **Instance ID** | `i-099e4d352a3829c36` |
| **SSH Key** | `~/.ssh/attendabot.pem` |
| **AWS Region** | `us-east-1` |
| **Node Version** | v18.20.8 (some packages warn about needing 20+) |

## Useful Commands

```bash
# Update bot with latest code
bash attendabot/update-bot.sh

# SSH into instance manually
ssh -i ~/.ssh/attendabot.pem ec2-user@54.87.34.182

# View logs
ssh -i ~/.ssh/attendabot.pem ec2-user@54.87.34.182 "pm2 logs attendabot --lines 50"

# Check bot status
ssh -i ~/.ssh/attendabot.pem ec2-user@54.87.34.182 "pm2 status"
```

## Files Changed
- `attendabot/update-bot.sh` (new)
- `attendabot/.env.example` (updated)
- `attendabot/.env` (updated, gitignored)
