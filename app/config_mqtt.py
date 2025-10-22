from pydantic_settings import BaseSettings, SettingsConfigDict
import time
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DEVICE_SERVICE_HOST: str = "0.0.0.0"
    DEVICE_SERVICE_PORT: int = 5200

    DATABASE_URL: str = "sqlite:///./device_service.db"

    BACKGROUND_WORKER_INTERVAL: float = 0.2 # seconds

    # Controller API timeout in seconds
    CONTROLLER_API_TIMEOUT: float = 1.0

    # Web API 多工作者設定
    UVICORN_WORKERS: int = 1

    # 背景工作程序控制
    RUN_BACKGROUND_WORKER: bool = False

    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/device_service.log"
    MQTT_LOG_FILE: str = "logs/mqtt.log"

    # MQTT配置
    MQTT_BROKER_HOST: str = "127.0.0.1"
    MQTT_BROKER_PORT: int = 2834
    MQTT_CLIENT_ID_BASE: str = "device_service"  # 基礎客戶端ID名稱
    MQTT_USERNAME: str = ""
    MQTT_PASSWORD: str = ""
    MQTT_KEEPALIVE: int = 60
    MQTT_RECONNECT_DELAY: float = 5.0

    @property
    def MQTT_CLIENT_ID(self) -> str:
        """動態生成帶時間戳的客戶端ID"""
        timestamp = str(int(time.time() * 1000))  # 毫秒時間戳
        pid = str(os.getpid())  # 進程ID
        return f"{self.MQTT_CLIENT_ID_BASE}_{timestamp}_{pid}"

settings = Settings()