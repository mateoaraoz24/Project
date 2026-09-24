from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from typing import Optional, Any, List
from datetime import date, datetime, timedelta, timezone, time
    
import asyncpg
from fastapi.responses import JSONResponse
import os
import uuid
from supabase import create_client
import traceback
from dotenv import load_dotenv
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, Security, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.fatSecret import get_food_by_name, search_food, get_food
import asyncio
from fastapi.encoders import jsonable_encoder
from rapidfuzz import fuzz
from deep_translator import GoogleTranslator
from decimal import Decimal

app = FastAPI(title="AlekaiApp Backend")
load_dotenv()
security = HTTPBearer()
database_url = os.getenv("DATABASE_URL")
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_service_key)
BUCKET_NAME = "food_images"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15)
)

REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)
)

if not database_url:
        raise Exception("DATABASE_URL not found")
    
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc)+ timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "type": "access"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc)+ timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    
        return {"user_id": payload["user_id"],}

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
def calculate_macros(serving, grams):
    serving_amount = float(serving["metric_serving_amount"])
    factor = grams / serving_amount
    return {
        "calories": round(float(serving["calories"]) * factor),
        "protein": round(float(serving["protein"]) * factor, 1),
        "carbs": round(float(serving["carbohydrate"]) * factor, 1),
        "fat": round(float(serving["fat"]) * factor, 1),
    }
  
def calculate_age(birth_date):
  today = date.today()
  return (
      today.year
      - birth_date.year
      - (
          (today.month, today.day)
          < (birth_date.month, birth_date.day)
      )
    )
  
def calculate_macros_user(weight, height, age, gender, activity_level, training_type, training_days, goal_intensity, goal):
    if gender == "male":
        bmr = 10 * float(weight) + 6.25 * float(height) - 5 * float(age) + 5 
    else:
        bmr = 10 * float(weight) + 6.25 * float(height) - 5 * float(age) - 161
    
    activity_factors = {
        "sedentary": 1.2,     
        "quiet": 1.375,       
        "active": 1.55,        
        "veryActive": 1.725    
    }
    intensity_map = {
        "light": 250,
        "moderate": 450,
        "aggressive": 600
    }
    
    factor = activity_factors.get(activity_level, 1.2)
    maintenance_kcal = bmr * factor
    
    if training_type == "none" or training_days == 0:
        base_factor = 1.4
        max_factor = 1.6
    elif training_type == "cardio":
        base_factor = 1.5 if training_days < 4 else 1.6
        max_factor = 1.7
    else:
        if training_days >= 4:
            base_factor = 1.8 
            max_factor = 2.0 
        elif training_days >= 2:
            base_factor = 1.8  
            max_factor = 2.0
        else:
            base_factor = 1.6 
            max_factor = 1.8
            
    adjustment = intensity_map.get(goal_intensity, 450)
    bmi = float(weight) / ((height/100) ** 2)
    message = None

    if goal == "bulk":
        target_kcal = maintenance_kcal + adjustment
    elif goal == "deficit":
        target_kcal = maintenance_kcal - adjustment
    else:
        target_kcal = maintenance_kcal

    protein = float(weight) * base_factor
    fat = max(float(weight) * 0.9, 45.0)
    carbs = (target_kcal - protein * 4 - fat * 9) / 4

    if (bmi < 18.5 and goal == "deficit") or carbs < 50 or fat < 45:
        goal = "recomp"
        target_kcal = maintenance_kcal
        carbs = (target_kcal - protein * 4 - fat * 9) / 4
        message = "Con tus datos no es para nada recomendable un déficit calórico, prueba una recomposición corporal"
 
    return {
        "maintenance_kcal": round(maintenance_kcal),
        "target_kcal": round(target_kcal),
        "protein": round(protein),
        "carbs": round(carbs),
        "fat": round(fat),
        "message": message,
        "bmi": round(bmi, 1),
        "goal": goal,
        "base_factor": base_factor,
        "max_factor": max_factor
    }
 
def get_protein_factor(
    kcal_burned: float, 
    base_factor: float, 
    max_factor: float, 
    training_type: str
) -> float:
    kcal_limits = {
        "gym": 700.0,     
        "both": 850.0,     
        "cardio": 1000.0,  
        "none": 500.0     
    }
    
    max_kcal = kcal_limits.get(training_type, 700.0)
    margin = max_factor - base_factor
    
    if margin <= 0:
        return round(base_factor, 3)
    
    safe_kcal = min(float(kcal_burned), max_kcal)
    progress = safe_kcal / max_kcal
    factor = base_factor + (margin * progress)
    
    return round(factor, 3)

def clean_json(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime, date, time)):
        return obj.isoformat() if hasattr(obj, 'isoformat') else str(obj)
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_json(v) for v in obj]
    return obj

def calculate_sleep_duration(bedtime_str: str, wake_time_str: str) -> int:
    bedtime = datetime.strptime(bedtime_str, "%H:%M")
    wake_time = datetime.strptime(wake_time_str, "%H:%M")
    if wake_time <= bedtime:
        wake_time += timedelta(days=1)
    delta = wake_time - bedtime
    return int(delta.total_seconds() / 60)

async def check_and_update_pr(conn, user_id, exercise_id, weight, reps, set_id, achieved_at):
    volume = weight * reps
    current_max_weight = await conn.fetchval("""
        SELECT value FROM personal_records
        WHERE user_id = $1 AND exercise_id = $2 AND record_type = 'max_weight'
    """, user_id, exercise_id)

    if current_max_weight is None or weight > float(current_max_weight):
        await conn.execute("""
            INSERT INTO personal_records (user_id, exercise_id, record_type, value, session_set_id, achieved_at)
            VALUES ($1, $2, 'max_weight', $3, $4, $5)
            ON CONFLICT (user_id, exercise_id, record_type)
            DO UPDATE SET value = $3, session_set_id = $4, achieved_at = $5
        """, user_id, exercise_id, weight, set_id, achieved_at)

    current_max_volume = await conn.fetchval("""
        SELECT value FROM personal_records
        WHERE user_id = $1 AND exercise_id = $2 AND record_type = 'max_volume'
    """, user_id, exercise_id)

    if current_max_volume is None or volume > float(current_max_volume):
        await conn.execute("""
            INSERT INTO personal_records (user_id, exercise_id, record_type, value, session_set_id, achieved_at)
            VALUES ($1, $2, 'max_volume', $3, $4, $5)
            ON CONFLICT (user_id, exercise_id, record_type)
            DO UPDATE SET value = $3, session_set_id = $4, achieved_at = $5
        """, user_id, exercise_id, volume, set_id, achieved_at)

async def get_connection():
    return await asyncpg.connect(database_url, statement_cache_size=0)

class userSignUpTypes(BaseModel):
    username: str
    email: EmailStr
    password: str
    gender: str
    birthDate: date
    device_id: str

class userLoginTypes(BaseModel):
    email: EmailStr
    password: str
    device_id: str
    
class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str
    
class HabitCreate(BaseModel):
    name: str
    frequency: str
    days: list[int] = []
    
class FoodRequest(BaseModel):
    display_name: str
    search_name: str
    estimated_grams: float
    confidence: float

class AnalyzeFoodRequest(BaseModel):
    is_food: bool
    meal_name: str
    foods: list[FoodRequest]
    
class UserPhysiqueRequest(BaseModel):
    height: float
    height_unit: str
    weight: float
    weight_unit: str
    goal: str
    goal_intensity: str
    activity_level: str
    training_days: int
    training_duration: int
    training_type: str
    
class IngredientItem(BaseModel):
    display_name: str
    grams: int
    calories: int
    protein: float
    carbs: float
    fat: float
    food_id: Optional[str] = None

class SaveMealRequest(BaseModel):
    meal_name: str
    meal_type: str
    image_url: Optional[str] = None
    date: Optional[str] = None
    foods: List[IngredientItem]
    
class RoutineExerciseInput(BaseModel):
    exercise_id: int
    target_sets: int = 3
    rest_seconds: int = 90  
    notes: Optional[str] = None

class CreateRoutineRequest(BaseModel):
    name: str
    exercises: List[RoutineExerciseInput]
    
class SessionSetInput(BaseModel):
    set_number: int
    set_type: str = "normal"
    weight: Optional[float] = None
    reps: Optional[int] = None
    rpe: Optional[float] = None

class SessionExerciseInput(BaseModel):
    exercise_id: int
    order_index: int
    notes: Optional[str] = None
    sets: List[SessionSetInput]

class CreateSessionRequest(BaseModel):
    routine_id: Optional[int] = None
    name: str
    started_at: datetime
    finished_at: datetime
    duration_seconds: int
    notes: Optional[str] = None
    exercises: List[SessionExerciseInput]
    
class LogActivityRequest(BaseModel):
    activity_id: int
    duration_minutes: int
    
class SleepLogRequest(BaseModel):
    date: str  
    bedtime: str 
    wake_time: str  
    quality: int
    notes: Optional[str] = None
    
@app.post("/create-user")
async def createUser(user: userSignUpTypes):
    username = user.username.strip()
    email = user.email.strip().lower()
    password = user.password.strip()
    device_id = (user.device_id or "unknown_device").strip().lower()
    if len(username)<3 or len(username)>12:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="El nombre de usuario debe tener de 3 a 12 caracteres"
            ).model_dump()
        )
    if len(password)<8 or len(password)>12:
         return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="La contraseña debe tener de 8 a 12 caractere"
            ).model_dump()
        )
    if user.gender not in ["male", "female"]:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Género inválido"
            ).model_dump()
        )
    if user.birthDate > date.today():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Tu fecha de nacimiento no puede ser del futuro"
            ).model_dump()
        )
        
    age = calculate_age(user.birthDate)
    if age < 10 or age > 120:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Edad inválida"
            ).model_dump()
        )
    hashed_password = pwd_context.hash(password)
    conn = None
    
    try:
        conn = await get_connection()
        result = await conn.fetchrow("""
            INSERT INTO users(username, email, password, gender, birth_date)
            VALUES ($1,$2,$3,$4,$5)
            RETURNING id
        """, username, email, hashed_password, user.gender, user.birthDate)
        user_id=result["id"]
        user_data= {
            "user_id":user_id,
        }
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        await conn.execute("""
            INSERT INTO user_sessions(
                user_id,
                refresh_token,
                expires_at,
                device_id
            )
            VALUES ($1, $2, $3, $4)
        """,
            user_id,
            refresh_token,
            datetime.now(timezone.utc)+ timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            device_id
        )
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=ApiResponse(
               success=True,
                message = "User created successfully",
                data={
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "username": username, 
                    "email": email ,
                    "user_id":user_id
                }
            ).model_dump()
        )
    except asyncpg.exceptions.UniqueViolationError:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content=ApiResponse(
                success=False,
                message="El nombre de usuario o email ya esta en uso"
            ).model_dump()
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Error interno del servidor"
            ).model_dump()
        )
    finally:
        if conn:
            await conn.close()
            
@app.post("/login")
async def loginUser(user: userLoginTypes):
    email = user.email.strip().lower()
    password = user.password.strip()
    device_id = (user.device_id or "unknown_device").strip().lower()
    conn = None
    try:
        conn = await get_connection()
        row = await conn.fetchrow("""
            SELECT id, username, email, password FROM users WHERE email = $1
        """, email)
        if not row:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=ApiResponse(
                    success=False,
                    message="Usuario no encontrado"
                ).model_dump()
            )
        password_valid = pwd_context.verify(password, row["password"])
        if not password_valid:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content=ApiResponse(
                    success=False,
                    message="Contraseña incorrecta"
                ).model_dump()
            )
        user_data = {
            "user_id":row["id"],
        }
        access_token = create_access_token(user_data)
        refresh_token = create_refresh_token(user_data)
        
        await conn.execute("""
            UPDATE user_sessions
            SET is_revoked = TRUE
            WHERE user_id = $1
            AND device_id = $2
        """,
            row["id"],
            device_id
        )
        await conn.execute("""
            INSERT INTO user_sessions(
                user_id,
                refresh_token,
                expires_at,
                device_id
            )
            VALUES ($1, $2, $3, $4)
            """,
            row["id"],
            refresh_token,
            datetime.now(timezone.utc)+ timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            device_id
        )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Login exitoso",
                data={
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "bearer",
                    "username": row["username"],
                    "email": row["email"],
                    "user_id":row["id"]
                }
            ).model_dump()
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Error interno"
            ).model_dump()
        )
    finally:
        if conn:
            await conn.close()
            
@app.post("/refresh")
async def refresh_token(data: RefreshRequest):
    token = data.refresh_token
    conn = None
    try:
        conn = await get_connection()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Tipo de token inválido")

        session = await conn.fetchrow("""
            SELECT * FROM user_sessions
            WHERE refresh_token = $1 AND user_id = $2
        """, token, payload["user_id"])

        if not session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión no encontrada")
        if session["is_revoked"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión revocada")
        if session["expires_at"] < datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sesión expirada")

        user_data = {"user_id": payload["user_id"]}
        new_access_token = create_access_token(user_data)
        new_refresh_token = create_refresh_token(user_data)

        await conn.execute("""
            UPDATE user_sessions SET is_revoked = TRUE
            WHERE id = $1 AND device_id = $2
        """, session["id"], session["device_id"])

        await conn.execute("""
            INSERT INTO user_sessions (user_id, refresh_token, device_id, expires_at)
            VALUES ($1, $2, $3, $4)
        """,
            session["user_id"],
            new_refresh_token,
            session["device_id"],
            datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Token renovado con éxito",
                data={
                    "access_token": new_access_token,
                    "refresh_token": new_refresh_token,
                    "token_type": "bearer"
                }
            ).model_dump()
        )
    except HTTPException as e:
        return JSONResponse(
            status_code=e.status_code,
            content=ApiResponse(success=False, message=e.detail).model_dump()
        )
    except JWTError:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content=ApiResponse(success=False, message="Token de refresco inválido o expirado").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(success=False, message="Error al renovar el token").model_dump()
        )
    finally:
        if conn:
            await conn.close()
                 
@app.post("/logout")
async def logout(data: LogoutRequest, current_user=Depends(get_current_user)):
    conn = None
    try:
        conn = await get_connection()
        result = await conn.execute("""
            UPDATE user_sessions
            SET is_revoked = TRUE
            WHERE refresh_token = $1
            AND user_id= $2
        """, data.refresh_token, current_user["user_id"])
        if result == "UPDATE 0":
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=ApiResponse(success=False, message="Sesión no encontrada").model_dump()
            )
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Usuario deslogueado").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(success=False, message="Error al cerrar sesión").model_dump()
        )
    finally:
        if conn:
            await conn.close()

@app.get("/me")
async def me(current_user=Depends(get_current_user)):
    conn = None
    try:
        conn = await get_connection()
        user = await conn.fetchrow("""
            SELECT
                id,
                username,
                gender,
                birth_date
            FROM users
            WHERE id = $1
        """, current_user["user_id"])
        physique = await conn.fetchrow("""
            SELECT
                height,
                current_weight,
                activity_level,
                goal,
                goal_intensity,
                training_days,
                training_duration,
                training_type
            FROM user_physique
            WHERE user_id = $1
        """, current_user["user_id"])
        if physique:
            age = calculate_age(user["birth_date"])
            nutrition = calculate_macros_user(
               weight=float(physique["current_weight"]),
               height=float(physique["height"]),
               age=age,
               gender=user["gender"],
               activity_level=physique["activity_level"],
               training_type=physique["training_type"],
               training_days=physique["training_days"],
               goal_intensity=physique["goal_intensity"],
               goal=physique["goal"],
            )
            physique_data = {
                "height": float(physique["height"]),
                "current_weight": float(physique["current_weight"]),
                "activity_level": physique["activity_level"],
                "goal": nutrition["goal"],
                "goal_intensity": physique["goal_intensity"],
                "training_days": physique["training_days"],
                "training_duration": physique["training_duration"],
                "training_type": physique["training_type"],
            }
        else:
            physique_data = None
            nutrition = None
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Usuario recuperado",
                data=jsonable_encoder({
                    "user": {
                        "id": user["id"],
                        "username": user["username"],
                        "gender": user["gender"],
                        "birth_date": user["birth_date"].isoformat()
                    },
                    "physique": physique_data,
                    "nutrition": nutrition
                })
        ).model_dump()
)

    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Error interno del servidor"
            ).model_dump()
        )
    finally:
        if conn:
            await conn.close()

@app.post("/habit")
async def create_habit(
    habit: HabitCreate,
    current_user=Depends(get_current_user)
):
    habit.days = list(set(habit.days))
    if len(habit.name.strip()) < 4 or len(habit.name.strip()) > 30:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Habit name should have between 4 and 30 characters"
            ).model_dump()
        )
    if habit.frequency not in ["daily", "weekly"]:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Frecuencia desconocida"
            ).model_dump()
        )

    if habit.frequency == "weekly" and len(habit.days) == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Dias no seleccionado"
            ).model_dump()
        )
    for day in habit.days:
        if day < 0 or day > 6:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(
                    success=False,
                    message="Días inválidos"
                ).model_dump()
            )
    conn = None
    try:
        conn = await get_connection()

        habit_id = await conn.fetchval("""
            INSERT INTO habits(
                user_id,
                name,
                frequency
            )
        VALUES($1,$2,$3)
        RETURNING id
        """,
        current_user["user_id"],
        habit.name.strip(),
        habit.frequency
        )
        if habit.frequency == "weekly":
            for day in habit.days:
                await conn.execute("""
                INSERT INTO habit_days(
                    habit_id,
                    week_day
                )
                VALUES($1,$2)
                """,
                habit_id,
                day
                )
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=ApiResponse(
                success=True,
                message="Hábito creado correctamente",
                data={
                    "id": habit_id,
                    "name": habit.name.strip(),
                    "frequency": habit.frequency,
                    "days": habit.days
                }
            ).model_dump()
        )
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Error"
            ).model_dump()
        )
    finally:
        if conn:
            await conn.close()
         
@app.get("/habits")
async def get_habits(current_user=Depends(get_current_user)) :
    conn=None
    try:
        conn = await get_connection()
        habits = await conn.fetch("""
            SELECT id, name, frequency
            FROM habits
            WHERE user_id = $1
            """, current_user["user_id"])
        result = []
        for habit in habits:
            habit_data = dict(habit)

            if habit["frequency"] == "weekly":
                days = await conn.fetch("""
                SELECT week_day
                FROM habit_days
                WHERE habit_id = $1
                """, habit["id"])

                habit_data["days"] = [d["week_day"] for d in days]
            else:
                habit_data["days"] = []
            result.append(habit_data)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Hábitos recuperados",
                data=result
            ).model_dump()
        )
    except Exception:
        traceback.print_exc()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Internal server error"
            ).model_dump()
        )
    finally:
        if conn:
            await conn.close()

@app.post("/users/physique")
async def save_physique(
    data: UserPhysiqueRequest,
    current_user=Depends(get_current_user)
):
    if data.height_unit not in ("cm", "ft"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Unidad de altura inválida"
            ).model_dump()
        )
        
    if data.weight_unit not in ("kg", "lbs"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Unidad de peso inválida"
            ).model_dump()
        )

    if data.goal not in (
        "deficit",
        "recomp",
        "bulk"
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Objetivo inválido"
            ).model_dump()
        )

    if data.goal_intensity not in (
        "light",
        "moderate",
        "aggressive",
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Intensidad inválida"
            ).model_dump()
        )

    if data.activity_level not in (
        "sedentary",
        "quiet",
        "active",
        "veryActive"
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Nivel de actividad inválido"
            ).model_dump()
        )

    if data.training_type not in (
        "gym",
        "cardio",
        "both",
        "none"
    ):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="Tipo de entrenamiento inválido"
            ).model_dump()
        )

    if data.height_unit == "cm":
        if data.height < 100 or data.height > 230:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(
                    success=False,
                    message="Altura inválida"
                ).model_dump()
            )
    else:
        if data.height < 3.3 or data.height > 7.5:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(
                    success=False,
                    message="Altura inválida"
                ).model_dump()
            )

    if data.weight_unit == "kg":
        if data.weight < 35 or data.weight > 300:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(
                    success=False,
                    message="Peso inválido"
                ).model_dump()
            )
    else:
        if data.weight < 77 or data.weight > 660:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(
                    success=False,
                    message="Peso inválido"
                ).model_dump()
            )
    height = (
        data.height
        if data.height_unit == "cm"
        else data.height * 30.48
    )

    weight = (
        data.weight
        if data.weight_unit == "kg"
        else data.weight * 0.453592
    )        
    conn = None
    try:
        conn = await get_connection()
        user_data = await conn.fetchrow(
            "SELECT birth_date, gender FROM users WHERE id = $1",
            current_user["user_id"]
        )
        if not user_data:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content=ApiResponse(success=False, message="Usuario no encontrado").model_dump()
            )
        nutrition = calculate_macros_user(
            weight=weight,
            height=height,
            age=calculate_age(user_data["birth_date"]),
            gender=user_data["gender"],
            activity_level=data.activity_level,
            training_type=data.training_type,
            training_days=data.training_days,
            goal_intensity=data.goal_intensity,
            goal=data.goal,
        )
        async with conn.transaction():
            await conn.execute("""
                INSERT INTO user_physique(
                    user_id,
                    height,
                    current_weight,
                    activity_level,
                    goal,
                    goal_intensity,
                    training_days,
                    training_duration,
                    training_type
                )
                VALUES(
                    $1,$2,$3,$4,$5,$6,$7,$8,$9
                )
            """,
                current_user["user_id"],
                height,
                weight,
                data.activity_level,
                nutrition["goal"],
                data.goal_intensity,
                data.training_days,
                data.training_duration,
                data.training_type
            )
       
            await conn.execute("""
                INSERT INTO weight_logs(
                    user_id,
                    weight,
                    source
                )
                VALUES(
                    $1,$2,$3
                )
            """,
                current_user["user_id"],
                weight,
                'automatic'
            )
            await conn.execute("""
                INSERT INTO daily_nutrition (
                    user_id, date, target_kcal, target_protein, target_carbs, target_fat
                )
                VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
                ON CONFLICT (user_id, date) DO UPDATE 
                SET target_kcal = EXCLUDED.target_kcal,
                    target_protein = EXCLUDED.target_protein,
                    target_carbs = EXCLUDED.target_carbs,
                    target_fat = EXCLUDED.target_fat
            """,
                current_user["user_id"],
                nutrition["target_kcal"],
                nutrition["protein"],
                nutrition["carbs"],
                nutrition["fat"]
            )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Perfil configurado e historial calórico inicializado correctamente."
            ).model_dump()
        )

    except Exception as e:

        print(repr(e))

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Ocurrió un error al guardar los datos."
            ).model_dump()
        )

    finally:

        if conn:
            await conn.close()

@app.get("/nutrition/day")
async def get_day_nutrition(date: Optional[str] = None, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
           return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(success=False, message="Formato de fecha inválido").model_dump()
            )
    else:
        target_date = datetime.now().date()
        
    conn = None
    try:
        conn = await get_connection()
        
        daily = await conn.fetchrow("""
            SELECT id, target_kcal, target_protein, target_carbs, target_fat,
                   kcal_consumed, protein_consumed, carbs_consumed, fat_consumed
            FROM daily_nutrition WHERE user_id = $1 AND date = $2
        """, user_id, target_date)
        
        if not daily:
            return JSONResponse(
                status_code=status.HTTP_200_OK, 
                content=ApiResponse(
                    success=True, 
                    message="Día vacío", 
                    data={"daily": None, "meals": []}
                ).model_dump())
            
        meals = await conn.fetch("""
            SELECT id, meal_name, meal_type, image_url, 
                total_calories,total_protein, total_carbs, total_fat 
            FROM user_meals WHERE daily_nutrition_id = $1 ORDER BY created_at ASC
            """, daily["id"])
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Datos recuperados",
                data={"daily": clean_json(dict(daily)), "meals": clean_json([dict(m) for m in meals])}
            ).model_dump()
        )
    
    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            content=ApiResponse(success=False, message="Error").model_dump())
    
    finally:
        if conn: await conn.close()
        
@app.post("/nutrition/save")
async def save_meal_record(data: SaveMealRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    
    if data.date:
        try:
            target_date = datetime.strptime(data.date, "%Y-%m-%d").date()
        except ValueError:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=ApiResponse(success=False, message="Formato de fecha inválido. Use YYYY-MM-DD.").model_dump()
            )
    else:
        target_date = datetime.now().date()

    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            daily = await conn.fetchrow("""
                SELECT id FROM daily_nutrition 
                WHERE user_id = $1 AND date = $2
            """, user_id, target_date)
        
            if not daily:
                physique = await conn.fetchrow("SELECT current_weight, height, activity_level, goal, goal_intensity, training_days, training_type FROM user_physique WHERE user_id = $1", user_id)
                user_data = await conn.fetchrow("SELECT gender, birth_date FROM users WHERE id = $1", user_id)
                if physique and user_data:
                    age = calculate_age(user_data["birth_date"])
                    nutrition = calculate_macros_user(
                        weight=float(physique["current_weight"]), height=float(physique["height"]), age=age,
                        gender=user_data["gender"], activity_level=physique["activity_level"],
                        training_type=physique["training_type"], training_days=physique["training_days"],
                        goal_intensity=physique["goal_intensity"], goal=physique["goal"]
                    )
                    t_kcal = nutrition["target_kcal"]
                    t_prot = nutrition["protein"]
                    t_carbs = nutrition["carbs"]
                    t_fat = nutrition["fat"]

                daily_id = await conn.fetchval("""
                    INSERT INTO daily_nutrition (user_id, date, target_kcal, target_protein, target_carbs, target_fat)
                    VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                """, user_id, target_date, t_kcal, t_prot, t_carbs, t_fat)
            else:
                daily_id = daily["id"]
                
            meal_kcal = sum(f.calories for f in data.foods)
            meal_protein = sum(f.protein for f in data.foods)
            meal_carbs = sum(f.carbs for f in data.foods)
            meal_fat = sum(f.fat for f in data.foods)
            
            meal_id = await conn.fetchval("""
                INSERT INTO user_meals (daily_nutrition_id, meal_name, meal_type, image_url, total_calories, total_protein, total_carbs, total_fat)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
            """, daily_id, data.meal_name, data.meal_type, data.image_url, meal_kcal, meal_protein, meal_carbs, meal_fat)
            
            for food in data.foods:
                await conn.execute("""
                    INSERT INTO meal_ingredients (user_meals_id, food_id, display_name, grams, calories, protein, carbs, fat)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, meal_id, food.food_id, food.display_name, food.grams, food.calories, food.protein, food.carbs, food.fat)

            await conn.execute("""
                UPDATE daily_nutrition
                SET kcal_consumed = kcal_consumed + $1,
                    protein_consumed = protein_consumed + $2,
                    carbs_consumed = carbs_consumed + $3,
                    fat_consumed = fat_consumed + $4
                WHERE id = $5
            """, meal_kcal, meal_protein, meal_carbs, meal_fat, daily_id)
            
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Comida registrada en la fecha seleccionada con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al guardar el registro.").model_dump())
    finally:
        if conn: await conn.close()
                
@app.post("/nutrition/analyze")
async def analyze_food(data: AnalyzeFoodRequest):
    if not data.is_food:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(
                success=False,
                message="No se detectó comida en la imagen, pasanos otra imagen"
            ).model_dump()
        )
    meal_name = data.meal_name if hasattr(data, "meal_name") else "Comida registrada"
    try:
        tasks = [
            get_food_by_name(food.search_name)
            for food in data.foods
        ]
        foods = await asyncio.gather(
            *tasks,
            return_exceptions=True
        )
        foods_result = []

        for detected, food in zip(data.foods, foods):
            if isinstance(food, Exception):
                print(food)
                foods_result.append({
                    "found": False,
                    "display_name": detected.display_name,
                    "search_name": detected.search_name,
                    "grams": detected.estimated_grams,
                    "confidence": detected.confidence
                })
                continue
            
            if food is None:
                foods_result.append({
                    "found": False,
                    "display_name": detected.display_name,
                    "search_name": detected.search_name,
                    "grams": detected.estimated_grams,
                    "confidence": detected.confidence
                })
                continue
            
            macros = calculate_macros(
                food["serving"],
                detected.estimated_grams
            )
            foods_result.append({
                "found": True,
                "food_id": food["food_id"],
                "food_name": food["food_name"],
                "display_name": detected.display_name,
                "search_name": detected.search_name,
                "grams": detected.estimated_grams,
                "confidence": detected.confidence,
                "calories": macros["calories"],
                "protein": macros["protein"],
                "carbs": macros["carbs"],
                "fat": macros["fat"]
            })
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Alimentos analizados correctamente.",
                data={
                    "meal_name": meal_name, 
                    "items":foods_result
                }
            ).model_dump()
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Ocurrió un error al analizar los alimentos."
            ).model_dump()
        )
        
@app.get("/nutrition/search")
async def search_manual_food(q: str):
    clean_query = q.replace("_", " ").strip()
    try:
        translated_query = GoogleTranslator(source='es', target='en').translate(clean_query)
    except Exception as e:
        print(f"Fallo la traducción, sigo con query original: {repr(e)}")
        translated_query = clean_query
        
    try:
        print(f"Búsqueda original: '{clean_query}' -> Traducido a FatSecret: '{translated_query}'")
        raw_foods = await search_food(translated_query)
        
        if not raw_foods:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=ApiResponse(
                    success=True,
                    message="No se encontraron alimentos.",
                    data=[]
                ).model_dump()
            )
        candidates = raw_foods[:8]
        tasks = [get_food(item["food_id"]) for item in candidates]
        detailed_foods = await asyncio.gather(*tasks, return_exceptions=True)
        search_results = []

        for candidate, detailed in zip(candidates, detailed_foods):
            
            if isinstance(detailed, Exception) or not detailed:
                continue

            servings = detailed.get("food", {}).get("servings", {}).get("serving")
            if not servings:
                continue
                
            if isinstance(servings, dict):
                servings = [servings]

            gram_servings = [
                s for s in servings 
                if s.get("metric_serving_unit") == "g" and s.get("metric_serving_amount") is not None
            ]
            if not gram_servings:
                continue 
    
            chosen_serving = min(
                gram_servings,
                key=lambda s: abs(float(s["metric_serving_amount"]) - 100.0)
            )
            amount = float(chosen_serving["metric_serving_amount"])
            factor = 100.0 / amount
            calories_100g = float(chosen_serving.get("calories", 0)) * factor
            protein_100g = float(chosen_serving.get("protein", 0)) * factor
            carbs_100g = float(chosen_serving.get("carbohydrate", 0)) * factor
            fat_100g = float(chosen_serving.get("fat", 0)) * factor
            food_name_lower = detailed["food"]["food_name"].lower()
            score = fuzz.token_set_ratio(translated_query.lower(), food_name_lower)
            query_lower = translated_query.lower()
            if food_name_lower.startswith(query_lower):
                score += 10
            if not candidate.get("brand_name"):
                score += 5
            else:
                brand_lower = str(candidate.get("brand_name")).lower()
                if brand_lower in query_lower:
                    score += 12
                
            search_results.append({
                "food_id": str(candidate["food_id"]),
                "food_name": detailed["food"]["food_name"],
                "brand_name": candidate.get("brand_name"),
                "calories_per_100g": round(calories_100g),
                "protein_per_100g": round(protein_100g, 1),
                "carbs_per_100g": round(carbs_100g, 1),
                "fat_per_100g": round(fat_100g, 1),
                "score": score
            })
        search_results = sorted(search_results, key=lambda x: x["score"], reverse=True)
        for res in search_results:
            res.pop("score", None)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Búsqueda realizada con éxito.",
                data=search_results
            ).model_dump()
        )
        
    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(
                success=False,
                message="Ocurrió un error interno al procesar la búsqueda."
            ).model_dump()
        )
        
@app.post("/nutrition/upload-image")
async def upload_meal_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    user_id = current_user["user_id"]
    try:
        contents = await file.read()
        ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        file_path = f"{user_id}/{uuid.uuid4()}.{ext}"

        supabase.storage.from_(BUCKET_NAME).upload(
            file_path,
            contents,
            {"content-type": file.content_type or "image/jpeg"}
        )
        public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(file_path)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Imagen subida correctamente.", data={"url": public_url}).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ApiResponse(success=False, message="Error al subir la imagen.").model_dump()
        )
        
@app.get("/nutrition/meal/{meal_id}")
async def get_meal_detail(meal_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        meal = await conn.fetchrow("""
            SELECT um.id, um.meal_name, um.meal_type, um.image_url
            FROM user_meals um
            JOIN daily_nutrition dn ON um.daily_nutrition_id = dn.id
            WHERE um.id = $1 AND dn.user_id = $2
        """, meal_id, user_id)

        if not meal:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Comida no encontrada").model_dump())

        ingredients = await conn.fetch("""
            SELECT food_id, display_name, grams, calories, protein, carbs, fat
            FROM meal_ingredients WHERE user_meals_id = $1
        """, meal_id)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Comida recuperada",
                data={
                    "meal": clean_json(dict(meal)),
                    "ingredients": clean_json([dict(i) for i in ingredients]),
                }
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
        
@app.put("/nutrition/meal/{meal_id}")
async def update_meal_record(meal_id: int, data: SaveMealRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()

        async with conn.transaction():
            meal = await conn.fetchrow("""
                SELECT um.id, um.daily_nutrition_id, um.total_calories, um.total_protein, um.total_carbs, um.total_fat
                FROM user_meals um
                JOIN daily_nutrition dn ON um.daily_nutrition_id = dn.id
                WHERE um.id = $1 AND dn.user_id = $2
            """, meal_id, user_id)

            if not meal:
                return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Comida no encontrada").model_dump())

            daily_id = meal["daily_nutrition_id"]
            old_kcal = float(meal["total_calories"])
            old_protein = float(meal["total_protein"])
            old_carbs = float(meal["total_carbs"])
            old_fat = float(meal["total_fat"])
            new_kcal = sum(f.calories for f in data.foods)
            new_protein = sum(f.protein for f in data.foods)
            new_carbs = sum(f.carbs for f in data.foods)
            new_fat = sum(f.fat for f in data.foods)

            await conn.execute("""
                UPDATE user_meals
                SET meal_name = $1, meal_type = $2, image_url = $3,
                    total_calories = $4, total_protein = $5, total_carbs = $6, total_fat = $7
                WHERE id = $8
            """, data.meal_name, data.meal_type, data.image_url, new_kcal, new_protein, new_carbs, new_fat, meal_id)

            await conn.execute("DELETE FROM meal_ingredients WHERE user_meals_id = $1", meal_id)
            for food in data.foods:
                await conn.execute("""
                    INSERT INTO meal_ingredients (user_meals_id, food_id, display_name, grams, calories, protein, carbs, fat)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                """, meal_id, food.food_id, food.display_name, food.grams, food.calories, food.protein, food.carbs, food.fat)

            await conn.execute("""
                UPDATE daily_nutrition
                SET kcal_consumed = kcal_consumed - $1 + $2,
                    protein_consumed = protein_consumed - $3 + $4,
                    carbs_consumed = carbs_consumed - $5 + $6,
                    fat_consumed = fat_consumed - $7 + $8
                WHERE id = $9
            """, old_kcal, new_kcal, old_protein, new_protein, old_carbs, new_carbs, old_fat, new_fat, daily_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Comida actualizada con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al actualizar el registro.").model_dump())
    finally:
        if conn: await conn.close()

@app.delete("/nutrition/meal/{meal_id}")
async def delete_meal_record(meal_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            meal = await conn.fetchrow("""
                SELECT um.id, um.daily_nutrition_id, um.total_calories, um.total_protein, um.total_carbs, um.total_fat
                FROM user_meals um
                JOIN daily_nutrition dn ON um.daily_nutrition_id = dn.id
                WHERE um.id = $1 AND dn.user_id = $2
            """, meal_id, user_id)
            
            if not meal:
                return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Comida no encontrada").model_dump())

            daily_id = meal["daily_nutrition_id"]
            await conn.execute("""
                UPDATE daily_nutrition
                SET kcal_consumed = kcal_consumed - $1,
                    protein_consumed = protein_consumed - $2,
                    carbs_consumed = carbs_consumed - $3,
                    fat_consumed = fat_consumed - $4
                WHERE id = $5
            """, float(meal["total_calories"]), float(meal["total_protein"]), float(meal["total_carbs"]), float(meal["total_fat"]), daily_id)

            await conn.execute("DELETE FROM user_meals WHERE id = $1", meal_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Comida eliminada con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al eliminar el registro.").model_dump())
    finally:
        if conn: await conn.close()      
        
@app.get("/train/exercises")
async def get_exercises(
    muscle_group: Optional[str] = None,
    q: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    conn = None
    try:
        conn = await get_connection()

        conditions = []
        query_params = []
        param_index = 1

        if muscle_group:
            conditions.append(f"muscle_group = ${param_index}")
            query_params.append(muscle_group)
            param_index += 1

        if q:
            conditions.append(f"name ILIKE ${param_index}")
            query_params.append(f"%{q}%")
            param_index += 1

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        exercises = await conn.fetch(f"""
            SELECT id, name, muscle_group, secondary_muscle_groups, equipment
            FROM exercises
            {where_clause}
            ORDER BY name ASC
        """, *query_params)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Ejercicios recuperados",
                data=[dict(e) for e in exercises]
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
    
@app.post("/train/routines")
async def create_routine(data: CreateRoutineRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            routine_id = await conn.fetchval("""
                INSERT INTO routines (user_id, name)
                VALUES ($1, $2) RETURNING id
            """, user_id, data.name)

            for order_index, ex in enumerate(data.exercises):
                await conn.execute("""
                    INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, rest_seconds, notes)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, routine_id, ex.exercise_id, order_index, ex.target_sets, ex.rest_seconds, ex.notes)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Rutina creada con éxito.", data={"id": routine_id}).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al crear la rutina.").model_dump())
    finally:
        if conn: await conn.close()
    
@app.get("/train/routines")
async def get_routines(current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        routines = await conn.fetch("""
            SELECT id, name, created_at
            FROM routines
            WHERE user_id = $1
            ORDER BY order_index ASC, created_at DESC
        """, user_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Rutinas recuperadas", data=clean_json([dict(r) for r in routines])).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
        
@app.get("/train/routines/{routine_id}")
async def get_routine_detail(routine_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        routine = await conn.fetchrow("""
            SELECT id, name FROM routines
            WHERE id = $1 AND user_id = $2
        """, routine_id, user_id)

        if not routine:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Rutina no encontrada").model_dump())

        exercises = await conn.fetch("""
            SELECT re.id, re.exercise_id, e.name, e.muscle_group, e.equipment,
                   re.order_index, re.target_sets, re.rest_seconds, re.notes
            FROM routine_exercises re
            JOIN exercises e ON re.exercise_id = e.id
            WHERE re.routine_id = $1
            ORDER BY re.order_index ASC
        """, routine_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Rutina recuperada",
                data={"routine": dict(routine), "exercises": [dict(e) for e in exercises]}
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
        
@app.put("/train/routines/{routine_id}")
async def update_routine(routine_id: int, data: CreateRoutineRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            routine = await conn.fetchrow("""
                SELECT id FROM routines WHERE id = $1 AND user_id = $2
            """, routine_id, user_id)

            if not routine:
                return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Rutina no encontrada").model_dump())

            await conn.execute("""
                UPDATE routines SET name = $1, updated_at = NOW()
                WHERE id = $2
            """, data.name, routine_id)

            await conn.execute("DELETE FROM routine_exercises WHERE routine_id = $1", routine_id)
            for order_index, ex in enumerate(data.exercises):
                await conn.execute("""
                    INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, rest_seconds, notes)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """, routine_id, ex.exercise_id, order_index, ex.target_sets, ex.rest_seconds, ex.notes)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Rutina actualizada con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al actualizar la rutina.").model_dump())
    finally:
        if conn: await conn.close()
        
@app.delete("/train/routines/{routine_id}")
async def delete_routine(routine_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        result = await conn.execute("""
            DELETE FROM routines WHERE id = $1 AND user_id = $2
        """, routine_id, user_id)

        if result == "DELETE 0":
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Rutina no encontrada").model_dump())

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Rutina eliminada con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al eliminar la rutina.").model_dump())
    finally:
        if conn: await conn.close()
 
@app.post("/train/sessions")
async def create_session(data: CreateSessionRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            session_id = await conn.fetchval("""
                INSERT INTO workout_sessions (user_id, routine_id, name, started_at, finished_at, duration_seconds, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
            """, user_id, data.routine_id, data.name, data.started_at, data.finished_at, data.duration_seconds, data.notes)

            for exercise in data.exercises:
                session_exercise_id = await conn.fetchval("""
                    INSERT INTO session_exercises (session_id, exercise_id, order_index, notes)
                    VALUES ($1, $2, $3, $4) RETURNING id
                """, session_id, exercise.exercise_id, exercise.order_index, exercise.notes)

                for s in exercise.sets:
                    set_id = await conn.fetchval("""
                        INSERT INTO session_sets (session_exercise_id, set_number, set_type, weight, reps, rpe)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                    """, session_exercise_id, s.set_number, s.set_type, s.weight, s.reps, s.rpe)
                    if s.set_type == "normal" and s.weight and s.reps:
                        await check_and_update_pr(conn, user_id, exercise.exercise_id, s.weight, s.reps, set_id, data.finished_at)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Entrenamiento guardado con éxito.", data={"id": session_id}).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al guardar el entrenamiento.").model_dump())
    finally:
        if conn: await conn.close() 
        
@app.get("/train/sessions")
async def get_sessions(current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        sessions = await conn.fetch("""
            SELECT id, routine_id, name, started_at, finished_at, duration_seconds
            FROM workout_sessions
            WHERE user_id = $1
            ORDER BY started_at DESC
        """, user_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Historial recuperado", data=[dict(s) for s in sessions]).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()  
        
@app.get("/train/sessions/{session_id}")
async def get_session_detail(session_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        session = await conn.fetchrow("""
            SELECT id, routine_id, name, started_at, finished_at, duration_seconds, notes
            FROM workout_sessions WHERE id = $1 AND user_id = $2
        """, session_id, user_id)

        if not session:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Sesión no encontrada").model_dump())

        exercises = await conn.fetch("""
            SELECT se.id, se.exercise_id, e.name, e.muscle_group, se.order_index, se.notes
            FROM session_exercises se
            JOIN exercises e ON se.exercise_id = e.id
            WHERE se.session_id = $1
            ORDER BY se.order_index ASC
        """, session_id)

        exercise_ids = [ex["id"] for ex in exercises]
        sets = await conn.fetch("""
            SELECT id, session_exercise_id, set_number, set_type, weight, reps, rpe
            FROM session_sets
            WHERE session_exercise_id = ANY($1::int[])
            ORDER BY session_exercise_id, set_number ASC
        """, exercise_ids)
        exercises_with_sets = []
        for ex in exercises:
            ex_dict = dict(ex)
            ex_dict["sets"] = [dict(s) for s in sets if s["session_exercise_id"] == ex["id"]]
            exercises_with_sets.append(ex_dict)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Sesión recuperada",
                data={"session": dict(session), "exercises": exercises_with_sets}
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()

@app.delete("/train/sessions/{session_id}")
async def delete_session(session_id: int, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        result = await conn.execute("""
            DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2
        """, session_id, user_id)

        if result == "DELETE 0":
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Sesión no encontrada").model_dump())

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Entrenamiento eliminado con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al eliminar el entrenamiento.").model_dump())
    finally:
        if conn: await conn.close()
      
@app.put("/train/sessions/{session_id}")
async def update_session(session_id: int, data: CreateSessionRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        async with conn.transaction():
            session = await conn.fetchrow("""
                SELECT id FROM workout_sessions WHERE id = $1 AND user_id = $2
            """, session_id, user_id)

            if not session:
                return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Sesión no encontrada").model_dump())

            await conn.execute("""
                UPDATE workout_sessions
                SET routine_id = $1, name = $2, started_at = $3, finished_at = $4, duration_seconds = $5, notes = $6
                WHERE id = $7
            """, data.routine_id, data.name, data.started_at, data.finished_at, data.duration_seconds, data.notes, session_id)

            await conn.execute("DELETE FROM session_exercises WHERE session_id = $1", session_id)

            for exercise in data.exercises:
                session_exercise_id = await conn.fetchval("""
                    INSERT INTO session_exercises (session_id, exercise_id, order_index, notes)
                    VALUES ($1, $2, $3, $4) RETURNING id
                """, session_id, exercise.exercise_id, exercise.order_index, exercise.notes)

                for s in exercise.sets:
                    set_id = await conn.fetchval("""
                        INSERT INTO session_sets (session_exercise_id, set_number, set_type, weight, reps, rpe)
                        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
                    """, session_exercise_id, s.set_number, s.set_type, s.weight, s.reps, s.rpe)

                    if s.set_type == "normal" and s.weight and s.reps:
                        await check_and_update_pr(conn, user_id, exercise.exercise_id, s.weight, s.reps, set_id, data.finished_at)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Entrenamiento actualizado con éxito.").model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al actualizar el entrenamiento.").model_dump())
    finally:
        if conn: await conn.close()
        
@app.get("/train/physical-activities")
async def get_physical_activities(current_user = Depends(get_current_user)):
    conn = None
    try:
        conn = await get_connection()
        activities = await conn.fetch("""
            SELECT id, name, kcal_per_hour
            FROM physical_activities
            ORDER BY name ASC
        """)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Actividades recuperadas", data=[dict(a) for a in activities]).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
  
@app.get("/train/physical-activities/today")
async def get_todays_activities(current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        logs = await conn.fetch("""
            SELECT pal.id, pal.activity_id, pa.name AS activity_name,
                   pal.duration_minutes, pal.kcal_burned, pal.performed_at
            FROM physical_activity_logs pal
            JOIN physical_activities pa ON pal.activity_id = pa.id
            WHERE pal.user_id = $1
              AND pal.performed_at::date = CURRENT_DATE
            ORDER BY pal.performed_at DESC
        """, user_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Actividades de hoy recuperadas",
                data=clean_json([dict(log) for log in logs])
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()
        
@app.post("/train/physical-activities/log")
async def log_physical_activity(data: LogActivityRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        activity = await conn.fetchrow(
            "SELECT kcal_per_hour FROM physical_activities WHERE id = $1", data.activity_id
        )
        if not activity:
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content=ApiResponse(success=False, message="Actividad no encontrada").model_dump())

        kcal_burned = round(activity["kcal_per_hour"] * (data.duration_minutes / 60))

        log_id = await conn.fetchval("""
            INSERT INTO physical_activity_logs (user_id, activity_id, duration_minutes, kcal_burned)
            VALUES ($1, $2, $3, $4) RETURNING id
        """, user_id, data.activity_id, data.duration_minutes, kcal_burned)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Actividad registrada con éxito.", data={"id": log_id, "kcal_burned": kcal_burned}).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al registrar la actividad.").model_dump())
    finally:
        if conn: await conn.close()
        
@app.post("/sleep/log")
async def log_sleep(data: SleepLogRequest, current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]

    if data.quality < 1 or data.quality > 5:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(success=False, message="La calificación debe ser entre 1 y 5").model_dump()
        )

    try:
        target_date = datetime.strptime(data.date, "%Y-%m-%d").date()
        bedtime = datetime.strptime(data.bedtime, "%H:%M").time()
        wake_time = datetime.strptime(data.wake_time, "%H:%M").time()
    except ValueError:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=ApiResponse(success=False, message="Formato de fecha u hora inválido").model_dump()
        )

    duration_minutes = calculate_sleep_duration(data.bedtime, data.wake_time)

    conn = None
    try:
        conn = await get_connection()
        log_id = await conn.fetchval("""
            INSERT INTO sleep_logs (user_id, date, bedtime, wake_time, duration_minutes, quality, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, date) DO UPDATE
            SET bedtime = EXCLUDED.bedtime,
                wake_time = EXCLUDED.wake_time,
                duration_minutes = EXCLUDED.duration_minutes,
                quality = EXCLUDED.quality,
                notes = EXCLUDED.notes
            RETURNING id
        """, user_id, target_date, bedtime, wake_time, duration_minutes, data.quality, data.notes)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(
                success=True,
                message="Sueño registrado con éxito.",
                data={"id": log_id, "duration_minutes": duration_minutes}
            ).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error al registrar el sueño.").model_dump())
    finally:
        if conn: await conn.close()

@app.get("/sleep/history")
async def get_sleep_history(current_user = Depends(get_current_user)):
    user_id = current_user["user_id"]
    conn = None
    try:
        conn = await get_connection()
        logs = await conn.fetch("""
            SELECT id, date, bedtime, wake_time, duration_minutes, quality, notes
            FROM sleep_logs
            WHERE user_id = $1
            ORDER BY date DESC
            LIMIT 30
        """, user_id)

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=ApiResponse(success=True, message="Historial recuperado", data=clean_json([dict(l) for l in logs])).model_dump()
        )
    except Exception as e:
        print(repr(e))
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=ApiResponse(success=False, message="Error").model_dump())
    finally:
        if conn: await conn.close()