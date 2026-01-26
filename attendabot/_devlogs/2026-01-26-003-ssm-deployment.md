# 2026-01-26-003: SSM Deployment Pipeline

## Summary

Replaced SSH-key-based deployment with AWS SSM Session Manager, moved secrets to AWS Secrets Manager, and added GitHub Actions CI/CD. Any developer with IAM credentials can now deploy without needing SSH keys or a local `.env` file.

## What We Did

### 1. Split deploy logic into two scripts
- `update-bot.sh` runs on your machine (or GitHub Actions). It sends an SSM command to the EC2 instance and waits for output.
- `deploy-remote.sh` runs on the EC2 instance. It pulls secrets from Secrets Manager, writes `.env`, builds frontend/backend, and restarts PM2.
- Previously, the remote logic was inlined as a heredoc inside `update-bot.sh`'s SSH command.

### 2. AWS Secrets Manager integration
- The `.env` file on EC2 is now generated from the `attendabot/env` secret on every deploy.
- Manual edits to `.env` on the instance are overwritten on next deploy.
- Secrets are managed centrally -- no need to SCP a local `.env` file.

### 3. GitHub Actions CI/CD
- Pushes to `main` that touch `attendabot/**` trigger automatic deployment.
- Uses OIDC authentication (no long-lived AWS credentials stored in GitHub).
- Instance ID and account ID are stored as GitHub repository variables, not hardcoded.

### 4. Multi-developer access
- New devs get an IAM user in the `attendabot-deployers` group, configure AWS CLI, and can run `./update-bot.sh`.
- No SSH keys, PEM files, or shared `.env` files needed.

### 5. Bug fix: SSM runs as root
- SSM commands execute as root by default, which uses a separate PM2 daemon from ec2-user.
- Fixed by wrapping commands in `sudo -iu ec2-user bash -c "..."` so PM2 restarts hit the correct daemon.

## Files Created
- `attendabot/deploy-remote.sh` -- remote deploy script (runs on EC2)
- `.github/workflows/deploy-attendabot.yml` -- CI/CD pipeline

## Files Modified
- `attendabot/update-bot.sh` -- rewritten from SSH to SSM
- `attendabot/CLAUDE.md` -- added deployment docs, removed `EC2_HOST` from env vars
- `attendabot/.env.example` -- removed `EC2_HOST`, added `ATTENDABOT_INSTANCE_ID`

---
*See `_devlogs/private/` for version with deployment details (gitignored)*
