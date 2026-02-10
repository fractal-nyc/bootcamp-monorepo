# 2026-02-06-001: Student Profile Images

## Summary

Added profile image support to student profiles. Images are base64-encoded and stored directly in SQLite. The student table shows a small circular thumbnail next to each name, and the sidebar detail view displays a larger image with upload/remove controls.

## What We Did

### Backend

1. **Database migration** — added `profile_image TEXT` column to the students table via auto-migration in `initializeTables()` (same pattern as `observer_id`). The column is intentionally excluded from standard `getStudent()`/`getStudentsByCohort()` queries to keep list responses lightweight.
2. **DB functions** — added `getStudentImage()`, `updateStudentImage()`, and `deleteStudentImage()` in `db.ts` for dedicated image CRUD.
3. **API endpoints** — added three new routes on the students router:
   - `GET /api/students/:id/image` — fetch image data
   - `PUT /api/students/:id/image` — upload/update (validates `data:image/...` format)
   - `DELETE /api/students/:id/image` — remove image
4. **Body size limit** — increased `express.json()` limit to `10mb` to accommodate base64 payloads.

### Frontend

1. **API client** — added `getStudentImage()`, `uploadStudentImage()` (reads File as data URL via FileReader), and `deleteStudentImage()` functions in `client.ts`.
2. **StudentTable** — loads profile images for all visible students. Displays a 32px circular thumbnail next to each name with a letter-initial placeholder when no image exists.
3. **StudentDetail** — shows a 160px circular profile image at the top of the sidebar. "Upload Image" / "Change Image" button opens native file picker; "Remove" button clears the image.
4. **CSS** — added styles for avatars, placeholders, image display, and upload/remove controls following the Fractal design system.

### Tests

Added 21 new tests (185 → 206 total):
- **`db.test.ts`** — 6 tests for profile image storage, update, removal, non-existent student handling, and query exclusion.
- **`students.test.ts`** — 15 tests covering image upload validation (required field, string type, data URL format, image MIME types) and database operations (get, set, replace, delete, persistence through student deletion).
- **`testUtils.ts`** — added `profile_image TEXT` column to the in-memory test database schema.

## Files Modified
- `backend/src/services/db.ts` - Column migration, image CRUD functions
- `backend/src/api/routes/students.ts` - Image GET/PUT/DELETE endpoints
- `backend/src/api/index.ts` - 10mb JSON body limit
- `backend/src/test/utils/testUtils.ts` - Test schema update
- `backend/src/test/services/db.test.ts` - Profile image DB tests
- `backend/src/test/api/students.test.ts` - Image API validation/DB tests
- `frontend/src/api/client.ts` - Image client functions
- `frontend/src/components/StudentTable.tsx` - Thumbnail avatars
- `frontend/src/components/StudentDetail.tsx` - Sidebar image + upload controls
- `frontend/src/App.css` - Avatar and image upload styles
