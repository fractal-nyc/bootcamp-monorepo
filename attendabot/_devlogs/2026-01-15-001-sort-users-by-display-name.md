# 2026-01-15-001: Sort Users by Display Name

## Summary

Changed the user dropdown in the EOD Messages panel to sort by display name instead of username.

## What We Did

- Updated `getAllUsers()` query to sort by `COALESCE(display_name, username)` with case-insensitive collation
- Users without a display name fall back to sorting by username

## Files Modified

- `backend/src/services/db.ts` - Updated ORDER BY clause in getAllUsers()

## Results

- User dropdown now sorted alphabetically by display name
- Case-insensitive sorting (e.g., "alice" and "Alice" sort together)
