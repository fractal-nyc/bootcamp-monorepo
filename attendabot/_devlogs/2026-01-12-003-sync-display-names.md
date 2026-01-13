# 2026-01-12-003: Sync Display Names Feature

## Summary

Added ability to sync user display names from Discord guild members, so the user dropdown shows both display name and username (e.g., "John Doe (johndoe123)").

## Problem

The user dropdown in the User EOD Messages panel was only showing usernames because the `display_name` field was null for most users. This happened because when messages were backfilled from Discord history, the `message.member` property (which contains display names) is often null.

## What We Did

### 1. Discord Client Changes

- Added `GuildMembers` intent to allow fetching guild member data
- Created `syncUserDisplayNames()` function that fetches all guild members and updates the database

### 2. Backend API

- Added `POST /api/users/sync-display-names` endpoint to trigger sync manually

### 3. Frontend

- Added "Sync Names" button to User EOD Messages panel
- Button triggers the sync and refreshes the user list

## Files Modified

- `backend/src/services/discord.ts` - Added GuildMembers intent and sync function
- `backend/src/api/routes/users.ts` - New sync endpoint
- `frontend/src/api/client.ts` - API client function
- `frontend/src/components/UserMessages.tsx` - Sync button

## Requirements

The Discord bot must have **Server Members Intent** enabled in the Discord Developer Portal under Bot > Privileged Gateway Intents.

## Results

- Clicking "Sync Names" populates display names for all users in the database
- Dropdown now shows "Display Name (username)" format
- Deployed and verified on production
