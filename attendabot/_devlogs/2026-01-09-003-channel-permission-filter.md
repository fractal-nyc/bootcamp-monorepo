# 2026-01-09-003: Channel Permission Filter

## Summary

Fixed the admin panel dropdown showing Discord text channels that the bot cannot read. We now filter the `/api/channels` response so only accessible channels appear, preventing confusing empty results and API errors.

## Bug Fix
- Updated `src/api/routes/channels.ts` to require both `ViewChannel` and `ReadMessageHistory` permissions before returning a channel.
- The API still sorts channels by guild/name after filtering, so the frontend change is transparent.

## Testing

```bash
npm run build
```

The TypeScript build succeeds, confirming the updated route compiles.
