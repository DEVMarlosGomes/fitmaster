# FitMaster - PRD

## Problem Statement
FitMaster - Personal Trainer management platform. Three bug fixes requested:
1. Error removing workouts (erro ao remover treino)
2. Submit report button doesn't work (botão de enviar relato não funciona)
3. Refine FAQ chatbot (add return to categories button, ability to go back to previous question)

## Architecture
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: React with Tailwind CSS
- **Database**: MongoDB (motor async driver)
- **Auth**: JWT-based authentication

## User Personas
- **Administrador**: Approves personal trainers
- **Personal Trainer**: Manages students, workouts, assessments, financial, feedback
- **Student (Aluno)**: Views workouts, logs progress, submits check-ins/reports, FAQ chatbot

## Core Requirements
- Workout management (upload, assign, delete)
- Student check-in and feedback/report system
- FAQ chatbot for student support
- Financial management
- Progress tracking and gamification

## What's Been Implemented (2026-03-06)

### Bug Fixes Applied
1. **DELETE workout endpoint** - Added missing `@api_router.delete("/workouts/{workout_id}")` decorator in `server.py` (line ~2893). The function existed but had no route decorator, causing 404/405 errors.

2. **Submit report button** - Fixed validation in `CheckinsPage.jsx` `handleSubmitStudentFeedback()` - changed from `!isTodayFeedbackDay` to `(!isTodayFeedbackDay && !pendingFeedbackRequest)` so students can submit reports when personal trainer requests feedback even if it's not a scheduled feedback day.

3. **FAQ Chatbot refinement** - Rewrote `FAQChatPopup.jsx` with:
   - Inline action buttons after bot answers ("Mais sobre [categoria]" and "Categorias")
   - Navigation bar with "Categorias" and last viewed category buttons
   - "Voltar as categorias" button at bottom of question list
   - State tracking for last viewed category and question
   - Back button in header when viewing a category

## Prioritized Backlog
- P0: All critical bugs fixed
- P1: N/A
- P2: FAQ chatbot "Fale com seu personal" button could navigate to chat page

## Next Tasks
- User testing to confirm all flows work end-to-end
- Consider adding workout deletion confirmation dialog
