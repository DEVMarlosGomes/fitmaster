from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, status, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import pandas as pd
from io import BytesIO
import base64
import shutil
import re
import unicodedata

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'personal-trainer-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
MASTER_ADMIN_EMAIL = os.environ.get("MASTER_ADMIN_EMAIL", "Personal@admin.com")
MASTER_ADMIN_PASSWORD = os.environ.get("MASTER_ADMIN_PASSWORD", "admin123")
MASTER_ADMIN_NAME = os.environ.get("MASTER_ADMIN_NAME", "administrador")

# Upload directory for exercise images
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Personal Trainer API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== EXERCISE CATEGORIES ====================
EXERCISE_CATEGORIES = [
    "ABDÔMEN", "AERÓBIO", "ALONGAMENTO", "ANTEBRAÇO", "BÍCEPS",
    "DORSAL", "ELÁSTICOS E FAIXAS", "FUNCIONAL", "GLÚTEOS",
    "INFERIORES", "MAT PILATES", "MOBILIDADE", "OMBRO",
    "PARA FAZER EM CASA", "PEITORAL", "TRÍCEPS"
]

# ==================== EXERCISE IMAGE DATABASE ====================
EXERCISE_IMAGES = {
    "supino reto": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino inclinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "supino declinado": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crucifixo": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "crossover": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
    "flexão": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
    "puxada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "puxada frontal": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada curvada": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "remada baixa": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "pulldown": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400",
    "desenvolvimento": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação lateral": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "elevação frontal": "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400",
    "rosca": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca direta": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca alternada": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca martelo": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "rosca scott": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
    "tríceps": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps pulley": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps corda": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps testa": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "tríceps francês": "https://images.unsplash.com/photo-1530822847156-5df684ec5ee1?w=400",
    "agachamento": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "leg press": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "extensora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "flexora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "cadeira extensora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "cadeira flexora": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "stiff": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "levantamento terra": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
    "panturrilha": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "gêmeos": "https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=400",
    "abdominal": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "abdominal canivete": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "abdominal com corda na polia": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
    "prancha": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400",
    "crunch": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
}

EXERCISE_VIDEOS = {
    "supino reto": "https://www.youtube.com/embed/fG_03xSzT2s",
    "supino inclinado": "https://www.youtube.com/embed/jPLdzuHckI8",
    "supino inclinado com halter": "https://www.youtube.com/embed/Cjh2fIMQHk0",
    "puxada frontal": "https://www.youtube.com/embed/CAwf7n6Luuc",
    "remada curvada": "https://www.youtube.com/embed/kBWAon7ItDw",
    "agachamento": "https://www.youtube.com/embed/ultWZbUMPL8",
    "leg press": "https://www.youtube.com/embed/IZxyjW7MPJQ",
    "rosca direta": "https://www.youtube.com/embed/ykJmrZ5v0Oo",
    "tríceps pulley": "https://www.youtube.com/embed/2-LAMcpzODU",
    "desenvolvimento": "https://www.youtube.com/embed/qEwKCR5JCog",
    "elevação lateral": "https://www.youtube.com/embed/3VcKaXpzqRo",
    "extensora": "https://www.youtube.com/embed/YyvSfVjQeL0",
    "flexora": "https://www.youtube.com/embed/1Tq3QdYUuHs",
    "stiff": "https://www.youtube.com/embed/1uDiW5--rAE",
    "levantamento terra": "https://www.youtube.com/embed/op9kVnSso6Q",
    "abdominal": "https://www.youtube.com/embed/Xyd_fa5zoEU",
    "prancha": "https://www.youtube.com/embed/ASdvN_XEl_c",
}

def normalize_youtube_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    if "/embed/" in url:
        return url
    # Try to extract video id from common patterns
    match = re.search(r"(?:v=|youtu\.be/|embed/)([\w-]+)", url)
    if match:
        return f"https://www.youtube.com/embed/{match.group(1)}"
    return url

def get_exercise_image(exercise_name: str) -> Optional[str]:
    name_lower = exercise_name.lower().strip()
    if name_lower in EXERCISE_IMAGES:
        return EXERCISE_IMAGES[name_lower]
    for key, url in EXERCISE_IMAGES.items():
        if key in name_lower or name_lower in key:
            return url
    return None

def resolve_exercise_video_url(exercise_name: str) -> Optional[str]:
    name_lower = exercise_name.lower().strip()
    if name_lower in EXERCISE_VIDEOS:
        return normalize_youtube_url(EXERCISE_VIDEOS[name_lower])
    for key, url in EXERCISE_VIDEOS.items():
        if key in name_lower or name_lower in key:
            return normalize_youtube_url(url)
    return None

def _normalize_exercise_name_for_match(exercise_name: Optional[str]) -> str:
    cleaned = exercise_name or ""
    return re.sub(r"\s+", " ", _normalize_text_for_match(cleaned)).strip()

def _safe_parse_iso_datetime(value: Optional[str]) -> datetime:
    if not value:
        return datetime.min.replace(tzinfo=timezone.utc)
    parsed_value = str(value).strip()
    if parsed_value.endswith("Z"):
        parsed_value = parsed_value[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(parsed_value)
        if parsed.tzinfo is None:
            return parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)

def _exercise_library_priority_key(exercise: Dict[str, Any], personal_id: Optional[str]) -> tuple:
    is_personal_match = bool(personal_id and exercise.get("personal_id") == personal_id)
    updated_at = _safe_parse_iso_datetime(exercise.get("updated_at"))
    return (1 if is_personal_match else 0, updated_at)

async def _find_best_library_exercise_match(exercise_name: str, personal_id: Optional[str]) -> Optional[Dict[str, Any]]:
    exercise_name_clean = (exercise_name or "").strip()
    if not exercise_name_clean:
        return None

    scope_filters: List[Dict[str, Any]] = [{"is_system": True}]
    if personal_id:
        scope_filters.insert(0, {"personal_id": personal_id})

    exact_matches = await db.exercise_library.find(
        {
            "$and": [
                {"$or": scope_filters},
                {"name": {"$regex": f"^{re.escape(exercise_name_clean)}$", "$options": "i"}}
            ]
        },
        {"_id": 0}
    ).to_list(20)

    if exact_matches:
        exact_matches.sort(key=lambda item: _exercise_library_priority_key(item, personal_id), reverse=True)
        return exact_matches[0]

    target_normalized = _normalize_exercise_name_for_match(exercise_name_clean)
    if not target_normalized:
        return None

    candidates = await db.exercise_library.find({"$or": scope_filters}, {"_id": 0}).to_list(1500)
    normalized_matches = [
        item for item in candidates
        if _normalize_exercise_name_for_match(item.get("name")) == target_normalized
    ]

    if not normalized_matches:
        return None

    normalized_matches.sort(key=lambda item: _exercise_library_priority_key(item, personal_id), reverse=True)
    return normalized_matches[0]

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = "personal"

class StudentCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    phone: Optional[str] = None
    notes: Optional[str] = None
    # New fields
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None  # emagrecimento, hipertrofia, condicionamento, etc.
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None

class StudentActiveUpdate(BaseModel):
    is_active: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    personal_id: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    birth_date: Optional[str] = None
    gender: Optional[str] = None
    objective: Optional[str] = None
    medical_restrictions: Optional[str] = None
    emergency_contact: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = True
    is_approved: Optional[bool] = None
    approved_at: Optional[str] = None
    approved_by: Optional[str] = None
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class RegisterResponse(BaseModel):
    message: str
    pending_approval: bool = True
    user: UserResponse

# ==================== PHYSICAL ASSESSMENT MODELS ====================

class PhysicalAssessmentCreate(BaseModel):
    student_id: str
    assessment_type: str  # "manual", "bioimpedance", "pollock_7"
    date: str
    weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    bmi: Optional[float] = None
    # Body measurements
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    arm_right: Optional[float] = None
    arm_left: Optional[float] = None
    thigh_right: Optional[float] = None
    thigh_left: Optional[float] = None
    calf_right: Optional[float] = None
    calf_left: Optional[float] = None
    # Pollock 7 folds
    fold_chest: Optional[float] = None
    fold_abdominal: Optional[float] = None
    fold_thigh: Optional[float] = None
    fold_triceps: Optional[float] = None
    fold_subscapular: Optional[float] = None
    fold_suprailiac: Optional[float] = None
    fold_midaxillary: Optional[float] = None
    notes: Optional[str] = None

class PhysicalAssessmentResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    assessment_type: str
    date: str
    weight: Optional[float] = None
    height: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    bmi: Optional[float] = None
    chest: Optional[float] = None
    waist: Optional[float] = None
    hip: Optional[float] = None
    arm_right: Optional[float] = None
    arm_left: Optional[float] = None
    thigh_right: Optional[float] = None
    thigh_left: Optional[float] = None
    calf_right: Optional[float] = None
    calf_left: Optional[float] = None
    fold_chest: Optional[float] = None
    fold_abdominal: Optional[float] = None
    fold_thigh: Optional[float] = None
    fold_triceps: Optional[float] = None
    fold_subscapular: Optional[float] = None
    fold_suprailiac: Optional[float] = None
    fold_midaxillary: Optional[float] = None
    notes: Optional[str] = None
    created_at: str

# ==================== TRAINING ROUTINE MODELS ====================

class TrainingRoutineCreate(BaseModel):
    student_id: str
    name: str  # "Semana 1", "Rotina A", etc.
    start_date: str
    end_date: Optional[str] = None
    objective: Optional[str] = None  # "Hipertrofia", "Emagrecimento"
    level: Optional[str] = None  # "Iniciante", "Intermediário", "Avançado"
    day_type: Optional[str] = None  # "Numérico", "Por Letra", "Por Dia da Semana"
    auto_archive: bool = True
    notes: Optional[str] = None

class TrainingRoutineUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    objective: Optional[str] = None
    level: Optional[str] = None
    day_type: Optional[str] = None
    auto_archive: Optional[bool] = None
    notes: Optional[str] = None
    status: Optional[str] = None  # "active", "archived"

class TrainingRoutineResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    name: str
    start_date: str
    end_date: Optional[str] = None
    objective: Optional[str] = None
    level: Optional[str] = None
    day_type: Optional[str] = None
    auto_archive: bool
    notes: Optional[str] = None
    status: str
    workouts_count: int = 0
    created_at: str
    updated_at: str

# ==================== EXERCISE LIBRARY MODELS ====================

class ExerciseLibraryCreate(BaseModel):
    name: str
    category: str  # From EXERCISE_CATEGORIES
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    instructions: Optional[str] = None
    muscles_worked: Optional[List[str]] = None

class ExerciseLibraryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    instructions: Optional[str] = None
    muscles_worked: Optional[List[str]] = None
    mp4_video_url: Optional[str] = None

class ExerciseLibraryResponse(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    instructions: Optional[str] = None
    muscles_worked: Optional[List[str]] = None
    mp4_video_url: Optional[str] = None
    personal_id: Optional[str] = None  # None = system exercise
    is_system: Optional[bool] = False
    created_at: str

# ==================== FINANCIAL MODELS ====================

class FinancialPlanCreate(BaseModel):
    student_id: str
    name: str  # "Mensal", "Trimestral", etc.
    value: float
    due_day: int  # Day of month (1-31)
    start_date: str
    status: str = "active"  # "active", "inactive"

class FinancialPaymentCreate(BaseModel):
    student_id: str
    plan_id: Optional[str] = None
    amount: float
    due_date: str
    payment_date: Optional[str] = None
    status: str = "pending"  # "pending", "paid", "overdue"
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class FinancialPaymentUpdate(BaseModel):
    payment_date: Optional[str] = None
    status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

# ==================== WORKOUT MODELS ====================

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: str
    sets: int
    reps: str
    weight: Optional[str] = None
    notes: Optional[str] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    description: Optional[str] = None

class WorkoutDayCreate(BaseModel):
    day_name: str
    exercises: List[ExerciseCreate]

class WorkoutCreate(BaseModel):
    name: str
    student_id: str
    routine_id: Optional[str] = None
    days: List[WorkoutDayCreate]

class WorkoutResponse(BaseModel):
    id: str
    name: str
    student_id: str
    personal_id: str
    routine_id: Optional[str] = None
    days: List[dict]
    created_at: str
    updated_at: str
    version: int

# ==================== PROGRESS MODELS ====================

class ProgressLog(BaseModel):
    workout_id: str
    exercise_name: str
    day_name: Optional[str] = None
    sets_completed: List[dict]
    notes: Optional[str] = None
    difficulty: Optional[int] = None  # 1-5 scale

class ProgressResponse(BaseModel):
    id: str
    student_id: str
    workout_id: str
    exercise_name: str
    day_name: Optional[str] = None
    sets_completed: List[dict]
    notes: Optional[str] = None
    difficulty: Optional[int] = None
    logged_at: str

# ==================== WORKOUT SESSION MODELS ====================

class WorkoutSessionCreate(BaseModel):
    workout_id: str
    day_name: Optional[str] = None
    notes: Optional[str] = None
    difficulty: Optional[int] = None  # 1-5 scale
    feedback: Optional[str] = None
    recovery_score: Optional[int] = Field(default=None, ge=1, le=10)
    effort_score: Optional[int] = Field(default=None, ge=1, le=10)

class WorkoutSessionResponse(BaseModel):
    id: str
    student_id: str
    workout_id: str
    day_name: Optional[str] = None
    notes: Optional[str] = None
    difficulty: Optional[int] = None
    feedback: Optional[str] = None
    recovery_score: Optional[int] = None
    effort_score: Optional[int] = None
    total_volume_kg: float = 0.0
    total_reps: int = 0
    total_sets: int = 0
    exercises_completed: int = 0
    estimated_calories: int = 0
    completed_at: str

# ==================== CHECK-IN MODELS ====================

class CheckInCreate(BaseModel):
    notes: Optional[str] = None

class CheckInResponse(BaseModel):
    id: str
    student_id: str
    check_in_time: str
    notes: Optional[str] = None

FEEDBACK_CATEGORIES = [
    {"key": "dieta", "label": "Dieta", "prompt": "Qual foi a adesao da dieta no periodo?"},
    {"key": "treino", "label": "Treino", "prompt": "Qual foi a adesao ao treino no periodo?"},
    {"key": "sono", "label": "Sono", "prompt": "Como ficou a qualidade do sono no periodo?"},
    {"key": "bem_estar", "label": "Bem-estar", "prompt": "Como voce avalia seu bem-estar no periodo?"},
]

FEEDBACK_CATEGORY_MAP = {item["key"]: item for item in FEEDBACK_CATEGORIES}
FEEDBACK_SCORE_KEYS = {item["key"] for item in FEEDBACK_CATEGORIES}
REQUIRED_FEEDBACK_PHOTO_KEYS = ["front", "side", "back"]

class FeedbackPlanUpdate(BaseModel):
    mode: str = "weekly"
    weekly_days: List[int] = Field(default_factory=list)
    monthly_days: List[int] = Field(default_factory=list)
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    reminder_enabled: bool = True
    reminder_message: Optional[str] = None
    active: bool = True

class FeedbackPlanResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    mode: str
    weekly_days: List[int] = Field(default_factory=list)
    monthly_days: List[int] = Field(default_factory=list)
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    reminder_enabled: bool = True
    reminder_message: Optional[str] = None
    active: bool = True
    created_at: str
    updated_at: str

class FeedbackScoreInput(BaseModel):
    completion_percentage: int = Field(..., ge=0, le=100)
    observation: Optional[str] = None

class FeedbackMeasurementsInput(BaseModel):
    fasting_weight: float = Field(..., gt=0)
    waist_circumference: float = Field(..., gt=0)
    abdominal_circumference: float = Field(..., gt=0)
    hip_circumference: Optional[float] = Field(default=None, gt=0)

class FeedbackPhotosInput(BaseModel):
    front: Optional[str] = None
    side: Optional[str] = None
    back: Optional[str] = None

class FeedbackSubmissionCreate(BaseModel):
    reference_date: Optional[str] = None
    answers: Dict[str, Optional[str]] = Field(default_factory=dict)
    scores: Dict[str, FeedbackScoreInput] = Field(default_factory=dict)
    general_observations: Optional[str] = None
    measurements: Optional[FeedbackMeasurementsInput] = None
    photos: Optional[FeedbackPhotosInput] = None

class FeedbackReplyItem(BaseModel):
    key: str
    reply: Optional[str] = None

class FeedbackReplyUpdate(BaseModel):
    replies: List[FeedbackReplyItem] = Field(default_factory=list)

class FeedbackReminderRequest(BaseModel):
    student_ids: List[str] = Field(default_factory=list)
    message: Optional[str] = None

class FeedbackSubmissionItemResponse(BaseModel):
    key: str
    label: str
    prompt: str
    student_feedback: Optional[str] = None
    completion_percentage: Optional[int] = None
    student_observation: Optional[str] = None
    personal_reply: Optional[str] = None
    personal_replied_at: Optional[str] = None

class FeedbackSubmissionResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    reference_date: str
    status: str
    items: List[FeedbackSubmissionItemResponse]
    general_observations: Optional[str] = None
    measurements: Optional[FeedbackMeasurementsInput] = None
    photos: Optional[FeedbackPhotosInput] = None
    is_structured_report: bool = False
    student_submitted_at: Optional[str] = None
    created_at: str
    updated_at: str
    answered_items: int = 0
    replied_items: int = 0
    completion_percentage: int = 0

# ==================== NOTIFICATION MODELS ====================

class NotificationCreate(BaseModel):
    user_id: str
    title: str
    message: str
    type: str = "info"

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    created_at: str

# ==================== EVOLUTION PHOTO MODELS ====================

class EvolutionPhotoResponse(BaseModel):
    id: str
    student_id: str
    photo_url: str
    date: str
    notes: Optional[str] = None
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        if user.get("role") == "personal" and user.get("is_approved", True) is not True:
            raise HTTPException(status_code=403, detail="Conta de personal aguardando aprovacao do administrador")
        if user.get("role") == "student" and user.get("is_active", True) is not True:
            raise HTTPException(status_code=403, detail="Conta de aluno inativa. Contate seu personal")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_personal_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "personal":
        raise HTTPException(status_code=403, detail="Acesso restrito a personal trainers")
    return current_user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "administrador":
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador")
    return current_user

async def find_user_by_email(email: str, projection: Optional[Dict[str, int]] = None):
    escaped_email = re.escape((email or "").strip())
    query = {"email": {"$regex": f"^{escaped_email}$", "$options": "i"}}
    return await db.users.find_one(query, projection)

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=RegisterResponse)
async def register(user: UserCreate):
    if user.email.lower() == MASTER_ADMIN_EMAIL.lower():
        raise HTTPException(status_code=400, detail="Este email e reservado ao administrador")

    existing = await find_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hash_password(user.password),
        "role": "personal",
        "is_approved": False,
        "approved_at": None,
        "approved_by": None,
        "created_at": now
    }
    
    await db.users.insert_one(user_doc)
    
    admin_user = await db.users.find_one({"role": "administrador"}, {"_id": 0, "id": 1})
    if admin_user:
        await db.notifications.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": admin_user["id"],
            "title": "Novo personal pendente",
            "message": f"Personal '{user.name}' aguardando aprovacao.",
            "type": "info",
            "read": False,
            "created_at": now
        })

    return RegisterResponse(
        message="Cadastro enviado. Aguarde aprovacao do administrador para acessar o sistema.",
        pending_approval=True,
        user=UserResponse(
            id=user_id,
            email=user.email,
            name=user.name,
            role="personal",
            is_approved=False,
            created_at=now
        )
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await find_user_by_email(credentials.email, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    if user.get("role") == "personal" and user.get("is_approved", True) is not True:
        raise HTTPException(status_code=403, detail="Conta de personal aguardando aprovacao do administrador")
    if user.get("role") == "student" and user.get("is_active", True) is not True:
        raise HTTPException(status_code=403, detail="Conta de aluno inativa. Contate seu personal")
    
    token = create_token(user["id"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            personal_id=user.get("personal_id"),
            phone=user.get("phone"),
            notes=user.get("notes"),
            birth_date=user.get("birth_date"),
            gender=user.get("gender"),
            objective=user.get("objective"),
            medical_restrictions=user.get("medical_restrictions"),
            emergency_contact=user.get("emergency_contact"),
            address=user.get("address"),
            is_active=user.get("is_active", True),
            is_approved=user.get("is_approved"),
            approved_at=user.get("approved_at"),
            approved_by=user.get("approved_by"),
            created_at=user["created_at"]
        )
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        personal_id=current_user.get("personal_id"),
        phone=current_user.get("phone"),
        notes=current_user.get("notes"),
        birth_date=current_user.get("birth_date"),
        gender=current_user.get("gender"),
        objective=current_user.get("objective"),
        medical_restrictions=current_user.get("medical_restrictions"),
        emergency_contact=current_user.get("emergency_contact"),
        address=current_user.get("address"),
        is_active=current_user.get("is_active", True),
        is_approved=current_user.get("is_approved"),
        approved_at=current_user.get("approved_at"),
        approved_by=current_user.get("approved_by"),
        created_at=current_user["created_at"]
    )

# ==================== ADMIN APPROVAL ROUTES ====================

@api_router.get("/admin/personals/pending", response_model=List[UserResponse])
async def list_pending_personals(admin: dict = Depends(get_admin_user)):
    pending_personals = await db.users.find(
        {"role": "personal", "is_approved": False},
        {"_id": 0, "password": 0}
    ).sort("created_at", 1).to_list(500)

    return [UserResponse(
        id=p["id"],
        email=p["email"],
        name=p["name"],
        role=p["role"],
        is_approved=p.get("is_approved"),
        approved_at=p.get("approved_at"),
        approved_by=p.get("approved_by"),
        created_at=p["created_at"]
    ) for p in pending_personals]

@api_router.post("/admin/personals/{personal_id}/approve", response_model=UserResponse)
async def approve_personal_account(personal_id: str, admin: dict = Depends(get_admin_user)):
    personal = await db.users.find_one({"id": personal_id, "role": "personal"}, {"_id": 0})
    if not personal:
        raise HTTPException(status_code=404, detail="Personal nao encontrado")

    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": personal_id},
        {"$set": {"is_approved": True, "approved_at": now, "approved_by": admin["id"]}}
    )

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": personal_id,
        "title": "Conta aprovada",
        "message": "Seu acesso de personal foi aprovado pelo administrador.",
        "type": "info",
        "read": False,
        "created_at": now
    })

    updated = await db.users.find_one({"id": personal_id}, {"_id": 0, "password": 0})
    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated["role"],
        personal_id=updated.get("personal_id"),
        phone=updated.get("phone"),
        notes=updated.get("notes"),
        birth_date=updated.get("birth_date"),
        gender=updated.get("gender"),
        objective=updated.get("objective"),
        medical_restrictions=updated.get("medical_restrictions"),
        emergency_contact=updated.get("emergency_contact"),
        address=updated.get("address"),
        is_approved=updated.get("is_approved"),
        approved_at=updated.get("approved_at"),
        approved_by=updated.get("approved_by"),
        created_at=updated["created_at"]
    )

# ==================== STUDENT MANAGEMENT ====================

@api_router.post("/students", response_model=UserResponse)
async def create_student(student: StudentCreate, personal: dict = Depends(get_personal_user)):
    existing = await find_user_by_email(student.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    student_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    student_doc = {
        "id": student_id,
        "email": student.email,
        "name": student.name,
        "password": hash_password(student.password),
        "role": "student",
        "personal_id": personal["id"],
        "phone": student.phone,
        "notes": student.notes,
        "birth_date": student.birth_date,
        "gender": student.gender,
        "objective": student.objective,
        "medical_restrictions": student.medical_restrictions,
        "emergency_contact": student.emergency_contact,
        "address": student.address,
        "is_active": True,
        "created_at": now
    }
    
    await db.users.insert_one(student_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": student_id,
        "title": "Bem-vindo!",
        "message": f"Você foi cadastrado por {personal['name']}. Aguarde seu treino!",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return UserResponse(
        id=student_id,
        email=student.email,
        name=student.name,
        role="student",
        personal_id=personal["id"],
        phone=student.phone,
        notes=student.notes,
        birth_date=student.birth_date,
        gender=student.gender,
        objective=student.objective,
        medical_restrictions=student.medical_restrictions,
        emergency_contact=student.emergency_contact,
        address=student.address,
        is_active=True,
        created_at=now
    )

@api_router.get("/students", response_model=List[UserResponse])
async def list_students(personal: dict = Depends(get_personal_user)):
    students = await db.users.find(
        {"role": "student", "personal_id": personal["id"]},
        {"_id": 0, "password": 0}
    ).to_list(1000)
    
    return [UserResponse(
        id=s["id"],
        email=s["email"],
        name=s["name"],
        role=s["role"],
        personal_id=s.get("personal_id"),
        phone=s.get("phone"),
        notes=s.get("notes"),
        birth_date=s.get("birth_date"),
        gender=s.get("gender"),
        objective=s.get("objective"),
        medical_restrictions=s.get("medical_restrictions"),
        emergency_contact=s.get("emergency_contact"),
        address=s.get("address"),
        is_active=s.get("is_active", True),
        created_at=s["created_at"]
    ) for s in students]

@api_router.get("/students/{student_id}", response_model=UserResponse)
async def get_student(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    return UserResponse(
        id=student["id"],
        email=student["email"],
        name=student["name"],
        role=student["role"],
        personal_id=student.get("personal_id"),
        phone=student.get("phone"),
        notes=student.get("notes"),
        birth_date=student.get("birth_date"),
        gender=student.get("gender"),
        objective=student.get("objective"),
        medical_restrictions=student.get("medical_restrictions"),
        emergency_contact=student.get("emergency_contact"),
        address=student.get("address"),
        is_active=student.get("is_active", True),
        created_at=student["created_at"]
    )

@api_router.put("/students/{student_id}", response_model=UserResponse)
async def update_student(student_id: str, update: StudentUpdate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"id": student_id}, {"$set": update_data})
    
    updated = await db.users.find_one({"id": student_id}, {"_id": 0, "password": 0})
    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated["role"],
        personal_id=updated.get("personal_id"),
        phone=updated.get("phone"),
        notes=updated.get("notes"),
        birth_date=updated.get("birth_date"),
        gender=updated.get("gender"),
        objective=updated.get("objective"),
        medical_restrictions=updated.get("medical_restrictions"),
        emergency_contact=updated.get("emergency_contact"),
        address=updated.get("address"),
        is_active=updated.get("is_active", True),
        created_at=updated["created_at"]
    )

@api_router.patch("/students/{student_id}/active", response_model=UserResponse)
async def set_student_active_status(
    student_id: str,
    payload: StudentActiveUpdate,
    personal: dict = Depends(get_personal_user)
):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno nÃ£o encontrado")

    await db.users.update_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"$set": {"is_active": bool(payload.is_active)}}
    )

    updated = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )

    return UserResponse(
        id=updated["id"],
        email=updated["email"],
        name=updated["name"],
        role=updated["role"],
        personal_id=updated.get("personal_id"),
        phone=updated.get("phone"),
        notes=updated.get("notes"),
        birth_date=updated.get("birth_date"),
        gender=updated.get("gender"),
        objective=updated.get("objective"),
        medical_restrictions=updated.get("medical_restrictions"),
        emergency_contact=updated.get("emergency_contact"),
        address=updated.get("address"),
        is_active=updated.get("is_active", True),
        created_at=updated["created_at"]
    )

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.users.delete_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    await db.workouts.delete_many({"student_id": student_id})
    await db.progress.delete_many({"student_id": student_id})
    await db.notifications.delete_many({"user_id": student_id})
    await db.assessments.delete_many({"student_id": student_id})
    await db.routines.delete_many({"student_id": student_id})
    await db.payments.delete_many({"student_id": student_id})
    await db.plans.delete_many({"student_id": student_id})
    await db.checkins.delete_many({"student_id": student_id})
    await db.feedback_plans.delete_many({"student_id": student_id})
    await db.feedback_submissions.delete_many({"student_id": student_id})
    await db.evolution_photos.delete_many({"student_id": student_id})
    await db.workout_sessions.delete_many({"student_id": student_id})
    
    return {"message": "Aluno removido com sucesso"}

# ==================== PHYSICAL ASSESSMENTS ====================

@api_router.post("/assessments", response_model=PhysicalAssessmentResponse)
async def create_assessment(assessment: PhysicalAssessmentCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": assessment.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    assessment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Calculate BMI if weight and height are provided
    bmi = None
    if assessment.weight and assessment.height:
        height_m = assessment.height / 100
        bmi = round(assessment.weight / (height_m ** 2), 2)
    
    assessment_doc = {
        "id": assessment_id,
        "student_id": assessment.student_id,
        "personal_id": personal["id"],
        **assessment.model_dump(),
        "bmi": bmi or assessment.bmi,
        "created_at": now
    }
    
    await db.assessments.insert_one(assessment_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": assessment.student_id,
        "title": "Nova Avaliação Física",
        "message": f"Uma nova avaliação foi registrada em {assessment.date}",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return PhysicalAssessmentResponse(**assessment_doc)

@api_router.get("/assessments", response_model=List[PhysicalAssessmentResponse])
async def list_assessments(
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    assessments = await db.assessments.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return [PhysicalAssessmentResponse(**a) for a in assessments]

@api_router.get("/assessments/{assessment_id}", response_model=PhysicalAssessmentResponse)
async def get_assessment(assessment_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": assessment_id}
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    assessment = await db.assessments.find_one(query, {"_id": 0})
    if not assessment:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return PhysicalAssessmentResponse(**assessment)

@api_router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.assessments.delete_one({"id": assessment_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return {"message": "Avaliação removida com sucesso"}

@api_router.get("/assessments/compare/{student_id}")
async def compare_assessments(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    assessments = await db.assessments.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("date", 1).to_list(100)
    
    if len(assessments) < 2:
        return {"message": "É necessário pelo menos 2 avaliações para comparar", "assessments": assessments}
    
    first = assessments[0]
    last = assessments[-1]
    
    comparison = {
        "first_assessment": first,
        "last_assessment": last,
        "changes": {}
    }
    
    fields_to_compare = ["weight", "body_fat_percentage", "muscle_mass", "chest", "waist", "hip", 
                         "arm_right", "arm_left", "thigh_right", "thigh_left"]
    
    for field in fields_to_compare:
        if first.get(field) and last.get(field):
            change = last[field] - first[field]
            comparison["changes"][field] = {
                "initial": first[field],
                "current": last[field],
                "change": round(change, 2),
                "percentage": round((change / first[field]) * 100, 2) if first[field] != 0 else 0
            }
    
    return comparison

# ==================== TRAINING ROUTINES ====================

@api_router.post("/routines", response_model=TrainingRoutineResponse)
async def create_routine(routine: TrainingRoutineCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": routine.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    routine_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    routine_doc = {
        "id": routine_id,
        "student_id": routine.student_id,
        "personal_id": personal["id"],
        **routine.model_dump(),
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
    
    await db.routines.insert_one(routine_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": routine.student_id,
        "title": "Nova Rotina de Treino",
        "message": f"Uma nova rotina '{routine.name}' foi criada para você!",
        "type": "workout",
        "read": False,
        "created_at": now
    })
    
    return TrainingRoutineResponse(**routine_doc, workouts_count=0)

@api_router.get("/routines", response_model=List[TrainingRoutineResponse])
async def list_routines(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    if status:
        query["status"] = status
    
    routines = await db.routines.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for r in routines:
        workouts_count = await db.workouts.count_documents({"routine_id": r["id"]})
        result.append(TrainingRoutineResponse(**r, workouts_count=workouts_count))
    
    return result

@api_router.get("/routines/{routine_id}", response_model=TrainingRoutineResponse)
async def get_routine(routine_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": routine_id}
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    routine = await db.routines.find_one(query, {"_id": 0})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    workouts_count = await db.workouts.count_documents({"routine_id": routine_id})
    return TrainingRoutineResponse(**routine, workouts_count=workouts_count)

@api_router.put("/routines/{routine_id}", response_model=TrainingRoutineResponse)
async def update_routine(routine_id: str, update: TrainingRoutineUpdate, personal: dict = Depends(get_personal_user)):
    routine = await db.routines.find_one({"id": routine_id, "personal_id": personal["id"]})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.routines.update_one({"id": routine_id}, {"$set": update_data})
    
    updated = await db.routines.find_one({"id": routine_id}, {"_id": 0})
    workouts_count = await db.workouts.count_documents({"routine_id": routine_id})
    return TrainingRoutineResponse(**updated, workouts_count=workouts_count)

@api_router.post("/routines/{routine_id}/clone")
async def clone_routine(routine_id: str, student_id: str, personal: dict = Depends(get_personal_user)):
    routine = await db.routines.find_one({"id": routine_id, "personal_id": personal["id"]})
    if not routine:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    new_routine_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    new_routine = {
        **routine,
        "id": new_routine_id,
        "student_id": student_id,
        "name": f"{routine['name']} (Cópia)",
        "created_at": now,
        "updated_at": now
    }
    if "_id" in new_routine:
        del new_routine["_id"]
    
    await db.routines.insert_one(new_routine)
    
    # Clone associated workouts
    workouts = await db.workouts.find({"routine_id": routine_id}, {"_id": 0}).to_list(100)
    for w in workouts:
        new_workout = {
            **w,
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "routine_id": new_routine_id,
            "created_at": now,
            "updated_at": now
        }
        await db.workouts.insert_one(new_workout)
    
    return {"message": "Rotina clonada com sucesso", "new_routine_id": new_routine_id}

@api_router.delete("/routines/{routine_id}")
async def delete_routine(routine_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.routines.delete_one({"id": routine_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rotina não encontrada")
    
    await db.workouts.delete_many({"routine_id": routine_id})
    return {"message": "Rotina removida com sucesso"}

# ==================== SERVE UPLOADS ====================

@api_router.get("/uploads/{file_name:path}")
async def serve_upload_file(file_name: str):
    """Serve uploaded files (videos, images, PDFs) via API route"""
    file_path = UPLOAD_DIR / file_name
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(file_path)

# ==================== EXERCISE LIBRARY ====================

@api_router.get("/exercise-library/categories")
async def get_exercise_categories():
    return {"categories": EXERCISE_CATEGORIES}

@api_router.post("/exercise-library", response_model=ExerciseLibraryResponse)
async def create_library_exercise(exercise: ExerciseLibraryCreate, personal: dict = Depends(get_personal_user)):
    exercise_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get default image if not provided
    image_url = exercise.image_url or get_exercise_image(exercise.name)
    
    exercise_doc = {
        "id": exercise_id,
        **exercise.model_dump(),
        "image_url": image_url,
        "personal_id": personal["id"],
        "created_at": now
    }
    
    await db.exercise_library.insert_one(exercise_doc)
    return ExerciseLibraryResponse(**exercise_doc)

@api_router.get("/exercise-library", response_model=List[ExerciseLibraryResponse])
async def list_library_exercises(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Get system exercises and personal's custom exercises
    query = {
        "$or": [
            {"personal_id": None},
            {"personal_id": current_user["id"] if current_user["role"] == "personal" else current_user.get("personal_id")}
        ]
    }
    
    if category:
        query["category"] = category
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    exercises = await db.exercise_library.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return [ExerciseLibraryResponse(**e) for e in exercises]

@api_router.delete("/exercise-library/{exercise_id}")
async def delete_library_exercise(exercise_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.exercise_library.delete_one({"id": exercise_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Exercício não encontrado ou é um exercício do sistema")
    return {"message": "Exercício removido com sucesso"}

@api_router.put("/exercise-library/{exercise_id}", response_model=ExerciseLibraryResponse)
async def update_library_exercise(exercise_id: str, update: ExerciseLibraryUpdate, personal: dict = Depends(get_personal_user)):
    exercise = await db.exercise_library.find_one({"id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    # Allow personal to edit system exercises (for their own use) or their own exercises
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If it's a system exercise, clone it for this personal first
    if exercise.get("is_system") and not exercise.get("personal_id"):
        # Update in-place for system exercises (shared)
        await db.exercise_library.update_one(
            {"id": exercise_id},
            {"$set": update_data}
        )
    else:
        await db.exercise_library.update_one(
            {"id": exercise_id},
            {"$set": update_data}
        )
    
    updated = await db.exercise_library.find_one({"id": exercise_id}, {"_id": 0})
    return ExerciseLibraryResponse(**updated)

@api_router.post("/exercise-library/{exercise_id}/upload-video")
async def upload_exercise_library_video(
    exercise_id: str,
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    """Upload de vídeo MP4 para um exercício da biblioteca"""
    exercise = await db.exercise_library.find_one({"id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    if not file.filename.lower().endswith(('.mp4', '.webm', '.mov')):
        raise HTTPException(status_code=400, detail="Apenas arquivos MP4, WebM ou MOV são aceitos")
    
    safe_name = exercise["name"].lower().replace(" ", "_").replace("/", "_")[:30]
    file_ext = file.filename.split(".")[-1].lower()
    file_name = f"video_{safe_name}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    video_url = f"/uploads/{file_name}"
    
    # Remove old uploaded video if exists
    old_mp4 = exercise.get("mp4_video_url", "")
    if old_mp4 and old_mp4.startswith("/uploads/"):
        old_file = old_mp4.replace("/uploads/", "")
        old_path = UPLOAD_DIR / old_file
        if old_path.exists():
            old_path.unlink()
    
    now = datetime.now(timezone.utc).isoformat()
    await db.exercise_library.update_one(
        {"id": exercise_id},
        {"$set": {"mp4_video_url": video_url, "updated_at": now}}
    )
    
    return {"message": "Vídeo enviado com sucesso", "mp4_video_url": video_url}

@api_router.delete("/exercise-library/{exercise_id}/video")
async def delete_exercise_library_video(exercise_id: str, personal: dict = Depends(get_personal_user)):
    """Remove o vídeo MP4 de um exercício da biblioteca"""
    exercise = await db.exercise_library.find_one({"id": exercise_id}, {"_id": 0})
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    
    mp4_url = exercise.get("mp4_video_url", "")
    if mp4_url and mp4_url.startswith("/uploads/"):
        file_name = mp4_url.replace("/uploads/", "")
        file_path = UPLOAD_DIR / file_name
        if file_path.exists():
            file_path.unlink()
    
    now = datetime.now(timezone.utc).isoformat()
    await db.exercise_library.update_one(
        {"id": exercise_id},
        {"$set": {"mp4_video_url": None, "updated_at": now}}
    )
    
    return {"message": "Vídeo removido com sucesso"}

# ==================== FINANCIAL ====================

@api_router.post("/financial/plans")
async def create_financial_plan(plan: FinancialPlanCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": plan.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "id": plan_id,
        "personal_id": personal["id"],
        **plan.model_dump(),
        "created_at": now
    }
    
    await db.plans.insert_one(plan_doc)
    return {"id": plan_id, **plan_doc}

@api_router.get("/financial/plans")
async def list_financial_plans(
    student_id: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    if student_id:
        query["student_id"] = student_id
    
    plans = await db.plans.find(query, {"_id": 0}).to_list(100)
    return plans

@api_router.delete("/financial/plans/{plan_id}")
async def delete_financial_plan(plan_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.plans.delete_one({"id": plan_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plano não encontrado")
    return {"message": "Plano removido com sucesso"}

@api_router.post("/financial/payments")
async def create_payment(payment: FinancialPaymentCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": payment.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    payment_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    payment_doc = {
        "id": payment_id,
        "personal_id": personal["id"],
        **payment.model_dump(),
        "created_at": now
    }
    
    await db.payments.insert_one(payment_doc)
    
    # Remove _id from response
    payment_doc.pop("_id", None)
    return payment_doc

@api_router.get("/financial/payments")
async def list_payments(
    student_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    if student_id:
        query["student_id"] = student_id
    if status:
        query["status"] = status
    if start_date:
        query["due_date"] = {"$gte": start_date}
    if end_date:
        if "due_date" in query:
            query["due_date"]["$lte"] = end_date
        else:
            query["due_date"] = {"$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(500)
    return payments

@api_router.put("/financial/payments/{payment_id}")
async def update_payment(payment_id: str, update: FinancialPaymentUpdate, personal: dict = Depends(get_personal_user)):
    payment = await db.payments.find_one({"id": payment_id, "personal_id": personal["id"]})
    if not payment:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.payments.update_one({"id": payment_id}, {"$set": update_data})
    
    updated = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    return updated

@api_router.delete("/financial/payments/{payment_id}")
async def delete_payment(payment_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.payments.delete_one({"id": payment_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Pagamento removido com sucesso"}

@api_router.get("/financial/summary")
async def get_financial_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    query = {"personal_id": personal["id"]}
    
    if start_date or end_date:
        query["due_date"] = {}
        if start_date:
            query["due_date"]["$gte"] = start_date
        if end_date:
            query["due_date"]["$lte"] = end_date
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] == "pending")
    total_overdue = sum(p["amount"] for p in payments if p["status"] == "overdue")
    
    return {
        "total_received": total_received,
        "total_pending": total_pending,
        "total_overdue": total_overdue,
        "payments_count": len(payments),
        "paid_count": len([p for p in payments if p["status"] == "paid"]),
        "pending_count": len([p for p in payments if p["status"] == "pending"]),
        "overdue_count": len([p for p in payments if p["status"] == "overdue"])
    }

@api_router.get("/financial/student/{student_id}")
async def get_student_financial(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        query = {"student_id": student_id, "personal_id": current_user["id"]}
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
        query = {"student_id": student_id}
    
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(100)
    plans = await db.plans.find({"student_id": student_id}, {"_id": 0}).to_list(10)
    
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] in ["pending", "overdue"])
    
    return {
        "payments": payments,
        "plans": plans,
        "total_received": total_received,
        "total_pending": total_pending
    }

# ==================== CHECK-INS ====================

def _clean_optional_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned if cleaned else None

def _parse_date_input(value: str, field_name: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"{field_name} deve estar no formato YYYY-MM-DD")

def _weekday_sunday_zero(target_date: datetime) -> int:
    # Python weekday: Monday=0 ... Sunday=6. We store Sunday=0 ... Saturday=6.
    return (target_date.weekday() + 1) % 7

def _sanitize_weekly_days(values: List[int]) -> List[int]:
    days = sorted({int(value) for value in (values or [])})
    if any(day < 0 or day > 6 for day in days):
        raise HTTPException(status_code=400, detail="weekly_days aceita somente valores de 0 a 6")
    return days

def _sanitize_monthly_days(values: List[int]) -> List[int]:
    days = sorted({int(value) for value in (values or [])})
    if any(day < 1 or day > 31 for day in days):
        raise HTTPException(status_code=400, detail="monthly_days aceita somente valores de 1 a 31")
    return days

def _is_feedback_day(plan_doc: Dict[str, Any], target_date: datetime) -> bool:
    if not plan_doc or plan_doc.get("active") is False:
        return False

    target_date_str = target_date.strftime("%Y-%m-%d")
    period_start = plan_doc.get("period_start")
    period_end = plan_doc.get("period_end")

    if period_start and target_date_str < period_start:
        return False
    if period_end and target_date_str > period_end:
        return False

    mode = plan_doc.get("mode", "weekly")
    weekly_days = {int(day) for day in (plan_doc.get("weekly_days") or [])}
    monthly_days = {int(day) for day in (plan_doc.get("monthly_days") or [])}

    if mode == "daily":
        return True
    if mode == "weekly":
        return _weekday_sunday_zero(target_date) in weekly_days
    if mode == "monthly":
        return target_date.day in monthly_days
    return False

def _normalize_text_for_match(value: Optional[str]) -> str:
    cleaned = _clean_optional_text(value) or ""
    normalized = unicodedata.normalize("NFKD", cleaned.lower())
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))

def _is_student_female(student_doc: Dict[str, Any]) -> bool:
    normalized_gender = _normalize_text_for_match(student_doc.get("gender"))
    return normalized_gender.startswith("fem")

def _sanitize_feedback_scores(
    scores: Dict[str, FeedbackScoreInput]
) -> Dict[str, Dict[str, Optional[Any]]]:
    sanitized: Dict[str, Dict[str, Optional[Any]]] = {}
    for key, score in (scores or {}).items():
        if key not in FEEDBACK_SCORE_KEYS:
            raise HTTPException(status_code=400, detail=f"Categoria invalida para score: {key}")
        score_doc = score.model_dump() if isinstance(score, FeedbackScoreInput) else dict(score or {})
        completion_percentage = score_doc.get("completion_percentage")
        if completion_percentage is None:
            raise HTTPException(status_code=400, detail=f"completion_percentage e obrigatorio em {key}")
        try:
            completion_percentage = int(completion_percentage)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail=f"completion_percentage invalido em {key}")
        if completion_percentage < 0 or completion_percentage > 100:
            raise HTTPException(status_code=400, detail=f"completion_percentage deve estar entre 0 e 100 em {key}")

        sanitized[key] = {
            "completion_percentage": completion_percentage,
            "observation": _clean_optional_text(score_doc.get("observation"))
        }
    return sanitized

def _sanitize_feedback_photos(photos: Optional[FeedbackPhotosInput]) -> Optional[Dict[str, str]]:
    if photos is None:
        return None
    photo_doc = photos.model_dump()
    sanitized: Dict[str, str] = {}
    for key in REQUIRED_FEEDBACK_PHOTO_KEYS:
        value = _clean_optional_text(photo_doc.get(key))
        if value:
            sanitized[key] = value
    return sanitized or None

def _build_feedback_items(
    answers: Dict[str, Optional[str]],
    scores: Optional[Dict[str, Dict[str, Optional[Any]]]] = None,
    existing_items: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    items = []
    scores = scores or {}
    existing_by_key = {
        str(item.get("key")): item
        for item in (existing_items or [])
        if item.get("key")
    }

    for category in FEEDBACK_CATEGORIES:
        key = category["key"]
        existing_item = existing_by_key.get(key, {})
        has_new_score = key in scores
        has_new_answer = key in answers
        existing_completion = existing_item.get("completion_percentage")
        try:
            existing_completion = int(existing_completion) if existing_completion is not None else None
        except (TypeError, ValueError):
            existing_completion = None

        if has_new_score:
            score_payload = scores.get(key) or {}
            completion_percentage = score_payload.get("completion_percentage")
            student_observation = _clean_optional_text(score_payload.get("observation"))
            student_feedback = student_observation
        else:
            completion_percentage = existing_completion
            student_observation = _clean_optional_text(existing_item.get("student_observation"))
            student_feedback = (
                _clean_optional_text(answers.get(key))
                if has_new_answer
                else _clean_optional_text(existing_item.get("student_feedback"))
            )

        items.append({
            "key": key,
            "label": category["label"],
            "prompt": category["prompt"],
            "student_feedback": student_feedback,
            "completion_percentage": completion_percentage,
            "student_observation": student_observation,
            "personal_reply": _clean_optional_text(existing_item.get("personal_reply")),
            "personal_replied_at": existing_item.get("personal_replied_at")
        })

    return items

def _feedback_summary(items: List[Dict[str, Any]]) -> Dict[str, int]:
    answered_items = 0
    replied_items = 0

    for item in items:
        has_completion_score = item.get("completion_percentage") is not None
        has_student_feedback = bool(
            has_completion_score
            or _clean_optional_text(item.get("student_feedback"))
            or _clean_optional_text(item.get("student_observation"))
        )
        has_personal_reply = bool(_clean_optional_text(item.get("personal_reply")))

        if has_student_feedback:
            answered_items += 1
            if has_personal_reply:
                replied_items += 1

    completion_percentage = int(round((replied_items / answered_items) * 100)) if answered_items else 0

    return {
        "answered_items": answered_items,
        "replied_items": replied_items,
        "completion_percentage": completion_percentage
    }

def _feedback_status(items: List[Dict[str, Any]]) -> str:
    summary = _feedback_summary(items)
    if summary["answered_items"] == 0:
        return "pending"
    return "completed" if summary["answered_items"] == summary["replied_items"] else "pending"

def _build_feedback_submission_response(doc: Dict[str, Any]) -> FeedbackSubmissionResponse:
    response_doc = dict(doc)
    response_doc.setdefault("general_observations", None)
    response_doc.setdefault("measurements", None)
    response_doc.setdefault("photos", None)
    response_doc["is_structured_report"] = bool(
        response_doc.get("is_structured_report")
        or response_doc.get("measurements")
        or response_doc.get("photos")
    )
    summary = _feedback_summary(response_doc.get("items") or [])
    response_doc.update(summary)
    return FeedbackSubmissionResponse(**response_doc)

@api_router.post("/checkins", response_model=CheckInResponse)
async def create_checkin(checkin: CheckInCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem fazer check-in")
    
    checkin_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    checkin_doc = {
        "id": checkin_id,
        "student_id": current_user["id"],
        "check_in_time": now,
        "notes": checkin.notes
    }
    
    await db.checkins.insert_one(checkin_doc)
    return CheckInResponse(**checkin_doc)

@api_router.get("/checkins", response_model=List[CheckInResponse])
async def list_checkins(
    student_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "personal":
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
        else:
            students = await db.users.find({"personal_id": current_user["id"], "role": "student"}, {"id": 1}).to_list(1000)
            student_ids = [s["id"] for s in students]
            query["student_id"] = {"$in": student_ids}
    else:
        query["student_id"] = current_user["id"]
    
    if start_date or end_date:
        query["check_in_time"] = {}
        if start_date:
            query["check_in_time"]["$gte"] = start_date
        if end_date:
            query["check_in_time"]["$lte"] = end_date + "T23:59:59"
    
    checkins = await db.checkins.find(query, {"_id": 0}).sort("check_in_time", -1).to_list(500)
    return [CheckInResponse(**c) for c in checkins]

@api_router.get("/checkins/frequency/{student_id}")
async def get_student_frequency(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Get check-ins for the last 30 days
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    checkins = await db.checkins.find(
        {"student_id": student_id, "check_in_time": {"$gte": thirty_days_ago}},
        {"_id": 0}
    ).to_list(100)
    
    # Group by date
    dates = {}
    for c in checkins:
        date = c["check_in_time"][:10]
        if date not in dates:
            dates[date] = 0
        dates[date] += 1
    
    return {
        "total_checkins": len(checkins),
        "unique_days": len(dates),
        "frequency_by_date": dates
    }

@api_router.get("/checkins/feedback-plan/{student_id}", response_model=FeedbackPlanResponse)
async def get_feedback_plan(
    student_id: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"], "role": "student"})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno nao encontrado")
    elif current_user["role"] == "student":
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    else:
        raise HTTPException(status_code=403, detail="Perfil sem permissao para acessar planejamento")

    plan_doc = await db.feedback_plans.find_one({"student_id": student_id}, {"_id": 0})
    if not plan_doc:
        raise HTTPException(status_code=404, detail="Planejamento de feedback nao encontrado")

    return FeedbackPlanResponse(**plan_doc)

@api_router.put("/checkins/feedback-plan/{student_id}", response_model=FeedbackPlanResponse)
async def upsert_feedback_plan(
    student_id: str,
    payload: FeedbackPlanUpdate,
    personal: dict = Depends(get_personal_user)
):
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"], "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno nao encontrado")

    mode = _clean_optional_text(payload.mode or "") or "weekly"
    mode = mode.lower()
    if mode not in ["daily", "weekly", "monthly"]:
        raise HTTPException(status_code=400, detail="mode deve ser daily, weekly ou monthly")

    weekly_days = _sanitize_weekly_days(payload.weekly_days)
    monthly_days = _sanitize_monthly_days(payload.monthly_days)

    if mode == "weekly" and not weekly_days:
        raise HTTPException(status_code=400, detail="Selecione ao menos um dia da semana")
    if mode == "monthly" and not monthly_days:
        raise HTTPException(status_code=400, detail="Selecione ao menos um dia do mes")

    period_start = _clean_optional_text(payload.period_start)
    period_end = _clean_optional_text(payload.period_end)
    if period_start:
        _parse_date_input(period_start, "period_start")
    if period_end:
        _parse_date_input(period_end, "period_end")
    if period_start and period_end and period_start > period_end:
        raise HTTPException(status_code=400, detail="period_end deve ser igual ou posterior a period_start")

    now = datetime.now(timezone.utc).isoformat()
    existing = await db.feedback_plans.find_one({"student_id": student_id}, {"_id": 0})

    plan_doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student_id,
        "personal_id": personal["id"],
        "mode": mode,
        "weekly_days": weekly_days,
        "monthly_days": monthly_days,
        "period_start": period_start,
        "period_end": period_end,
        "reminder_enabled": bool(payload.reminder_enabled),
        "reminder_message": _clean_optional_text(payload.reminder_message),
        "active": bool(payload.active),
        "created_at": existing["created_at"] if existing else now,
        "updated_at": now
    }

    await db.feedback_plans.update_one(
        {"student_id": student_id},
        {"$set": plan_doc},
        upsert=True
    )

    return FeedbackPlanResponse(**plan_doc)

@api_router.post("/checkins/feedback-submissions/upload-photo")
async def upload_feedback_submission_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem enviar fotos do relato")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens sao aceitas")

    student_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()
    file_ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "jpg"
    file_name = f"feedback_report_{student_id}_{uuid.uuid4().hex[:10]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    return {
        "photo_url": f"/uploads/{file_name}",
        "uploaded_at": now
    }

@api_router.post("/checkins/feedback-submissions", response_model=FeedbackSubmissionResponse)
async def create_feedback_submission(
    payload: FeedbackSubmissionCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem enviar feedback")

    student_id = current_user["id"]
    personal_id = current_user.get("personal_id")
    if not personal_id:
        raise HTTPException(status_code=400, detail="Aluno sem personal vinculado")

    plan_doc = await db.feedback_plans.find_one({"student_id": student_id, "active": True}, {"_id": 0})
    
    # Check if there's a pending feedback request from the personal
    pending_request = await db.feedback_requests.find_one(
        {"student_id": student_id, "status": "pending"}, {"_id": 0}
    )
    has_pending_request = pending_request is not None
    
    if not plan_doc and not has_pending_request:
        raise HTTPException(status_code=400, detail="Nao existe planejamento de feedback ativo para este aluno")

    reference_date = _clean_optional_text(payload.reference_date) or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    target_date = _parse_date_input(reference_date, "reference_date")
    if not has_pending_request and plan_doc and not _is_feedback_day(plan_doc, target_date):
        raise HTTPException(status_code=400, detail="Feedback nao esta agendado para esta data")

    existing = await db.feedback_submissions.find_one(
        {"student_id": student_id, "reference_date": reference_date},
        {"_id": 0}
    )

    now = datetime.now(timezone.utc).isoformat()
    existing_items = existing.get("items") if existing else []
    existing_items_by_key = {
        str(item.get("key")): item
        for item in existing_items
        if item.get("key")
    }

    answers_payload = payload.answers or {}
    invalid_answer_keys = sorted(set(answers_payload.keys()) - FEEDBACK_SCORE_KEYS)
    if invalid_answer_keys:
        raise HTTPException(status_code=400, detail=f"Categorias invalidas: {', '.join(invalid_answer_keys)}")

    sanitized_scores = _sanitize_feedback_scores(payload.scores or {})
    general_observations = _clean_optional_text(payload.general_observations)

    payload_measurements = payload.measurements.model_dump() if payload.measurements else None
    existing_measurements = existing.get("measurements") if existing else None
    measurements_doc = payload_measurements or existing_measurements

    payload_photos = _sanitize_feedback_photos(payload.photos)
    existing_photos = existing.get("photos") if existing else None
    merged_photos: Dict[str, str] = {}
    for photo_key in REQUIRED_FEEDBACK_PHOTO_KEYS:
        photo_value = None
        if payload_photos:
            photo_value = payload_photos.get(photo_key)
        if not photo_value and existing_photos:
            photo_value = _clean_optional_text(existing_photos.get(photo_key))
        if photo_value:
            merged_photos[photo_key] = photo_value

    existing_structured = bool(
        existing
        and (existing.get("measurements") or existing.get("photos") or existing.get("is_structured_report"))
    )
    has_structured_payload = bool(
        sanitized_scores
        or payload_measurements
        or payload_photos
        or general_observations
        or existing_structured
    )

    if has_structured_payload:
        missing_score_keys = []
        for score_key in FEEDBACK_SCORE_KEYS:
            if score_key in sanitized_scores:
                continue
            existing_score = existing_items_by_key.get(score_key, {}).get("completion_percentage")
            if existing_score is None:
                missing_score_keys.append(score_key)
        if missing_score_keys:
            raise HTTPException(
                status_code=400,
                detail=f"Preencha o percentual de: {', '.join(sorted(missing_score_keys))}"
            )

        if not measurements_doc:
            raise HTTPException(status_code=400, detail="As medidas sao obrigatorias neste relato")

        required_measurements = ["fasting_weight", "waist_circumference", "abdominal_circumference"]
        for measurement_key in required_measurements:
            if measurements_doc.get(measurement_key) is None:
                raise HTTPException(status_code=400, detail=f"Campo obrigatorio: {measurement_key}")

        if _is_student_female(current_user) and measurements_doc.get("hip_circumference") is None:
            raise HTTPException(
                status_code=400,
                detail="Para alunas, a medida de quadril e obrigatoria"
            )

        missing_photo_keys = [key for key in REQUIRED_FEEDBACK_PHOTO_KEYS if key not in merged_photos]
        if missing_photo_keys:
            raise HTTPException(
                status_code=400,
                detail=f"Envie as fotos obrigatorias: {', '.join(missing_photo_keys)}"
            )

        items = _build_feedback_items(
            answers_payload,
            sanitized_scores,
            existing_items
        )
    else:
        has_legacy_content = any(_clean_optional_text(value) for value in answers_payload.values())
        if not has_legacy_content:
            raise HTTPException(status_code=400, detail="Preencha ao menos um item do feedback")
        items = _build_feedback_items(answers_payload, {}, existing_items)

    submission_doc = {
        "id": existing["id"] if existing else str(uuid.uuid4()),
        "student_id": student_id,
        "personal_id": personal_id,
        "reference_date": reference_date,
        "status": _feedback_status(items),
        "items": items,
        "general_observations": general_observations if has_structured_payload else None,
        "measurements": measurements_doc if has_structured_payload else None,
        "photos": merged_photos if has_structured_payload else None,
        "is_structured_report": has_structured_payload,
        "student_submitted_at": now,
        "created_at": existing["created_at"] if existing else now,
        "updated_at": now
    }

    await db.feedback_submissions.update_one(
        {"id": submission_doc["id"]},
        {"$set": submission_doc},
        upsert=True
    )

    if has_pending_request:
        await db.feedback_requests.update_many(
            {"student_id": student_id, "personal_id": personal_id, "status": "pending"},
            {"$set": {"status": "responded", "responded_at": now}}
        )

    return _build_feedback_submission_response(submission_doc)

@api_router.get("/checkins/feedback-submissions", response_model=List[FeedbackSubmissionResponse])
async def list_feedback_submissions(
    student_id: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}

    if current_user["role"] == "personal":
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"], "role": "student"})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno nao encontrado")
            query["student_id"] = student_id
        else:
            students = await db.users.find(
                {"personal_id": current_user["id"], "role": "student"},
                {"id": 1, "_id": 0}
            ).to_list(1000)
            student_ids = [student["id"] for student in students]
            if not student_ids:
                return []
            query["student_id"] = {"$in": student_ids}
        query["personal_id"] = current_user["id"]
    elif current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        raise HTTPException(status_code=403, detail="Perfil sem permissao para consultar feedback")

    submissions = await db.feedback_submissions.find(
        query,
        {"_id": 0}
    ).sort("reference_date", -1).to_list(limit)

    return [_build_feedback_submission_response(submission) for submission in submissions]

@api_router.post("/checkins/feedback-reminders")
async def send_feedback_reminders(
    payload: FeedbackReminderRequest,
    personal: dict = Depends(get_personal_user)
):
    requested_student_ids = list(dict.fromkeys(payload.student_ids or []))
    if not requested_student_ids:
        raise HTTPException(status_code=400, detail="Nenhum aluno foi selecionado")

    students = await db.users.find(
        {
            "id": {"$in": requested_student_ids},
            "personal_id": personal["id"],
            "role": "student"
        },
        {"_id": 0, "id": 1, "name": 1}
    ).to_list(len(requested_student_ids))

    valid_student_ids = {student["id"] for student in students}
    invalid_student_ids = sorted(set(requested_student_ids) - valid_student_ids)
    if invalid_student_ids:
        raise HTTPException(status_code=400, detail=f"Alunos invalidos: {', '.join(invalid_student_ids)}")

    reminder_message = (
        _clean_optional_text(payload.message)
        or "Lembrete: responda seu check-in e o relatorio do periodo."
    )
    now = datetime.now(timezone.utc).isoformat()

    notifications = []
    for student_id in requested_student_ids:
        notifications.append({
            "id": str(uuid.uuid4()),
            "user_id": student_id,
            "title": "Lembrete de check-in",
            "message": reminder_message,
            "type": "info",
            "read": False,
            "created_at": now
        })

    if notifications:
        await db.notifications.insert_many(notifications)

    return {
        "sent_count": len(notifications),
        "student_ids": requested_student_ids
    }

@api_router.patch("/checkins/feedback-submissions/{submission_id}/replies", response_model=FeedbackSubmissionResponse)
async def reply_feedback_submission(
    submission_id: str,
    payload: FeedbackReplyUpdate,
    personal: dict = Depends(get_personal_user)
):
    submission = await db.feedback_submissions.find_one({"id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Feedback nao encontrado")
    if submission.get("personal_id") != personal["id"]:
        raise HTTPException(status_code=403, detail="Acesso negado")

    if not payload.replies:
        raise HTTPException(status_code=400, detail="Nenhuma resposta foi enviada")

    reply_map: Dict[str, Optional[str]] = {}
    for reply_item in payload.replies:
        key = _clean_optional_text(reply_item.key)
        if not key or key not in FEEDBACK_CATEGORY_MAP:
            raise HTTPException(status_code=400, detail=f"Categoria invalida: {reply_item.key}")
        reply_map[key] = _clean_optional_text(reply_item.reply)

    now = datetime.now(timezone.utc).isoformat()
    items = submission.get("items") or []
    for item in items:
        key = item.get("key")
        if key in reply_map:
            item["personal_reply"] = reply_map[key]
            item["personal_replied_at"] = now if reply_map[key] else None

    status = _feedback_status(items)

    await db.feedback_submissions.update_one(
        {"id": submission_id},
        {
            "$set": {
                "items": items,
                "status": status,
                "updated_at": now
            }
        }
    )

    updated_doc = {
        **submission,
        "items": items,
        "status": status,
        "updated_at": now
    }
    return _build_feedback_submission_response(updated_doc)

# ==================== EVOLUTION PHOTOS ====================

@api_router.post("/evolution-photos")
async def upload_evolution_photo(
    student_id: str = Form(...),
    date: str = Form(...),
    notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são aceitas")
    
    photo_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    file_name = f"evolution_{student_id}_{photo_id}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    photo_doc = {
        "id": photo_id,
        "student_id": student_id,
        "personal_id": personal["id"],
        "photo_url": f"/uploads/{file_name}",
        "date": date,
        "notes": notes,
        "created_at": now
    }
    
    await db.evolution_photos.insert_one(photo_doc)
    return EvolutionPhotoResponse(**photo_doc)

@api_router.get("/evolution-photos/{student_id}", response_model=List[EvolutionPhotoResponse])
async def list_evolution_photos(student_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    else:
        if student_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Acesso negado")
    
    photos = await db.evolution_photos.find({"student_id": student_id}, {"_id": 0}).sort("date", -1).to_list(100)
    return [EvolutionPhotoResponse(**p) for p in photos]

@api_router.delete("/evolution-photos/{photo_id}")
async def delete_evolution_photo(photo_id: str, personal: dict = Depends(get_personal_user)):
    photo = await db.evolution_photos.find_one({"id": photo_id, "personal_id": personal["id"]})
    if not photo:
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    
    # Delete file
    file_path = ROOT_DIR / photo["photo_url"].lstrip("/")
    if file_path.exists():
        file_path.unlink()
    
    await db.evolution_photos.delete_one({"id": photo_id})
    return {"message": "Foto removida com sucesso"}

# ==================== WORKOUT MANAGEMENT ====================

def normalize_sheet_column(name: str) -> str:
    text = str(name or "").strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def clean_sheet_value(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except TypeError:
        pass
    text = str(value).strip()
    if text.lower() == "nan":
        return ""
    return text

def parse_rest_time_seconds(interval_value: Any, default_seconds: int = 90) -> int:
    text = clean_sheet_value(interval_value).lower()
    if not text:
        return default_seconds

    normalized = (
        text.replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
        .replace("\x96", "-")
        .replace(",", ".")
    )

    matches = re.findall(r"\d+(?:\.\d+)?", normalized)
    if not matches:
        return default_seconds

    values = [float(v) for v in matches]
    base_value = values[0] if len(values) == 1 else (values[0] + values[1]) / 2

    is_minutes = any(token in normalized for token in ["min", "mins", "minute"])
    if not is_minutes and re.search(r"\d+\s*m\b", normalized):
        is_minutes = True
    if not is_minutes and "s" not in normalized and base_value <= 10:
        is_minutes = True

    seconds = int(round(base_value * 60)) if is_minutes else int(round(base_value))
    return seconds if seconds > 0 else default_seconds

def to_int_or_default(value: Any, default: int = 3) -> int:
    text = clean_sheet_value(value).replace(",", ".")
    if not text:
        return default
    try:
        parsed = int(float(text))
        return parsed if parsed > 0 else default
    except (TypeError, ValueError):
        return default

def resolve_sheet_column(normalized_columns: Dict[str, str], aliases: List[str]) -> Optional[str]:
    for alias in aliases:
        alias_key = normalize_sheet_column(alias)
        if alias_key in normalized_columns:
            return normalized_columns[alias_key]
    return None

@api_router.post("/workouts/upload")
async def upload_workout(
    file: UploadFile = File(...),
    student_id: str = None,
    routine_id: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    filename = file.filename or "treino"
    filename_lower = filename.lower()
    if not filename_lower.endswith((".csv", ".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Apenas arquivos .csv, .xls ou .xlsx são aceitos")
    
    if student_id:
        student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    try:
        content = await file.read()
        if filename_lower.endswith(".csv"):
            try:
                df = pd.read_csv(BytesIO(content), sep=None, engine="python", encoding="utf-8-sig")
            except UnicodeDecodeError:
                try:
                    df = pd.read_csv(BytesIO(content), sep=None, engine="python", encoding="cp1252")
                except UnicodeDecodeError:
                    df = pd.read_csv(BytesIO(content), sep=None, engine="python", encoding="latin-1")
        else:
            df = pd.read_excel(BytesIO(content))

        df.columns = [clean_sheet_value(col) for col in df.columns]
        normalized_columns: Dict[str, str] = {}
        for col in df.columns:
            key = normalize_sheet_column(col)
            if key and key not in normalized_columns:
                normalized_columns[key] = col

        day_col = resolve_sheet_column(normalized_columns, ["TREINO", "Dia"])
        exercise_col = resolve_sheet_column(normalized_columns, ["EXERCÍCIO", "Exercicio"])
        reps_col = resolve_sheet_column(normalized_columns, ["REPETIÇÕES", "Repeticoes", "Reps"])

        missing_required = []
        if not day_col:
            missing_required.append("TREINO")
        if not exercise_col:
            missing_required.append("EXERCÍCIO")
        if not reps_col:
            missing_required.append("REPETIÇÕES")

        if missing_required:
            found_columns = ", ".join(df.columns.tolist()) or "(nenhuma coluna)"
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Colunas obrigatórias não encontradas: {', '.join(missing_required)}. "
                    f"Colunas encontradas: {found_columns}"
                )
            )

        muscle_col = resolve_sheet_column(normalized_columns, ["GRUPO MUSCULAR", "Grupo Muscular"])
        sets_col = resolve_sheet_column(normalized_columns, ["SÉRIES", "Series"])
        weight_col = resolve_sheet_column(normalized_columns, ["CARGA (ALUNO)", "Carga Aluno", "CARGA"])
        interval_col = resolve_sheet_column(normalized_columns, ["INTERVALO", "Descanso"])
        notes_col = resolve_sheet_column(normalized_columns, ["OBSERVAÇÃO", "OBSERVAÇÕES", "Observacao", "Observacoes"])
        method_col = resolve_sheet_column(normalized_columns, ["MÉTODO", "Metodo"])
        video_col = resolve_sheet_column(normalized_columns, ["VÍDEO", "VIDEO", "Link Vídeo", "Link Video"])
        description_col = resolve_sheet_column(normalized_columns, ["DESCRIÇÃO", "Descricao"])

        days_map: Dict[str, List[Dict[str, Any]]] = {}
        for _, row in df.iterrows():
            day_name = clean_sheet_value(row.get(day_col))
            exercise_name = clean_sheet_value(row.get(exercise_col))

            # Ignore spacing/placeholder rows from spreadsheet templates.
            if not day_name or not exercise_name:
                continue

            reps_value = clean_sheet_value(row.get(reps_col)) or "10-12"
            interval_value = clean_sheet_value(row.get(interval_col)) if interval_col else ""
            method_value = clean_sheet_value(row.get(method_col)) if method_col else ""
            notes_value = clean_sheet_value(row.get(notes_col)) if notes_col else ""
            description_value = clean_sheet_value(row.get(description_col)) if description_col else ""
            video_value = clean_sheet_value(row.get(video_col)) if video_col else ""

            description_parts = []
            if description_value:
                description_parts.append(description_value)
            if method_value:
                description_parts.append(f"Método: {method_value}")
            if interval_value:
                description_parts.append(f"Intervalo: {interval_value}")
            merged_description = " | ".join(description_parts) if description_parts else None

            exercise = {
                "name": exercise_name,
                "muscle_group": clean_sheet_value(row.get(muscle_col)) if muscle_col else "",
                "sets": to_int_or_default(row.get(sets_col), 3) if sets_col else 3,
                "reps": reps_value,
                "weight": clean_sheet_value(row.get(weight_col)) if weight_col else None,
                "notes": notes_value or None,
                "image_url": get_exercise_image(exercise_name),
                "video_url": video_value or resolve_exercise_video_url(exercise_name),
                "description": merged_description,
                "rest_time": parse_rest_time_seconds(interval_value, default_seconds=90),
            }

            if not exercise["weight"]:
                exercise["weight"] = None

            days_map.setdefault(day_name, []).append(exercise)

        days = [
            {"day_name": day_name, "exercises": exercises}
            for day_name, exercises in days_map.items()
            if exercises
        ]

        if not days:
            raise HTTPException(
                status_code=400,
                detail="Nenhum exercício válido encontrado. Verifique se TREINO e EXERCÍCIO estão preenchidos."
            )
        
        workout_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        workout_doc = {
            "id": workout_id,
            "name": filename.rsplit('.', 1)[0],
            "student_id": student_id,
            "personal_id": personal["id"],
            "routine_id": routine_id,
            "days": days,
            "created_at": now,
            "updated_at": now,
            "version": 1
        }
        
        if student_id:
            existing = await db.workouts.find_one(
                {"student_id": student_id, "personal_id": personal["id"], "routine_id": routine_id},
                sort=[("version", -1)]
            )
            if existing:
                workout_doc["version"] = existing.get("version", 0) + 1
                await db.workouts.update_one(
                    {"id": existing["id"]},
                    {"$set": {"archived": True}}
                )
        
        await db.workouts.insert_one(workout_doc)
        
        if student_id:
            await db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": student_id,
                "title": "Novo Treino!",
                "message": f"Seu personal atualizou seu treino: {workout_doc['name']}",
                "type": "workout",
                "read": False,
                "created_at": now
            })
        
        return {
            "id": workout_id,
            "name": workout_doc["name"],
            "days_count": len(days),
            "exercises_count": sum(len(d["exercises"]) for d in days),
            "days": days
        }
        
    except HTTPException:
        raise
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="Arquivo vazio ou inválido")
    except Exception as e:
        logger.error(f"Error parsing file: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

@api_router.post("/workouts", response_model=WorkoutResponse)
async def create_workout(workout: WorkoutCreate, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one({"id": workout.student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    workout_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    workout_doc = {
        "id": workout_id,
        "name": workout.name,
        "student_id": workout.student_id,
        "personal_id": personal["id"],
        "routine_id": workout.routine_id,
        "days": [d.model_dump() for d in workout.days],
        "created_at": now,
        "updated_at": now,
        "version": 1
    }
    
    await db.workouts.insert_one(workout_doc)
    
    return WorkoutResponse(
        id=workout_id,
        name=workout.name,
        student_id=workout.student_id,
        personal_id=personal["id"],
        routine_id=workout.routine_id,
        days=workout_doc["days"],
        created_at=now,
        updated_at=now,
        version=1
    )

@api_router.get("/workouts", response_model=List[WorkoutResponse])
async def list_workouts(
    student_id: Optional[str] = None,
    routine_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"archived": {"$ne": True}}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
        if student_id:
            query["student_id"] = student_id
    else:
        query["student_id"] = current_user["id"]
    
    if routine_id:
        query["routine_id"] = routine_id
    
    workouts = await db.workouts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for w in workouts:
        try:
            result.append(WorkoutResponse(
                id=w["id"],
                name=w["name"],
                student_id=w.get("student_id") or "",
                personal_id=w["personal_id"],
                routine_id=w.get("routine_id"),
                days=w.get("days", []),
                created_at=w["created_at"],
                updated_at=w.get("updated_at", w["created_at"]),
                version=w.get("version", 1)
            ))
        except Exception as e:
            logger.error(f"Error processing workout {w.get('id')}: {e}")
            continue
    
    return result

@api_router.get("/workouts/{workout_id}", response_model=WorkoutResponse)
async def get_workout(workout_id: str, current_user: dict = Depends(get_current_user)):
    query = {"id": workout_id}
    
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    workout = await db.workouts.find_one(query, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    return WorkoutResponse(
        id=workout["id"],
        name=workout["name"],
        student_id=workout["student_id"],
        personal_id=workout["personal_id"],
        routine_id=workout.get("routine_id"),
        days=workout["days"],
        created_at=workout["created_at"],
        updated_at=workout["updated_at"],
        version=workout.get("version", 1)
    )

@api_router.put("/workouts/{workout_id}/exercise-image")
async def update_exercise_image(workout_id: str, day_index: int, exercise_index: int, image_url: str, personal: dict = Depends(get_personal_user)):
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    days = workout["days"]
    if day_index < len(days) and exercise_index < len(days[day_index]["exercises"]):
        days[day_index]["exercises"][exercise_index]["image_url"] = image_url
        
        await db.workouts.update_one(
            {"id": workout_id},
            {"$set": {"days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"message": "Imagem atualizada com sucesso"}
    
    raise HTTPException(status_code=400, detail="Índice inválido")

@api_router.post("/workouts/{workout_id}/upload-image")
async def upload_exercise_image(
    workout_id: str,
    day_index: int = Form(...),
    exercise_index: int = Form(...),
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    days = workout["days"]
    if day_index >= len(days) or exercise_index >= len(days[day_index]["exercises"]):
        raise HTTPException(status_code=400, detail="Índice inválido")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Apenas imagens são aceitas")
    
    file_ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
    file_name = f"{workout_id}_{day_index}_{exercise_index}_{uuid.uuid4().hex[:8]}.{file_ext}"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    image_url = f"/uploads/{file_name}"
    days[day_index]["exercises"][exercise_index]["image_url"] = image_url
    
    await db.workouts.update_one(
        {"id": workout_id},
        {"$set": {"days": days, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Imagem enviada com sucesso", "image_url": image_url}


# ==================== PDF AERÓBICO ENDPOINTS ====================

@api_router.post("/workouts/{workout_id}/upload-pdf")
async def upload_workout_pdf(
    workout_id: str,
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    """Upload de PDF do aeróbico para um treino específico"""
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")
    
    # Salvar o PDF
    file_name = f"aerobico_{workout_id}_{uuid.uuid4().hex[:8]}.pdf"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    pdf_url = f"/uploads/{file_name}"
    
    await db.workouts.update_one(
        {"id": workout_id},
        {"$set": {"aerobic_pdf_url": pdf_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "PDF do aeróbico enviado com sucesso", "pdf_url": pdf_url}


@api_router.get("/workouts/{workout_id}/pdf")
async def get_workout_pdf(workout_id: str, current_user: dict = Depends(get_current_user)):
    """Retorna a URL do PDF do aeróbico de um treino"""
    query = {"id": workout_id}
    if current_user["role"] == "personal":
        query["personal_id"] = current_user["id"]
    else:
        query["student_id"] = current_user["id"]
    
    workout = await db.workouts.find_one(query, {"_id": 0, "aerobic_pdf_url": 1})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    pdf_url = workout.get("aerobic_pdf_url")
    if not pdf_url:
        raise HTTPException(status_code=404, detail="PDF não encontrado para este treino")
    
    return {"pdf_url": pdf_url}


@api_router.delete("/workouts/{workout_id}/pdf")
async def delete_workout_pdf(workout_id: str, personal: dict = Depends(get_personal_user)):
    """Remove o PDF do aeróbico de um treino"""
    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    pdf_url = workout.get("aerobic_pdf_url")
    if pdf_url:
        # Remover arquivo físico se existir
        file_name = pdf_url.replace("/uploads/", "")
        file_path = UPLOAD_DIR / file_name
        if file_path.exists():
            file_path.unlink()
    
    await db.workouts.update_one(
        {"id": workout_id},
        {"$unset": {"aerobic_pdf_url": ""}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "PDF removido com sucesso"}


# ==================== UPLOAD DE VÍDEO MP4 ENDPOINTS ====================

@api_router.post("/exercises/upload-video")
async def upload_exercise_video(
    exercise_name: str = Form(...),
    file: UploadFile = File(...),
    personal: dict = Depends(get_personal_user)
):
    """Upload de vídeo MP4 para um exercício específico"""
    if not file.filename.lower().endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Apenas arquivos MP4 são aceitos")

    exercise_name_clean = (exercise_name or "").strip()
    exercise_name_lower = exercise_name_clean.lower()
    exercise_name_normalized = re.sub(r"\s+", " ", _normalize_text_for_match(exercise_name_clean)).strip()
    
    # Nome seguro para o arquivo
    safe_name = re.sub(r"[^a-z0-9_]+", "_", exercise_name_normalized.replace(" ", "_")).strip("_") or "exercise"
    file_name = f"video_{safe_name}_{uuid.uuid4().hex[:8]}.mp4"
    file_path = UPLOAD_DIR / file_name
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    video_url = f"/uploads/{file_name}"
    
    # Salvar no banco de dados de vídeos de exercícios
    video_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Verificar se já existe vídeo para este exercício
    existing = await db.exercise_videos.find_one({
        "personal_id": personal["id"],
        "$or": [
            {"exercise_name_lower": exercise_name_lower},
            {"exercise_name_normalized": exercise_name_normalized}
        ]
    })
    
    if existing:
        # Remover arquivo antigo
        old_url = existing.get("video_url", "")
        if old_url:
            old_file = old_url.replace("/uploads/", "")
            old_path = UPLOAD_DIR / old_file
            if old_path.exists():
                old_path.unlink()
        
        await db.exercise_videos.update_one(
            {"id": existing["id"]},
            {"$set": {
                "exercise_name": exercise_name_clean,
                "exercise_name_lower": exercise_name_lower,
                "exercise_name_normalized": exercise_name_normalized,
                "video_url": video_url,
                "updated_at": now
            }}
        )
    else:
        await db.exercise_videos.insert_one({
            "id": video_id,
            "exercise_name": exercise_name_clean,
            "exercise_name_lower": exercise_name_lower,
            "exercise_name_normalized": exercise_name_normalized,
            "video_url": video_url,
            "personal_id": personal["id"],
            "created_at": now,
            "updated_at": now
        })
    
    return {"message": "Vídeo enviado com sucesso", "video_url": video_url}


@api_router.get("/exercises/video-mp4/{exercise_name}")
async def get_exercise_video_mp4(exercise_name: str, current_user: dict = Depends(get_current_user)):
    """Retorna a URL do vídeo MP4 de um exercício"""
    personal_id = current_user["id"] if current_user["role"] == "personal" else current_user.get("personal_id")
    exercise_name_clean = (exercise_name or "").strip()
    exercise_name_lower = exercise_name_clean.lower()
    exercise_name_normalized = _normalize_exercise_name_for_match(exercise_name_clean)
    
    # Buscar vídeo do personal
    video = await db.exercise_videos.find_one({
        "personal_id": personal_id,
        "$or": [
            {"exercise_name_lower": exercise_name_lower},
            {"exercise_name_normalized": exercise_name_normalized}
        ]
    }, {"_id": 0, "video_url": 1, "updated_at": 1})

    # Buscar vídeo MP4 na biblioteca de exercícios (fluxo da página Exercícios)
    library_exercise = await _find_best_library_exercise_match(exercise_name_clean, personal_id)
    library_video_url = library_exercise.get("mp4_video_url") if library_exercise else None

    chosen_video_url = None
    if video and library_video_url:
        personal_video_updated = _safe_parse_iso_datetime(video.get("updated_at"))
        library_video_updated = _safe_parse_iso_datetime(library_exercise.get("updated_at"))
        chosen_video_url = (
            library_video_url
            if library_video_updated >= personal_video_updated
            else video.get("video_url")
        )
    elif library_video_url:
        chosen_video_url = library_video_url
    elif video:
        chosen_video_url = video.get("video_url")
    
    if chosen_video_url:
        return {"video_url": chosen_video_url, "type": "mp4"}
    
    # Se não encontrar, retornar None
    return {"video_url": None, "type": None}


@api_router.get("/exercises/videos")
async def list_exercise_videos(personal: dict = Depends(get_personal_user)):
    """Lista todos os vídeos de exercícios do personal"""
    videos = await db.exercise_videos.find(
        {"personal_id": personal["id"]},
        {"_id": 0}
    ).to_list(500)
    
    return {"videos": videos}


@api_router.delete("/exercises/video/{video_id}")
async def delete_exercise_video(video_id: str, personal: dict = Depends(get_personal_user)):
    """Remove um vídeo de exercício"""
    video = await db.exercise_videos.find_one({"id": video_id, "personal_id": personal["id"]})
    if not video:
        raise HTTPException(status_code=404, detail="Vídeo não encontrado")
    
    # Remover arquivo físico
    video_url = video.get("video_url", "")
    if video_url:
        file_name = video_url.replace("/uploads/", "")
        file_path = UPLOAD_DIR / file_name
        if file_path.exists():
            file_path.unlink()
    
    await db.exercise_videos.delete_one({"id": video_id})
    
    return {"message": "Vídeo removido com sucesso"}


# ==================== CÁLCULO DE GASTO CALÓRICO ====================

def calculate_caloric_expenditure(weight_kg: float, reps: int, load_kg: float = 0) -> dict:
    """
    Calcula o gasto calórico estimado baseado em:
    - Volume = carga x repetições
    - Fórmula simplificada: Kcal = (Volume / 1000) * 5 + (reps * 0.5)
    - Com ajuste pelo peso corporal se disponível
    """
    if not reps or reps <= 0:
        return {"calories": 0, "volume": 0}
    
    volume = (load_kg or 0) * reps
    
    # Cálculo base de calorias
    # Aproximação: cada 1000kg de volume = ~5 kcal
    # Cada repetição = ~0.5 kcal de gasto base
    base_calories = (volume / 1000) * 5 + (reps * 0.5)
    
    # Ajuste pelo peso corporal (pessoas mais pesadas gastam mais energia)
    if weight_kg and weight_kg > 0:
        body_factor = weight_kg / 70  # Referência: 70kg
        base_calories *= body_factor
    
    return {
        "calories": round(base_calories, 1),
        "volume": round(volume, 1)
    }


@api_router.post("/calculate-calories")
async def calculate_exercise_calories(
    load_kg: float = Form(...),
    reps: int = Form(...),
    sets: int = Form(1),
    student_weight_kg: Optional[float] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Calcula o gasto calórico estimado para um exercício"""
    if reps <= 0:
        return {"calories_per_set": 0, "total_calories": 0, "total_volume": 0}
    
    # Se peso do aluno não foi fornecido, tentar buscar do perfil
    weight = student_weight_kg
    if not weight:
        # Buscar última avaliação física para pegar o peso
        assessment = await db.assessments.find_one(
            {"student_id": current_user["id"]},
            {"_id": 0, "weight": 1},
            sort=[("date", -1)]
        )
        if assessment and assessment.get("weight"):
            weight = assessment["weight"]
        else:
            weight = 70  # Peso padrão
    
    result = calculate_caloric_expenditure(weight, reps, load_kg)
    
    return {
        "calories_per_set": result["calories"],
        "total_calories": round(result["calories"] * sets, 1),
        "total_volume": round(result["volume"] * sets, 1),
        "weight_used": weight
    }


# ==================== DEVOLUTIVA/FEEDBACK SOLICITAÇÃO ====================

@api_router.post("/checkins/request-feedback/{student_id}")
async def request_student_feedback(
    student_id: str,
    message: Optional[str] = None,
    personal: dict = Depends(get_personal_user)
):
    """Personal solicita feedback/devolutiva do aluno"""
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    request_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Criar solicitação de feedback
    request_doc = {
        "id": request_id,
        "student_id": student_id,
        "personal_id": personal["id"],
        "message": message or "Seu personal solicitou uma devolutiva sobre seus treinos.",
        "status": "pending",
        "created_at": now,
        "responded_at": None
    }
    
    await db.feedback_requests.insert_one(request_doc)
    
    # Criar notificação para o aluno
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": student_id,
        "title": "Devolutiva Solicitada",
        "message": message or "Seu personal solicitou uma devolutiva sobre seus treinos. Por favor, responda na aba de Check-in.",
        "type": "feedback_request",
        "read": False,
        "created_at": now,
        "metadata": {"request_id": request_id}
    })
    
    return {"message": "Solicitação de feedback enviada", "request_id": request_id}


@api_router.get("/checkins/pending-feedback-request")
async def get_pending_feedback_request(current_user: dict = Depends(get_current_user)):
    """Verifica se há solicitação de feedback pendente para o aluno"""
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem verificar solicitações de feedback")
    
    request = await db.feedback_requests.find_one(
        {"student_id": current_user["id"], "status": "pending"},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if request:
        return {"has_pending": True, "request": request}
    
    return {"has_pending": False, "request": None}

@api_router.delete("/workouts/{workout_id}")
async def delete_workout(workout_id: str, personal: dict = Depends(get_personal_user)):
    result = await db.workouts.delete_one({"id": workout_id, "personal_id": personal["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    return {"message": "Treino removido com sucesso"}

@api_router.post("/workouts/{workout_id}/assign")
async def assign_workout_to_student(
    workout_id: str,
    student_id: str,
    personal: dict = Depends(get_personal_user)
):
    student = await db.users.find_one({"id": student_id, "personal_id": personal["id"]})
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")

    workout = await db.workouts.find_one({"id": workout_id, "personal_id": personal["id"]}, {"_id": 0})
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    existing = await db.workouts.find_one(
        {
            "student_id": student_id,
            "name": workout.get("name"),
            "routine_id": workout.get("routine_id")
        },
        {"_id": 0}
    )
    next_version = (existing.get("version", 1) + 1) if existing else 1

    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    new_workout = {
        "id": new_id,
        "name": workout.get("name") or "Treino",
        "student_id": student_id,
        "personal_id": personal["id"],
        "routine_id": workout.get("routine_id"),
        "days": workout.get("days", []),
        "created_at": now,
        "updated_at": now,
        "version": next_version
    }

    await db.workouts.insert_one(new_workout)

    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": student_id,
        "title": "Treino atualizado",
        "message": f"Seu personal enviou um treino: {new_workout['name']}",
        "type": "workout",
        "read": False,
        "created_at": now
    })

    return {"message": "Treino enviado com sucesso", "workout_id": new_id}

# ==================== PROGRESS TRACKING ====================

@api_router.post("/progress", response_model=ProgressResponse)
async def log_progress(progress: ProgressLog, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem registrar progresso")
    
    progress_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    progress_doc = {
        "id": progress_id,
        "student_id": current_user["id"],
        "workout_id": progress.workout_id,
        "exercise_name": progress.exercise_name,
        "day_name": progress.day_name,
        "sets_completed": progress.sets_completed,
        "notes": progress.notes,
        "difficulty": progress.difficulty,
        "logged_at": now
    }
    
    await db.progress.insert_one(progress_doc)
    
    return ProgressResponse(
        id=progress_id,
        student_id=current_user["id"],
        workout_id=progress.workout_id,
        exercise_name=progress.exercise_name,
        day_name=progress.day_name,
        sets_completed=progress.sets_completed,
        notes=progress.notes,
        difficulty=progress.difficulty,
        logged_at=now
    )

@api_router.get("/progress", response_model=List[ProgressResponse])
async def get_progress(
    exercise_name: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
    
    if exercise_name:
        query["exercise_name"] = exercise_name
    
    progress_list = await db.progress.find(query, {"_id": 0}).sort("logged_at", -1).to_list(500)
    
    return [ProgressResponse(
        id=p["id"],
        student_id=p["student_id"],
        workout_id=p["workout_id"],
        exercise_name=p["exercise_name"],
        day_name=p.get("day_name"),
        sets_completed=p["sets_completed"],
        notes=p.get("notes"),
        difficulty=p.get("difficulty"),
        logged_at=p["logged_at"]
    ) for p in progress_list]

@api_router.get("/progress/evolution")
async def get_evolution(
    exercise_name: str,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"exercise_name": exercise_name}
    
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    else:
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
    
    progress_list = await db.progress.find(query, {"_id": 0}).sort("logged_at", 1).to_list(500)
    
    evolution_data = []
    for p in progress_list:
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            total_reps = sum(s.get("reps", 0) for s in p["sets_completed"])
            evolution_data.append({
                "date": p["logged_at"][:10],
                "weight": max_weight,
                "reps": total_reps,
                "exercise": exercise_name
            })
    
    return evolution_data

@api_router.get("/progress/suggestion")
async def get_progress_suggestion(
    exercise_name: str,
    workout_id: Optional[str] = None,
    student_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "student":
        target_student_id = current_user["id"]
    else:
        if not student_id:
            raise HTTPException(status_code=400, detail="student_id é obrigatório para personal")
        student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
        if not student:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        target_student_id = student_id

    progress_list = await db.progress.find(
        {"student_id": target_student_id, "exercise_name": exercise_name},
        {"_id": 0}
    ).sort("logged_at", -1).to_list(3)

    if len(progress_list) < 3:
        return {"eligible": False, "reason": "Poucos registros recentes para sugerir aumento"}

    # Determine target reps from workout, if provided
    target_reps_min = None
    if workout_id:
        workout = await db.workouts.find_one({"id": workout_id, "student_id": target_student_id}, {"_id": 0})
        if workout:
            for day in workout.get("days", []):
                for ex in day.get("exercises", []):
                    if ex.get("name", "").lower().strip() == exercise_name.lower().strip():
                        reps_text = ex.get("reps", "")
                        numbers = re.findall(r"\d+", reps_text)
                        if numbers:
                            target_reps_min = int(numbers[0])
                        break

    def reps_completed_ok(progress_item):
        sets = progress_item.get("sets_completed", [])
        if not sets:
            return False
        if target_reps_min is None:
            return True
        return all((s.get("reps", 0) or 0) >= target_reps_min for s in sets)

    for p in progress_list:
        if p.get("difficulty") is None or p.get("difficulty") > 2:
            return {"eligible": False, "reason": "Dificuldade alta nos últimos treinos"}
        if not reps_completed_ok(p):
            return {"eligible": False, "reason": "Repetições não concluídas na meta"}

    last = progress_list[0]
    if not last.get("sets_completed"):
        return {"eligible": False, "reason": "Sem dados suficientes de carga"}

    current_max = max((s.get("weight", 0) for s in last["sets_completed"]), default=0)
    if current_max <= 0:
        return {"eligible": False, "reason": "Carga atual inválida"}

    increase = max(2.5, round(current_max * 0.05, 2))
    suggested = round(current_max + increase, 1)

    return {
        "eligible": True,
        "reason": "3 treinos seguidos com baixa dificuldade e reps completas",
        "current_max_weight": current_max,
        "increase": increase,
        "suggested_weight": suggested
    }

# ==================== WORKOUT SESSIONS ====================

@api_router.post("/workout-sessions", response_model=WorkoutSessionResponse)
async def create_workout_session(
    session: WorkoutSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem concluir treinos")

    workout = await db.workouts.find_one(
        {"id": session.workout_id, "student_id": current_user["id"], "archived": {"$ne": True}},
        {"_id": 0}
    )
    if not workout:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    # Build metrics from progress logged since the previous completed session
    # for this workout/day.
    last_session_query: Dict[str, Any] = {
        "student_id": current_user["id"],
        "workout_id": session.workout_id
    }
    if session.day_name:
        last_session_query["day_name"] = session.day_name

    previous_sessions = await db.workout_sessions.find(
        last_session_query,
        {"_id": 0, "completed_at": 1}
    ).sort("completed_at", -1).to_list(1)

    previous_completed_at = previous_sessions[0]["completed_at"] if previous_sessions else None

    progress_query: Dict[str, Any] = {
        "student_id": current_user["id"],
        "workout_id": session.workout_id
    }
    if session.day_name:
        progress_query["day_name"] = session.day_name
    if previous_completed_at:
        progress_query["logged_at"] = {"$gt": previous_completed_at}

    progress_entries = await db.progress.find(
        progress_query,
        {"_id": 0, "exercise_name": 1, "sets_completed": 1}
    ).to_list(2000)

    total_volume_kg = 0.0
    total_reps = 0
    total_sets = 0
    exercises_completed = set()

    for entry in progress_entries:
        sets = entry.get("sets_completed", []) or []
        valid_sets_for_exercise = 0

        for s in sets:
            weight = float(s.get("weight", 0) or 0)
            reps = int(s.get("reps", 0) or 0)

            if weight < 0:
                weight = 0
            if reps < 0:
                reps = 0

            total_volume_kg += weight * reps
            total_reps += reps

            if weight > 0 or reps > 0:
                total_sets += 1
                valid_sets_for_exercise += 1

        if valid_sets_for_exercise > 0 and entry.get("exercise_name"):
            exercises_completed.add(entry["exercise_name"])

    total_volume_kg = round(total_volume_kg, 2)
    estimated_calories = int(round(total_volume_kg * 0.045))

    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    session_doc = {
        "id": session_id,
        "student_id": current_user["id"],
        "workout_id": session.workout_id,
        "day_name": session.day_name,
        "notes": session.notes,
        "difficulty": session.difficulty,
        "feedback": session.feedback,
        "recovery_score": session.recovery_score,
        "effort_score": session.effort_score,
        "total_volume_kg": total_volume_kg,
        "total_reps": total_reps,
        "total_sets": total_sets,
        "exercises_completed": len(exercises_completed),
        "estimated_calories": estimated_calories,
        "completed_at": now
    }

    await db.workout_sessions.insert_one(session_doc)
    return WorkoutSessionResponse(**session_doc)

@api_router.get("/workout-sessions", response_model=List[WorkoutSessionResponse])
async def list_workout_sessions(
    student_id: Optional[str] = None,
    workout_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query: Dict[str, Any] = {}

    if current_user["role"] == "personal":
        if student_id:
            student = await db.users.find_one({"id": student_id, "personal_id": current_user["id"]})
            if not student:
                raise HTTPException(status_code=404, detail="Aluno não encontrado")
            query["student_id"] = student_id
        else:
            students = await db.users.find({"personal_id": current_user["id"], "role": "student"}, {"id": 1}).to_list(1000)
            student_ids = [s["id"] for s in students]
            query["student_id"] = {"$in": student_ids}
    else:
        query["student_id"] = current_user["id"]

    if workout_id:
        query["workout_id"] = workout_id

    if start_date or end_date:
        query["completed_at"] = {}
        if start_date:
            query["completed_at"]["$gte"] = start_date
        if end_date:
            query["completed_at"]["$lte"] = end_date + "T23:59:59"

    sessions = await db.workout_sessions.find(query, {"_id": 0}).sort("completed_at", -1).to_list(500)
    return [WorkoutSessionResponse(**s) for s in sessions]

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return [NotificationResponse(
        id=n["id"],
        user_id=n["user_id"],
        title=n["title"],
        message=n["message"],
        type=n["type"],
        read=n["read"],
        created_at=n["created_at"]
    ) for n in notifications]

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    return {"message": "Notificação marcada como lida"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Todas notificações marcadas como lidas"}

# ==================== STATS ====================

@api_router.get("/stats/personal")
async def get_personal_stats(personal: dict = Depends(get_personal_user)):
    students_count = await db.users.count_documents({"personal_id": personal["id"], "role": "student"})
    workouts_count = await db.workouts.count_documents({"personal_id": personal["id"], "archived": {"$ne": True}})
    routines_count = await db.routines.count_documents({"personal_id": personal["id"], "status": "active"})
    
    student_ids = [s["id"] async for s in db.users.find({"personal_id": personal["id"], "role": "student"}, {"id": 1})]
    recent_progress = await db.progress.count_documents({
        "student_id": {"$in": student_ids},
        "logged_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
    })
    
    # Financial stats
    payments = await db.payments.find({"personal_id": personal["id"]}, {"_id": 0}).to_list(1000)
    total_received = sum(p["amount"] for p in payments if p["status"] == "paid")
    total_pending = sum(p["amount"] for p in payments if p["status"] in ["pending", "overdue"])
    
    return {
        "students_count": students_count,
        "workouts_count": workouts_count,
        "routines_count": routines_count,
        "recent_progress": recent_progress,
        "total_received": total_received,
        "total_pending": total_pending
    }

@api_router.get("/stats/student")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    workouts = await db.workouts.find(
        {"student_id": current_user["id"], "archived": {"$ne": True}},
        {"_id": 0}
    ).to_list(10)
    
    total_exercises = sum(len(e) for w in workouts for d in w.get("days", []) for e in [d.get("exercises", [])])
    progress_count = await db.progress.count_documents({"student_id": current_user["id"]})
    
    streak = 0
    today = datetime.now(timezone.utc).date()
    for i in range(30):
        check_date = (today - timedelta(days=i)).isoformat()
        has_progress = await db.progress.find_one({
            "student_id": current_user["id"],
            "logged_at": {"$gte": check_date, "$lt": (today - timedelta(days=i-1)).isoformat() if i > 0 else check_date + "T23:59:59"}
        })
        if has_progress:
            streak += 1
        elif i > 0:
            break
    
    return {
        "total_exercises": total_exercises,
        "progress_logged": progress_count,
        "workout_streak": streak,
        "has_workout": len(workouts) > 0
    }

# ==================== CHAT ====================

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    receiver_id: str
    content: str
    read: bool
    created_at: str

@api_router.post("/chat/messages", response_model=MessageResponse)
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    receiver = await db.users.find_one({"id": message.receiver_id}, {"_id": 0, "password": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinatário não encontrado")
    
    if current_user["role"] == "personal":
        if receiver.get("personal_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Você só pode enviar mensagens para seus alunos")
    else:
        if current_user.get("personal_id") != receiver["id"]:
            raise HTTPException(status_code=403, detail="Você só pode enviar mensagens para seu personal")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    message_doc = {
        "id": message_id,
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "receiver_id": message.receiver_id,
        "content": message.content,
        "read": False,
        "created_at": now
    }
    
    await db.messages.insert_one(message_doc)
    
    await db.notifications.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": message.receiver_id,
        "title": "Nova mensagem",
        "message": f"{current_user['name']}: {message.content[:50]}{'...' if len(message.content) > 50 else ''}",
        "type": "info",
        "read": False,
        "created_at": now
    })
    
    return MessageResponse(**message_doc)

@api_router.get("/chat/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(500)
    
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return [MessageResponse(**m) for m in messages]

@api_router.get("/chat/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "personal":
        students = await db.users.find(
            {"personal_id": current_user["id"], "role": "student"},
            {"_id": 0, "password": 0}
        ).to_list(100)
        
        conversations = []
        for student in students:
            last_msg = await db.messages.find_one(
                {"$or": [
                    {"sender_id": current_user["id"], "receiver_id": student["id"]},
                    {"sender_id": student["id"], "receiver_id": current_user["id"]}
                ]},
                sort=[("created_at", -1)]
            )
            
            unread = await db.messages.count_documents({
                "sender_id": student["id"],
                "receiver_id": current_user["id"],
                "read": False
            })
            
            conversations.append({
                "user_id": student["id"],
                "user_name": student["name"],
                "last_message": last_msg["content"] if last_msg else None,
                "last_message_time": last_msg["created_at"] if last_msg else None,
                "unread_count": unread
            })
        
        return conversations
    else:
        personal = await db.users.find_one(
            {"id": current_user.get("personal_id")},
            {"_id": 0, "password": 0}
        )
        
        if not personal:
            return []
        
        last_msg = await db.messages.find_one(
            {"$or": [
                {"sender_id": current_user["id"], "receiver_id": personal["id"]},
                {"sender_id": personal["id"], "receiver_id": current_user["id"]}
            ]},
            sort=[("created_at", -1)]
        )
        
        unread = await db.messages.count_documents({
            "sender_id": personal["id"],
            "receiver_id": current_user["id"],
            "read": False
        })
        
        return [{
            "user_id": personal["id"],
            "user_name": personal["name"],
            "last_message": last_msg["content"] if last_msg else None,
            "last_message_time": last_msg["created_at"] if last_msg else None,
            "unread_count": unread
        }]

# ==================== EXERCISE VIDEOS ====================

@api_router.get("/exercises/video/{exercise_name}")
async def get_exercise_video_endpoint(exercise_name: str, current_user: dict = Depends(get_current_user)):
    personal_id = current_user["id"] if current_user["role"] == "personal" else current_user.get("personal_id")
    library_exercise = await _find_best_library_exercise_match(exercise_name, personal_id)
    if library_exercise and library_exercise.get("video_url"):
        return {"video_url": normalize_youtube_url(library_exercise.get("video_url"))}
    return {"video_url": resolve_exercise_video_url(exercise_name)}

@api_router.get("/exercises/search")
async def search_exercises(q: str, current_user: dict = Depends(get_current_user)):
    results = []
    q_lower = q.lower()
    
    for name, image_url in EXERCISE_IMAGES.items():
        if q_lower in name:
            results.append({
                "name": name.title(),
                "image_url": image_url
            })
    
    return results[:10]

# ==================== PDF EXPORT ====================

@api_router.get("/reports/student/{student_id}")
async def get_student_report(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    workouts = await db.workouts.find(
        {"student_id": student_id, "archived": {"$ne": True}},
        {"_id": 0}
    ).to_list(10)
    
    progress = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("logged_at", -1).to_list(100)
    
    assessments = await db.assessments.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("date", -1).to_list(10)
    
    total_workouts = len(progress)
    exercises_done = len(set(p["exercise_name"] for p in progress))
    
    evolution = {}
    for p in progress:
        ex_name = p["exercise_name"]
        if ex_name not in evolution:
            evolution[ex_name] = []
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            evolution[ex_name].append({
                "date": p["logged_at"][:10],
                "weight": max_weight
            })
    
    return {
        "student": student,
        "workouts": workouts,
        "progress_count": total_workouts,
        "exercises_count": exercises_done,
        "evolution": evolution,
        "assessments": assessments,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

# ==================== GAMIFICATION ====================

BADGES = {
    "first_workout": {"id": "first_workout", "name": "Primeiro Treino", "description": "Completou seu primeiro treino", "icon": "trophy", "color": "yellow"},
    "streak_3": {"id": "streak_3", "name": "Consistente", "description": "3 dias seguidos de treino", "icon": "flame", "color": "orange"},
    "streak_7": {"id": "streak_7", "name": "Dedicado", "description": "7 dias seguidos de treino", "icon": "fire", "color": "red"},
    "streak_30": {"id": "streak_30", "name": "Imparável", "description": "30 dias seguidos de treino", "icon": "zap", "color": "purple"},
    "weight_up_10": {"id": "weight_up_10", "name": "Força +10", "description": "Aumentou 10kg em um exercício", "icon": "trending-up", "color": "green"},
    "weight_up_25": {"id": "weight_up_25", "name": "Força +25", "description": "Aumentou 25kg em um exercício", "icon": "award", "color": "blue"},
    "exercises_10": {"id": "exercises_10", "name": "Variado", "description": "Registrou progresso em 10 exercícios diferentes", "icon": "grid", "color": "cyan"},
    "workouts_50": {"id": "workouts_50", "name": "Veterano", "description": "50 treinos registrados", "icon": "medal", "color": "gold"},
    "workouts_100": {"id": "workouts_100", "name": "Lenda", "description": "100 treinos registrados", "icon": "crown", "color": "platinum"}
}

async def calculate_badges(student_id: str) -> list:
    earned_badges = []
    
    progress_list = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("logged_at", 1).to_list(1000)
    
    if not progress_list:
        return earned_badges
    
    earned_badges.append(BADGES["first_workout"])
    
    total_workouts = len(progress_list)
    if total_workouts >= 50:
        earned_badges.append(BADGES["workouts_50"])
    if total_workouts >= 100:
        earned_badges.append(BADGES["workouts_100"])
    
    unique_exercises = len(set(p["exercise_name"] for p in progress_list))
    if unique_exercises >= 10:
        earned_badges.append(BADGES["exercises_10"])
    
    dates = sorted(set(p["logged_at"][:10] for p in progress_list))
    max_streak = 1
    current_streak = 1
    for i in range(1, len(dates)):
        prev_date = datetime.fromisoformat(dates[i-1])
        curr_date = datetime.fromisoformat(dates[i])
        if (curr_date - prev_date).days == 1:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 1
    
    if max_streak >= 3:
        earned_badges.append(BADGES["streak_3"])
    if max_streak >= 7:
        earned_badges.append(BADGES["streak_7"])
    if max_streak >= 30:
        earned_badges.append(BADGES["streak_30"])
    
    exercise_progress = {}
    for p in progress_list:
        ex_name = p["exercise_name"]
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            if ex_name not in exercise_progress:
                exercise_progress[ex_name] = {"first": max_weight, "last": max_weight}
            else:
                exercise_progress[ex_name]["last"] = max_weight
    
    max_improvement = 0
    for ex_name, data in exercise_progress.items():
        improvement = data["last"] - data["first"]
        max_improvement = max(max_improvement, improvement)
    
    if max_improvement >= 10:
        earned_badges.append(BADGES["weight_up_10"])
    if max_improvement >= 25:
        earned_badges.append(BADGES["weight_up_25"])
    
    return earned_badges

async def calculate_records(student_id: str) -> dict:
    progress_list = await db.progress.find(
        {"student_id": student_id},
        {"_id": 0}
    ).to_list(1000)
    
    records = {}
    for p in progress_list:
        ex_name = p["exercise_name"]
        if p["sets_completed"]:
            max_weight = max((s.get("weight", 0) for s in p["sets_completed"]), default=0)
            max_reps = max((s.get("reps", 0) for s in p["sets_completed"]), default=0)
            
            if ex_name not in records or max_weight > records[ex_name]["weight"]:
                records[ex_name] = {
                    "weight": max_weight,
                    "reps": max_reps,
                    "date": p["logged_at"][:10]
                }
    
    return records

@api_router.get("/gamification/badges")
async def get_badges(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    badges = await calculate_badges(current_user["id"])
    return {
        "earned": badges,
        "total_available": len(BADGES),
        "earned_count": len(badges)
    }

@api_router.get("/gamification/records")
async def get_records(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Apenas para alunos")
    
    records = await calculate_records(current_user["id"])
    return records

@api_router.get("/gamification/ranking")
async def get_ranking(personal: dict = Depends(get_personal_user)):
    students = await db.users.find(
        {"personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    ranking = []
    for student in students:
        progress_count = await db.progress.count_documents({"student_id": student["id"]})
        
        progress_list = await db.progress.find(
            {"student_id": student["id"]},
            {"logged_at": 1}
        ).sort("logged_at", -1).to_list(100)
        
        streak = 0
        if progress_list:
            dates = sorted(set(p["logged_at"][:10] for p in progress_list), reverse=True)
            today = datetime.now(timezone.utc).date()
            
            for i, date_str in enumerate(dates):
                check_date = today - timedelta(days=i)
                if date_str == check_date.isoformat():
                    streak += 1
                else:
                    break
        
        badges = await calculate_badges(student["id"])
        
        ranking.append({
            "student_id": student["id"],
            "student_name": student["name"],
            "progress_count": progress_count,
            "streak": streak,
            "badges_count": len(badges),
            "score": progress_count * 10 + streak * 5 + len(badges) * 20
        })
    
    ranking.sort(key=lambda x: x["score"], reverse=True)
    
    for i, r in enumerate(ranking):
        r["rank"] = i + 1
    
    return ranking

@api_router.get("/gamification/student/{student_id}")
async def get_student_gamification(student_id: str, personal: dict = Depends(get_personal_user)):
    student = await db.users.find_one(
        {"id": student_id, "personal_id": personal["id"], "role": "student"},
        {"_id": 0, "password": 0}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    badges = await calculate_badges(student_id)
    records = await calculate_records(student_id)
    
    return {
        "student": student,
        "badges": badges,
        "records": records,
        "badges_count": len(badges),
        "total_badges": len(BADGES)
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Personal Trainer API v2.0"}

async def ensure_master_admin_user():
    now = datetime.now(timezone.utc).isoformat()
    admin_user = await find_user_by_email(MASTER_ADMIN_EMAIL, {"_id": 0})

    if admin_user and admin_user.get("role") != "administrador":
        logger.warning("Email do administrador em uso por outro perfil: %s", MASTER_ADMIN_EMAIL)
        return

    admin_doc = {
        "id": admin_user["id"] if admin_user else str(uuid.uuid4()),
        "email": MASTER_ADMIN_EMAIL,
        "name": MASTER_ADMIN_NAME,
        "password": hash_password(MASTER_ADMIN_PASSWORD),
        "role": "administrador",
        "is_approved": True,
        "approved_at": now,
        "approved_by": None,
        "created_at": admin_user.get("created_at", now) if admin_user else now,
    }

    if admin_user:
        await db.users.update_one(
            {"id": admin_user["id"]},
            {"$set": admin_doc}
        )
        logger.info("Conta administrador atualizada: %s", MASTER_ADMIN_EMAIL)
    else:
        await db.users.insert_one(admin_doc)
        logger.info("Conta administrador criada: %s", MASTER_ADMIN_EMAIL)

# ==================== IMPORTAÇÃO DE PLANILHAS ====================

class ImportResult(BaseModel):
    success: bool
    message: str
    imported_count: int
    errors: List[str] = []
    data: Optional[List[Dict[str, Any]]] = None

@api_router.post("/import/cadastros", response_model=ImportResult)
async def import_cadastros_csv(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Importa planilha CSV de cadastros (formato Impacto 4.0)
    Colunas esperadas: Nome, Telefone, Igreja, Data de Cadastro
    """
    if current_user["role"] not in ["personal", "administrador"]:
        raise HTTPException(status_code=403, detail="Apenas personal trainers podem importar cadastros")
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Arquivo deve ser CSV")
    
    try:
        contents = await file.read()
        # Tentar diferentes encodings
        try:
            df = pd.read_csv(BytesIO(contents), encoding='utf-8')
        except Exception:
            df = pd.read_csv(BytesIO(contents), encoding='latin-1')
        
        # Normalizar nomes das colunas
        df.columns = df.columns.str.strip().str.lower()
        
        # Mapear colunas possíveis
        column_mapping = {
            'nome': ['nome', 'name', 'aluno', 'student'],
            'telefone': ['telefone', 'phone', 'celular', 'tel'],
            'data de cadastro': ['data de cadastro', 'data', 'date', 'cadastro', 'created_at']
        }
        
        # Encontrar colunas correspondentes
        found_columns = {}
        for target, options in column_mapping.items():
            for opt in options:
                if opt in df.columns:
                    found_columns[target] = opt
                    break
        
        imported = []
        errors = []
        
        for idx, row in df.iterrows():
            try:
                nome = str(row.get(found_columns.get('nome', ''), '')).strip()
                telefone = str(row.get(found_columns.get('telefone', ''), '')).strip()
                data_cadastro = str(row.get(found_columns.get('data de cadastro', ''), '')).strip()
                
                if not nome or nome.lower() == 'nan':
                    continue
                
                # Criar cadastro no banco
                cadastro = {
                    "id": str(uuid.uuid4()),
                    "nome": nome,
                    "telefone": telefone if telefone.lower() != 'nan' else "",
                    "data_cadastro_original": data_cadastro,
                    "personal_id": current_user["id"],
                    "imported_at": datetime.now(timezone.utc).isoformat(),
                    "source": "csv_import"
                }
                
                await db.cadastros_importados.insert_one(cadastro)
                imported.append({
                    "nome": nome,
                    "telefone": telefone
                })
                
            except Exception as e:
                errors.append(f"Linha {idx + 2}: {str(e)}")
        
        return ImportResult(
            success=True,
            message=f"Importação concluída! {len(imported)} cadastros importados.",
            imported_count=len(imported),
            errors=errors,
            data=imported[:10]  # Retorna amostra dos primeiros 10
        )
        
    except Exception as e:
        logger.error(f"Erro na importação CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")


@api_router.post("/import/treino", response_model=ImportResult)
async def import_treino_xlsx(
    file: UploadFile = File(...),
    workout_name: str = Form("Treino Importado"),
    student_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Importa planilha XLSX de treino
    Colunas esperadas: Dia, Grupo Muscular, Exercício, Séries, Repetições, Carga, Observações
    """
    if current_user["role"] not in ["personal", "administrador"]:
        raise HTTPException(status_code=403, detail="Apenas personal trainers podem importar treinos")
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Arquivo deve ser Excel (.xlsx ou .xls)")
    
    try:
        contents = await file.read()
        df = pd.read_excel(BytesIO(contents))
        
        # Normalizar nomes das colunas
        df.columns = df.columns.str.strip().str.lower()
        
        # Mapear colunas possíveis
        column_mapping = {
            'dia': ['dia', 'day', 'weekday'],
            'grupo muscular': ['grupo muscular', 'grupo', 'muscle group', 'muscular'],
            'exercicio': ['exercício', 'exercicio', 'exercise', 'nome'],
            'series': ['séries', 'series', 'sets'],
            'repeticoes': ['repetições', 'repeticoes', 'reps', 'repetitions'],
            'carga': ['carga', 'load', 'peso', 'weight'],
            'observacoes': ['observações', 'observacoes', 'obs', 'notes', 'notas']
        }
        
        # Encontrar colunas correspondentes
        found_columns = {}
        for target, options in column_mapping.items():
            for opt in options:
                if opt in df.columns:
                    found_columns[target] = opt
                    break
        
        # Agrupar exercícios por dia
        days_data = {}
        errors = []
        
        for idx, row in df.iterrows():
            try:
                dia = str(row.get(found_columns.get('dia', ''), '')).strip()
                grupo = str(row.get(found_columns.get('grupo muscular', ''), '')).strip()
                exercicio = str(row.get(found_columns.get('exercicio', ''), '')).strip()
                series = row.get(found_columns.get('series', ''), 3)
                repeticoes = str(row.get(found_columns.get('repeticoes', ''), '10-12')).strip()
                carga = str(row.get(found_columns.get('carga', ''), 'Moderada')).strip()
                observacoes = str(row.get(found_columns.get('observacoes', ''), '')).strip()
                
                if not exercicio or exercicio.lower() == 'nan':
                    continue
                
                # Normalizar dia
                if dia.lower() == 'nan' or not dia:
                    dia = "Dia Único"
                
                if dia not in days_data:
                    days_data[dia] = []
                
                # Converter séries para int
                try:
                    series_int = int(float(series)) if str(series).lower() != 'nan' else 3
                except (ValueError, TypeError):
                    series_int = 3
                
                exercise_data = {
                    "name": exercicio,
                    "sets": series_int,
                    "reps": repeticoes if repeticoes.lower() != 'nan' else "10-12",
                    "rest": "60s",
                    "muscle_group": grupo if grupo.lower() != 'nan' else "",
                    "load": carga if carga.lower() != 'nan' else "Moderada",
                    "notes": observacoes if observacoes.lower() != 'nan' else "",
                    "image_url": get_exercise_image(exercicio)
                }
                
                days_data[dia].append(exercise_data)
                
            except Exception as e:
                errors.append(f"Linha {idx + 2}: {str(e)}")
        
        # Criar estrutura do treino
        days = []
        for day_name, exercises in days_data.items():
            days.append({
                "day_name": day_name,
                "exercises": exercises
            })
        
        # Criar o treino no banco
        workout = {
            "id": str(uuid.uuid4()),
            "name": workout_name,
            "personal_id": current_user["id"],
            "student_id": student_id,
            "days": days,
            "version": 1,
            "status": "active",
            "imported_from": "xlsx",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.workouts.insert_one(workout)
        
        total_exercises = sum(len(d["exercises"]) for d in days)
        
        return ImportResult(
            success=True,
            message=f"Treino importado! {len(days)} dias com {total_exercises} exercícios.",
            imported_count=total_exercises,
            errors=errors,
            data=[{"workout_id": workout["id"], "days": len(days), "exercises": total_exercises}]
        )
        
    except Exception as e:
        logger.error(f"Erro na importação Excel: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")


@api_router.get("/cadastros-importados")
async def list_cadastros_importados(
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    """Lista cadastros importados do personal logado"""
    if current_user["role"] not in ["personal", "administrador"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    query = {"personal_id": current_user["id"]}
    if current_user["role"] == "administrador":
        query = {}
    
    cadastros = await db.cadastros_importados.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.cadastros_importados.count_documents(query)
    
    # Remover _id do MongoDB
    for c in cadastros:
        c.pop("_id", None)
    
    return {"cadastros": cadastros, "total": total}


@api_router.delete("/cadastros-importados/{cadastro_id}")
async def delete_cadastro_importado(
    cadastro_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove um cadastro importado"""
    if current_user["role"] not in ["personal", "administrador"]:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    result = await db.cadastros_importados.delete_one({
        "id": cadastro_id,
        "personal_id": current_user["id"]
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cadastro não encontrado")
    
    return {"message": "Cadastro removido com sucesso"}


async def seed_system_exercises():
    """Seed all system exercises into exercise_library if not already present"""
    # Collect all unique exercise names from EXERCISE_IMAGES and EXERCISE_VIDEOS
    all_exercises = {}
    
    # Map exercise names to their categories
    EXERCISE_CATEGORY_MAP = {
        "supino reto": "PEITORAL", "supino inclinado": "PEITORAL", "supino declinado": "PEITORAL",
        "supino inclinado com halter": "PEITORAL",
        "crucifixo": "PEITORAL", "crossover": "PEITORAL", "flexão": "PEITORAL",
        "puxada": "DORSAL", "puxada frontal": "DORSAL", "remada": "DORSAL",
        "remada curvada": "DORSAL", "remada baixa": "DORSAL", "pulldown": "DORSAL",
        "desenvolvimento": "OMBRO", "elevação lateral": "OMBRO", "elevação frontal": "OMBRO",
        "rosca": "BÍCEPS", "rosca direta": "BÍCEPS", "rosca alternada": "BÍCEPS",
        "rosca martelo": "BÍCEPS", "rosca scott": "BÍCEPS",
        "tríceps": "TRÍCEPS", "tríceps pulley": "TRÍCEPS", "tríceps corda": "TRÍCEPS",
        "tríceps testa": "TRÍCEPS", "tríceps francês": "TRÍCEPS",
        "agachamento": "INFERIORES", "leg press": "INFERIORES",
        "extensora": "INFERIORES", "flexora": "INFERIORES",
        "cadeira extensora": "INFERIORES", "cadeira flexora": "INFERIORES",
        "stiff": "INFERIORES", "levantamento terra": "INFERIORES",
        "panturrilha": "INFERIORES", "gêmeos": "INFERIORES",
        "abdominal": "ABDÔMEN", "abdominal canivete": "ABDÔMEN",
        "abdominal com corda na polia": "ABDÔMEN",
        "prancha": "ABDÔMEN", "crunch": "ABDÔMEN",
    }
    
    for name in set(list(EXERCISE_IMAGES.keys()) + list(EXERCISE_VIDEOS.keys())):
        name_title = name.title()
        all_exercises[name] = {
            "name": name_title,
            "category": EXERCISE_CATEGORY_MAP.get(name, "FUNCIONAL"),
            "image_url": EXERCISE_IMAGES.get(name),
            "video_url": EXERCISE_VIDEOS.get(name),
        }
    
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0
    for name_lower, data in all_exercises.items():
        existing = await db.exercise_library.find_one({"name": {"$regex": f"^{re.escape(data['name'])}$", "$options": "i"}})
        if not existing:
            exercise_doc = {
                "id": str(uuid.uuid4()),
                "name": data["name"],
                "category": data["category"],
                "description": None,
                "image_url": data["image_url"],
                "video_url": data["video_url"],
                "mp4_video_url": None,
                "instructions": None,
                "muscles_worked": None,
                "personal_id": None,
                "is_system": True,
                "created_at": now,
            }
            await db.exercise_library.insert_one(exercise_doc)
            inserted += 1
    
    if inserted > 0:
        print(f"[SEED] {inserted} exercícios do sistema inseridos na biblioteca")


# ==================== RELATO SEMANAL MODELS ====================

class RelatoSemanalCreate(BaseModel):
    # Dieta
    dieta_aderencia: Optional[int] = Field(default=None, ge=0, le=100)
    dieta_qualidade: Optional[str] = None  # Excelente, Boa, Regular, Ruim
    dieta_relato: Optional[str] = None

    # Treino
    treino_aderencia: Optional[int] = Field(default=None, ge=0, le=100)
    treino_realizados: Optional[int] = None
    treino_total_planejados: Optional[int] = None
    treino_progressao_carga: Optional[bool] = None
    treino_relato: Optional[str] = None

    # Sono
    sono_media_horas: Optional[float] = None
    sono_qualidade: Optional[str] = None  # Excelente, Boa, Regular, Ruim
    sono_relato: Optional[str] = None

    # Bem-estar
    bem_estar_sentimento: Optional[str] = None  # Muito bem, Bem, Normal, Mal
    bem_estar_percepcoes: Optional[List[str]] = None
    bem_estar_relato: Optional[str] = None

    # Dificuldades
    dificuldades: Optional[List[str]] = None
    dificuldades_descricao: Optional[str] = None

    # Metricas de treino da semana
    calorias_semana: Optional[float] = None
    carga_total_semana: Optional[float] = None
    repeticoes_semana: Optional[int] = None

class RelatoSemanalResponse(BaseModel):
    id: str
    student_id: str
    personal_id: str
    week_start: str
    dieta_aderencia: Optional[int] = None
    dieta_qualidade: Optional[str] = None
    dieta_relato: Optional[str] = None
    treino_aderencia: Optional[int] = None
    treino_realizados: Optional[int] = None
    treino_total_planejados: Optional[int] = None
    treino_progressao_carga: Optional[bool] = None
    treino_relato: Optional[str] = None
    sono_media_horas: Optional[float] = None
    sono_qualidade: Optional[str] = None
    sono_relato: Optional[str] = None
    bem_estar_sentimento: Optional[str] = None
    bem_estar_percepcoes: Optional[List[str]] = None
    bem_estar_relato: Optional[str] = None
    dificuldades: Optional[List[str]] = None
    dificuldades_descricao: Optional[str] = None
    score_final: Optional[float] = None
    score_dieta: Optional[float] = None
    score_treino: Optional[float] = None
    score_sono: Optional[float] = None
    score_bem_estar: Optional[float] = None
    calorias_semana: Optional[float] = None
    carga_total_semana: Optional[float] = None
    repeticoes_semana: Optional[int] = None
    created_at: str
    updated_at: str

def calcular_score_relato(relato: dict) -> dict:
    qualidade_map = {"Excelente": 100, "Boa": 75, "Regular": 50, "Ruim": 25}
    sentimento_map = {"Muito bem": 100, "Bem": 75, "Normal": 50, "Mal": 25}

    dieta_pct = relato.get("dieta_aderencia") or 0
    score_dieta = round(dieta_pct * 0.40, 2)

    treino_pct = relato.get("treino_aderencia") or 0
    score_treino = round(treino_pct * 0.30, 2)

    sono_q = relato.get("sono_qualidade") or ""
    sono_pct = qualidade_map.get(sono_q, 0)
    horas = relato.get("sono_media_horas") or 0
    if horas >= 7:
        horas_pct = 100
    elif horas >= 6:
        horas_pct = 80
    elif horas >= 5:
        horas_pct = 60
    else:
        horas_pct = 30
    sono_combined = (sono_pct + horas_pct) / 2 if sono_pct else horas_pct
    score_sono = round(sono_combined * 0.20, 2)

    sentimento = relato.get("bem_estar_sentimento") or ""
    bem_pct = sentimento_map.get(sentimento, 0)
    score_bem_estar = round(bem_pct * 0.10, 2)

    score_final = round(score_dieta + score_treino + score_sono + score_bem_estar, 1)

    return {
        "score_final": score_final,
        "score_dieta": score_dieta,
        "score_treino": score_treino,
        "score_sono": score_sono,
        "score_bem_estar": score_bem_estar,
    }

def _get_week_start(date: datetime) -> str:
    monday = date - timedelta(days=date.weekday())
    return monday.strftime("%Y-%m-%d")

# ==================== RELATO SEMANAL ROUTES ====================

@api_router.post("/relatos", response_model=RelatoSemanalResponse)
async def criar_relato_semanal(
    relato: RelatoSemanalCreate,
    current_user: dict = Depends(get_current_user)
):
    """Aluno cria ou atualiza relato da semana atual."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos podem criar relatos")

    now = datetime.now(timezone.utc)
    week_start = _get_week_start(now)
    student_id = current_user["id"]
    personal_id = current_user.get("personal_id", "")

    existing = await db.relatos_semanais.find_one(
        {"student_id": student_id, "week_start": week_start},
        {"_id": 0}
    )

    relato_dict = relato.dict()
    scores = calcular_score_relato(relato_dict)
    now_iso = now.isoformat()

    if existing:
        update_data = {**relato_dict, **scores, "updated_at": now_iso}
        await db.relatos_semanais.update_one(
            {"student_id": student_id, "week_start": week_start},
            {"$set": update_data}
        )
        updated = await db.relatos_semanais.find_one(
            {"student_id": student_id, "week_start": week_start},
            {"_id": 0}
        )
        return RelatoSemanalResponse(**updated)
    else:
        relato_id = str(uuid.uuid4())
        doc = {
            "id": relato_id,
            "student_id": student_id,
            "personal_id": personal_id,
            "week_start": week_start,
            **relato_dict,
            **scores,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.relatos_semanais.insert_one(doc)
        created = await db.relatos_semanais.find_one({"id": relato_id}, {"_id": 0})
        return RelatoSemanalResponse(**created)

@api_router.get("/relatos/meu-relato-atual")
async def get_meu_relato_atual(current_user: dict = Depends(get_current_user)):
    """Retorna o relato da semana atual do aluno logado."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos")

    now = datetime.now(timezone.utc)
    week_start = _get_week_start(now)
    relato = await db.relatos_semanais.find_one(
        {"student_id": current_user["id"], "week_start": week_start},
        {"_id": 0}
    )
    if not relato:
        return None
    return RelatoSemanalResponse(**relato)

@api_router.get("/relatos/historico", response_model=List[RelatoSemanalResponse])
async def get_meu_historico_relatos(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=12, ge=1, le=52)
):
    """Retorna historico de relatos do aluno logado."""
    if current_user.get("role") != "student":
        raise HTTPException(status_code=403, detail="Apenas alunos")

    relatos = await db.relatos_semanais.find(
        {"student_id": current_user["id"]},
        {"_id": 0}
    ).sort("week_start", -1).limit(limit).to_list(limit)

    return [RelatoSemanalResponse(**r) for r in relatos]

@api_router.get("/relatos/personal/overview")
async def get_relatos_overview_personal(
    current_user: dict = Depends(get_personal_user)
):
    """Overview de todos os alunos com metricas do relato semanal mais recente."""
    personal_id = current_user["id"]

    students_list = await db.users.find(
        {"personal_id": personal_id, "role": "student"},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "is_active": 1}
    ).to_list(200)

    now = datetime.now(timezone.utc)
    current_week = _get_week_start(now)

    result = []
    for student in students_list:
        sid = student["id"]

        relatos = await db.relatos_semanais.find(
            {"student_id": sid},
            {"_id": 0}
        ).sort("week_start", -1).limit(2).to_list(2)

        latest = relatos[0] if relatos else None
        previous = relatos[1] if len(relatos) > 1 else None

        has_current_week = latest and latest.get("week_start") == current_week

        def evo(curr, prev):
            if curr is None or prev is None:
                return None
            if curr > prev:
                return "up"
            if curr < prev:
                return "down"
            return "stable"

        cal_evo = evo(
            latest.get("calorias_semana") if latest else None,
            previous.get("calorias_semana") if previous else None
        )
        carga_evo = evo(
            latest.get("carga_total_semana") if latest else None,
            previous.get("carga_total_semana") if previous else None
        )
        reps_evo = evo(
            latest.get("repeticoes_semana") if latest else None,
            previous.get("repeticoes_semana") if previous else None
        )

        result.append({
            "student_id": sid,
            "student_name": student["name"],
            "student_email": student.get("email", ""),
            "is_active": student.get("is_active", True),
            "has_relato_semana_atual": has_current_week,
            "latest_relato": {
                "id": latest["id"],
                "week_start": latest.get("week_start"),
                "score_final": latest.get("score_final"),
                "calorias_semana": latest.get("calorias_semana"),
                "carga_total_semana": latest.get("carga_total_semana"),
                "repeticoes_semana": latest.get("repeticoes_semana"),
                "dieta_aderencia": latest.get("dieta_aderencia"),
                "treino_aderencia": latest.get("treino_aderencia"),
            } if latest else None,
            "evolution": {
                "calorias": cal_evo,
                "carga": carga_evo,
                "repeticoes": reps_evo,
            },
        })

    result.sort(key=lambda x: (0 if x["has_relato_semana_atual"] else 1, x["student_name"]))
    return result

@api_router.get("/relatos/personal/aluno/{student_id}", response_model=List[RelatoSemanalResponse])
async def get_relatos_aluno_personal(
    student_id: str,
    current_user: dict = Depends(get_personal_user),
    limit: int = Query(default=12, ge=1, le=52)
):
    """Personal ve todos os relatos de um aluno especifico."""
    student = await db.users.find_one(
        {"id": student_id, "personal_id": current_user["id"]},
        {"_id": 0, "id": 1}
    )
    if not student:
        raise HTTPException(status_code=404, detail="Aluno nao encontrado")

    relatos = await db.relatos_semanais.find(
        {"student_id": student_id},
        {"_id": 0}
    ).sort("week_start", -1).limit(limit).to_list(limit)

    return [RelatoSemanalResponse(**r) for r in relatos]


# Include router and add CORS
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_initialize():
    await ensure_master_admin_user()
    await seed_system_exercises()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
