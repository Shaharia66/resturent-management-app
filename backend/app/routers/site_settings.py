import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.deps import get_current_admin

router = APIRouter(prefix="/api", tags=["settings"])

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def _get_or_create_settings(db: Session) -> models.SiteSettings:
    settings = db.query(models.SiteSettings).filter(models.SiteSettings.id == 1).first()
    if not settings:
        settings = models.SiteSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/settings", response_model=schemas.SiteSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _get_or_create_settings(db)


@router.put("/admin/settings", response_model=schemas.SiteSettingsOut)
def update_settings(
    payload: schemas.SiteSettingsUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    settings = _get_or_create_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/admin/settings/upload-photo", response_model=schemas.SiteSettingsOut)
async def upload_site_photo(
    slot: str = Query(..., pattern="^(hero_image_1|hero_image_2)$"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP, or GIF images are allowed")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be smaller than 5MB")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    settings = _get_or_create_settings(db)
    url_field = "hero_image_1_url" if slot == "hero_image_1" else "hero_image_2_url"
    setattr(settings, url_field, f"/uploads/{filename}")
    db.commit()
    db.refresh(settings)
    return settings