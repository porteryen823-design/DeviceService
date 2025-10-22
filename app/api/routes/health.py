from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...database import get_db
from ...services.device_manager import DeviceServiceManager

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """服務健康狀態檢查"""
    manager = DeviceServiceManager(db)
    return manager.get_health_status()