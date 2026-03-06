# FitMaster - PRD

## Problem Statement
FitMaster - Personal Trainer management platform. Bug fixes and feature improvements:
1. Error removing workouts (erro ao remover treino) - FIXED
2. Submit report button doesn't work (botão de enviar relato não funciona) - FIXED
3. Refine FAQ chatbot (add return to categories button, ability to go back) - FIXED
4. Exercise Library: all exercises should appear individually, be editable, with video upload capability - IMPLEMENTED

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS
- **Database**: MongoDB (motor async driver)
- **Auth**: JWT-based authentication

## User Personas
- **Administrador**: Approves personal trainers
- **Personal Trainer**: Manages students, workouts, assessments, exercises, financial, feedback
- **Student (Aluno)**: Views workouts, logs progress, submits check-ins/reports, FAQ chatbot

## Core Requirements
- Workout management (upload, assign, delete)
- Student check-in and feedback/report system
- FAQ chatbot for student support
- Exercise Library with video management
- Financial management
- Progress tracking and gamification

## What's Been Implemented

### Session 1 (2026-03-06) - Bug Fixes
1. **DELETE workout endpoint** - Added missing `@api_router.delete("/workouts/{workout_id}")` decorator in `server.py`
2. **Submit report button** - Fixed validation in `CheckinsPage.jsx` to allow submission when pendingFeedbackRequest exists
3. **FAQ Chatbot refinement** - Rewrote `FAQChatPopup.jsx` with navigation buttons, inline action buttons, back-to-categories

### Session 2 (2026-03-06) - Exercise Library Enhancement
1. **Backend seed function** - `seed_system_exercises()` inserts 41 exercises from EXERCISE_IMAGES/EXERCISE_VIDEOS into exercise_library collection on startup
2. **PUT /exercise-library/{id}** - Edit exercise details (name, category, description, instructions, video_url, image_url)
3. **POST /exercise-library/{id}/upload-video** - Upload MP4/WebM/MOV videos directly to exercises
4. **DELETE /exercise-library/{id}/video** - Remove uploaded video from exercise
5. **ExerciseLibraryUpdate model** - Added with mp4_video_url field
6. **Frontend ExerciseLibraryPage** - Complete rewrite with:
   - Individual exercise cards with image, video badge (YT/MP4), system badge
   - Edit dialog with all fields + video upload
   - Quick upload video button on each card
   - Video preview dialog (MP4 player + YouTube iframe)
   - Category filter badges + search input

## Test Results
- Backend: 100% (8/8 API tests passed)
- Frontend: Exercise Library page accessible at /biblioteca, 41 exercises displayed

## Prioritized Backlog
- P0: All critical bugs fixed ✓
- P1: Exercise Library with video management ✓
- P2: FAQ chatbot "Fale com seu personal" link to chat page
- P2: Workout deletion confirmation dialog improvement

## Next Tasks
- User testing of exercise video upload/preview flow
- Add batch video upload capability
- Student-side exercise video viewing experience
