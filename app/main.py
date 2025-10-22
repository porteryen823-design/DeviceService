from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import asyncio

# 診斷日誌：嘗試載入設定
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("嘗試從 app.config 載入 settings...")

try:
    from .config_mqtt import settings
    logger.debug("成功載入 settings 物件")
except ImportError as e:
    logger.error(f"無法從 app.config 載入 settings: {e}")
    logger.debug("嘗試從 app.config_mqtt 載入 settings...")
    try:
        from .config_mqtt import settings
        logger.debug("成功從 app.config_mqtt 載入 settings 物件")
    except ImportError as e2:
        logger.error(f"無法從 app.config_mqtt 載入 settings: {e2}")
        raise e2
from .database import engine, Base, get_db
from .models.device import Device
from .services.background_worker import BackgroundWorker
from .api.routes.health import router as health_router
from .api.routes.devices import router as devices_router
from .utils.logger import setup_logging, get_logger
from .mqtt.client import mqtt_client
from .mqtt.handler import mqtt_handler

# 設定日誌系統（包含自動輪替功能）
logger, _ = setup_logging(
    log_file=settings.LOG_FILE,
    mqtt_log_file=settings.MQTT_LOG_FILE,
    level=settings.LOG_LEVEL
)

# 全域背景工作程序實例
background_worker = None

# 全域標記，防止重複啟動
_app_started = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    global background_worker, _app_started

    # 防止重複啟動
    if _app_started:
        logger.warning("應用程式已經啟動，跳過重複啟動")
        yield
        return

    _app_started = True

    # 啟動階段
    logger.info("Starting Device Service...")
    logger.info(f"Configuration loaded: HOST={settings.DEVICE_SERVICE_HOST}, PORT={settings.DEVICE_SERVICE_PORT}")

    # 啟動MQTT客戶端
    try:
        logger.info(f"啟動MQTT客戶端，連接到 {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
        mqtt_connected = await mqtt_client.connect()
        if mqtt_connected:
            logger.info("MQTT客戶端連接成功")

            # 啟動MQTT訊息監聽
            await mqtt_handler.start_listening()
            logger.info("MQTT訊息監聽已啟動")
        else:
            logger.error("MQTT客戶端連接失敗")
    except Exception as e:
        logger.error(f"啟動MQTT客戶端時發生錯誤: {e}")

    # 建立資料庫表格
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise

    # 啟動背景工作程序
    background_worker = BackgroundWorker(next(get_db()))
    background_worker.start()
    logger.info("Background worker started")

    yield

    # 關閉階段
    logger.info("Shutting down Device Service...")

    # 停止背景工作程序
    if background_worker:
        background_worker.stop()

    # 關閉MQTT客戶端
    try:
        await mqtt_client.disconnect()
        logger.info("MQTT客戶端已關閉")
    except Exception as e:
        logger.error(f"關閉MQTT客戶端時發生錯誤: {e}")

    logger.info("Device Service shutdown complete")

# 建立 FastAPI 應用程式
app = FastAPI(
    title="Device Service API",
    description="MCS Device Service 微服務",
    version="1.0.0",
    lifespan=lifespan
)

# 添加 CORS 中間件 - 解決前端跨域請求問題
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允許所有來源（開發環境用）
    allow_credentials=True,
    allow_methods=["*"],  # 允許所有 HTTP 方法
    allow_headers=["*"],  # 允許所有標頭
)

# 包含路由
app.include_router(health_router, tags=["Health"])
app.include_router(devices_router, tags=["Devices"])

@app.get("/")
async def root():
    """根路徑"""
    return {"message": "Device Service API", "version": "1.0.0"}

@app.get("/mqtt/status")
async def mqtt_status():
    """取得MQTT連接狀態"""
    return {
        "connected": mqtt_client.is_alive(),
        "broker": f"{settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}",
        "client_id": settings.MQTT_CLIENT_ID
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.DEVICE_SERVICE_HOST,
        port=settings.DEVICE_SERVICE_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )