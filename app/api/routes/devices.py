from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...database import get_db
from ...models.device import DeviceCreate, DeviceUpdate, DeviceInDB, DeviceListResponse
from ...services.device_manager import DeviceServiceManager

router = APIRouter()

@router.get("/DeviceServiceConfig", response_model=DeviceListResponse)
async def get_all_devices(
    page: int = Query(1, ge=1, description="頁碼"),
    size: int = Query(20, ge=1, le=100, description="每頁大小"),
    search: Optional[str] = Query(None, description="搜尋關鍵字"),
    sortBy: Optional[str] = Query(None, description="排序欄位"),
    sortOrder: Optional[str] = Query("asc", description="排序方向"),
    db: Session = Depends(get_db)
):
    """獲取所有設備服務配置"""
    manager = DeviceServiceManager(db)
    devices = manager.get_all_devices()

    # 將SQLAlchemy模型轉換為Pydantic模型
    device_in_db_list = [DeviceInDB.model_validate(device.__dict__) for device in devices]

    # 簡單的分頁處理（這裡可以根據需要實現更複雜的分頁邏輯）
    total = len(device_in_db_list)
    start = (page - 1) * size
    end = start + size
    paginated_devices = device_in_db_list[start:end]

    return DeviceListResponse(
        data=paginated_devices,
        total=total,
        page=page,
        size=size
    )

@router.get("/DeviceServiceConfig/{proxyid}", response_model=DeviceInDB)
async def get_device(proxyid: int, db: Session = Depends(get_db)):
    """獲取特定設備服務配置"""
    manager = DeviceServiceManager(db)
    device = manager.get_device(proxyid)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.post("/DeviceServiceConfig", response_model=DeviceInDB)
async def create_device(device_data: DeviceCreate, db: Session = Depends(get_db)):
    """建立新設備服務配置"""
    manager = DeviceServiceManager(db)
    return manager.create_device(device_data)

@router.put("/DeviceServiceConfig/{proxyid}", response_model=DeviceInDB)
async def update_device(proxyid: int, device_update: DeviceUpdate, db: Session = Depends(get_db)):
    """更新設備服務配置"""
    manager = DeviceServiceManager(db)
    device = manager.update_device(proxyid, device_update)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.delete("/DeviceServiceConfig/{proxyid}")
async def delete_device(proxyid: int, db: Session = Depends(get_db)):
    """刪除設備服務配置"""
    manager = DeviceServiceManager(db)
    device = manager.delete_device(proxyid)
    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")
    return {"message": f"Device {proxyid} deleted successfully"}

@router.post("/Start/{proxyid}")
async def start_proxy(proxyid: int, db: Session = Depends(get_db)):
    """啟動代理服務"""
    manager = DeviceServiceManager(db)
    result = manager.start_proxy(proxyid)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.post("/Stop/{proxyid}")
async def stop_proxy(proxyid: int, db: Session = Depends(get_db)):
    """停止代理服務"""
    manager = DeviceServiceManager(db)
    result = manager.stop_proxy(proxyid)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.post("/Pause/{proxyid}")
async def pause_proxy(proxyid: int, db: Session = Depends(get_db)):
    """暫停代理服務"""
    manager = DeviceServiceManager(db)
    result = manager.pause_proxy(proxyid)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.post("/Resume/{proxyid}")
async def resume_proxy(proxyid: int, db: Session = Depends(get_db)):
    """恢復代理服務"""
    manager = DeviceServiceManager(db)
    result = manager.resume_proxy(proxyid)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/ProxyStatus")
async def get_all_proxy_status(db: Session = Depends(get_db)):
    """獲取所有代理服務狀態"""
    manager = DeviceServiceManager(db)
    result = manager.get_proxy_status()
    # 如果結果是列表，直接返回；如果是字典，檢查是否有錯誤
    if isinstance(result, list):
        return result
    elif isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result

@router.get("/ProxyStatus/{proxyid}")
async def get_proxy_status(proxyid: int, db: Session = Depends(get_db)):
    """獲取特定代理服務狀態"""
    manager = DeviceServiceManager(db)
    result = manager.get_proxy_status(proxyid)
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result