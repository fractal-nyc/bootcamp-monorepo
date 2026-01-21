# 2026-01-07-001: Attendabot AWS Deployment

## Summary

Initial deployment of attendabot to AWS EC2.

| Resource | Value |
|----------|-------|
| **Instance IP** | `54.87.34.182` |
| **Instance ID** | `i-099e4d352a3829c36` |
| **SSH Key** | `~/.ssh/attendabot.pem` |
| **Bot status** | Online as `Coach Dsemo#4292` |

## Scheduled Jobs (America/New_York)

- `9:00 AM` - Attendance reminder
- `9:15 AM` - Attendance verification
- `5:00 PM` - EOD reminder
- `11:59 PM` - EOD verification

## Useful Commands

```bash
# SSH into the instance
ssh -i ~/.ssh/attendabot.pem ec2-user@54.87.34.182

# Or using SSH config alias
ssh attendabot
```

### PM2 Log Commands

```bash
# View logs
pm2 logs attendabot

# Show last 100 lines
pm2 logs attendabot --lines 100

# Show only error logs
pm2 logs attendabot --err

# Clear all logs
pm2 flush
```

Log files are stored at `~/.pm2/logs/`:
- `attendabot-out.log` - stdout
- `attendabot-error.log` - stderr

### Bot Management

```bash
# Restart bot
pm2 restart attendabot

# Update code (manual method)
cd ~/bootcamp-monorepo && git pull && cd attendabot && npm install && npm run build && pm2 restart attendabot

# Update code (using script)
cd ~/attendabot && ./update-bot.sh
```
