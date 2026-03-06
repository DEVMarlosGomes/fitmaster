# FitMaster - PRD

## Problem Statement
FitMaster - Personal Trainer management platform. Bug fixes and feature improvements.

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS
- **Database**: MongoDB (motor async driver)
- **Auth**: JWT-based authentication

## What's Been Implemented

### Session 1 - Bug Fixes (2026-03-06)
1. **DELETE workout endpoint** - Added missing route decorator
2. **Submit report button** - Fixed validation for pendingFeedbackRequest
3. **FAQ Chatbot refinement** - Navigation buttons, back-to-categories

### Session 2 - Exercise Library (2026-03-06)
1. **41 system exercises seeded** into exercise_library collection
2. **PUT /exercise-library/{id}** - Edit exercise details
3. **POST /exercise-library/{id}/upload-video** - Upload MP4/WebM/MOV videos
4. **DELETE /exercise-library/{id}/video** - Remove uploaded video
5. **ExerciseLibraryPage** - Complete rewrite with cards, edit, upload, preview

### Session 3 - Video Playback Fix (2026-03-06)
**Root cause**: `/uploads/` path was being served by React frontend (returning HTML) instead of backend. Videos loaded but browser received HTML content instead of video data.

**Fix applied**:
1. Created `GET /api/uploads/{file_name}` endpoint with `FileResponse` to serve files via API route
2. Updated ALL frontend references to use `/api/uploads/` prefix:
   - `ExerciseLibraryPage.jsx` - video preview dialog
   - `SetTracker.jsx` - exercise video in workout session
   - `EvolutionPhotosPage.jsx` - photo URLs
   - `CheckinsPage.jsx` - feedback photos
   - `WorkoutsPage.jsx` - aerobic PDF URLs
   - `StudentDashboard.jsx` - aerobic PDF URLs

**Verified**: Files served with correct Content-Type (`video/mp4`, etc.) and 200 status. YouTube embeds also working correctly.

## Credentials
- Admin: Personal@admin.com / admin123
- Personal: personal@teste.com / teste123

## Next Tasks
- P1: Student-side exercise video viewing
- P2: Batch video upload
- P2: FAQ "Fale com seu personal" link
