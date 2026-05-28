import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from services.auth import hash_password, verify_password, create_access_token, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    company_name: str
    email: str
    password: str


@router.post("/auth/login")
async def login(body: LoginRequest):
    try:
        from database import get_db
        db = get_db()
        result = db.table("clients").select("*").eq("email", body.email).execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        client = result.data[0]

        if not client.get("password_hash"):
            raise HTTPException(status_code=401, detail="Password not set — contact support")

        if not verify_password(body.password, client["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not client.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")

        token = create_access_token({
            "sub": str(client["id"]),
            "role": client.get("role", "client"),
            "company_name": client.get("company_name") or client.get("name", ""),
            "email": client["email"],
            "name": client.get("name", ""),
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": client.get("role", "client"),
            "company_name": client.get("company_name") or client.get("name", ""),
            "name": client.get("name", ""),
            "onboarding_complete": bool(client.get("onboarding_complete", False)),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Login error: {exc}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/auth/register")
async def register(body: RegisterRequest):
    try:
        from database import get_db
        db = get_db()

        existing = db.table("clients").select("id").eq("email", body.email).execute()
        if existing.data:
            raise HTTPException(status_code=409, detail="Email already registered")

        hashed = hash_password(body.password)
        result = db.table("clients").insert({
            "name": body.company_name,
            "company_name": body.company_name,
            "email": body.email,
            "password_hash": hashed,
            "role": "client",
            "plan": "starter",
            "is_active": True,
            "draft_mode": True,
            "onboarding_complete": False,
        }).execute()

        if not result.data:
            raise HTTPException(status_code=500, detail="Registration failed")

        client = result.data[0]
        token = create_access_token({
            "sub": str(client["id"]),
            "role": "client",
            "company_name": body.company_name,
            "email": body.email,
            "name": body.company_name,
        })

        return {
            "access_token": token,
            "token_type": "bearer",
            "role": "client",
            "company_name": body.company_name,
            "name": body.company_name,
            "onboarding_complete": False,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Register error: {exc}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.patch("/auth/onboarding")
async def complete_onboarding(user: dict = Depends(get_current_user)):
    try:
        from database import get_db
        db = get_db()
        db.table("clients").update({"onboarding_complete": True}).eq("id", user["sub"]).execute()
        return {"ok": True}
    except Exception as exc:
        logger.error(f"Onboarding update error: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))
