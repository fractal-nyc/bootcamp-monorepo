# 2026-01-09-003: Channel Permission Filter

## Summary

During session 003, the admin panel dropdown listed every guild text channel, even ones the bot cannot access. Selecting those channels caused `/api/messages/:id` to fail with Discord permission errors and left the UI blank. We now only return channels that the bot has permission to view and read history for.

## Details

- `src/api/routes/channels.ts`
  - Imported `PermissionFlagsBits` and pulled the bot user from the Discord client.
  - When iterating cached guild channels, we compute permissions via `channel.permissionsFor(botUser)` and skip anything missing `ViewChannel` or `ReadMessageHistory`.
  - This keeps the payload small and prevents users from selecting inaccessible channels.

- Testing

  ```bash
  cd ~/bootcamp-monorepo/attendabot
  npm run build
  ```

  (Bun CLI still isn’t runnable in this sandbox, so `npm run build` exercises `tsc`.)

## Follow Up

After deploying, the admin panel combo box should only include channels that `attendabot` can actually read on `54.87.34.182`. If new guilds are added, make sure the bot has both permissions so the channels appear.
