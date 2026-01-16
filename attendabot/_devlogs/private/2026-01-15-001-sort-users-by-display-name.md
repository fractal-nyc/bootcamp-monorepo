# 2026-01-15-001: Sort Users by Display Name

## Summary

Changed the user dropdown in the EOD Messages panel to sort by display name instead of username.

## Problem

After adding display name sync, the user dropdown was still sorted by username. This made it harder to find users since the visible text showed "Display Name (username)" but sorting was by the username in parentheses.

## What We Did

### Database Query (`backend/src/services/db.ts`)

Changed the `getAllUsers()` function from:

```typescript
/** Retrieves all users from the database, ordered by username. */
export function getAllUsers(): UserRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT author_id, display_name, username
    FROM users
    ORDER BY username ASC
  `);
  return stmt.all() as UserRecord[];
}
```

To:

```typescript
/** Retrieves all users from the database, ordered by display name (or username if no display name). */
export function getAllUsers(): UserRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT author_id, display_name, username
    FROM users
    ORDER BY COALESCE(display_name, username) COLLATE NOCASE ASC
  `);
  return stmt.all() as UserRecord[];
}
```

## SQL Explanation

- `COALESCE(display_name, username)` - Returns the first non-null value; falls back to username if display_name is null
- `COLLATE NOCASE` - Case-insensitive comparison for sorting
- `ASC` - Ascending order (A to Z)

## Results

- User dropdown now sorted alphabetically by display name
- Users without display names sort by their username
- Case-insensitive sorting works correctly
