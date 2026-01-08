# 2026-01-08-001: Update Script

## Summary

Created an automated deployment update script for pulling latest code to EC2.

## What We Did

### 1. Created `update-bot.sh`
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

### 2. Updated `.env` Files
- Added `EC2_HOST` to `.env` (gitignored)
- Added `EC2_HOST` placeholder to `.env.example`

## Useful Commands

```bash
# Update bot with latest code
bash attendabot/update-bot.sh

# SSH into instance manually
ssh -i ~/.ssh/attendabot.pem ec2-user@$EC2_HOST

# View logs
ssh -i ~/.ssh/attendabot.pem ec2-user@$EC2_HOST "pm2 logs attendabot --lines 50"

# Check bot status
ssh -i ~/.ssh/attendabot.pem ec2-user@$EC2_HOST "pm2 status"
```

## Files Changed
- `attendabot/update-bot.sh` (new)
- `attendabot/.env.example` (updated)
- `attendabot/.env` (updated, gitignored)

---
*See `devlogs/private/` for version with deployment details (gitignored)*
