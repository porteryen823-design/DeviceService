import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.models.device import Device

# 測試資料庫設定
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_device_service.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    # 建立測試資料庫表格
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    # 清理測試資料庫
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db():
    database = TestingSessionLocal()
    try:
        yield database
    finally:
        database.close()

def test_health_check(client):
    """測試健康檢查 API"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Device Service is running" in data["message"]
    assert "version" in data

def test_root_endpoint(client):
    """測試根路徑"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Device Service API" in data["message"]

def test_create_device(client):
    """測試建立設備服務配置"""
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    response = client.post("/DeviceServiceConfig", json=device_data)
    assert response.status_code == 200
    data = response.json()
    assert data["proxyid"] == 1
    assert data["proxy_ip"] == "127.0.0.1"
    assert data["Controller_type"] == "E82"

def test_get_all_devices(client):
    """測試獲取所有設備服務配置"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 測試獲取所有設備
    response = client.get("/DeviceServiceConfig")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

def test_get_device(client):
    """測試獲取特定設備服務配置"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 測試獲取特定設備
    response = client.get("/DeviceServiceConfig/1")
    assert response.status_code == 200
    data = response.json()
    assert data["proxyid"] == 1

def test_get_device_not_found(client):
    """測試獲取不存在的設備"""
    response = client.get("/DeviceServiceConfig/999")
    assert response.status_code == 404

def test_update_device(client):
    """測試更新設備服務配置"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 更新設備資料
    update_data = {
        "remark": "更新後的測試設備",
        "enable": 0
    }

    response = client.put("/DeviceServiceConfig/1", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["remark"] == "更新後的測試設備"
    assert data["enable"] == 0

def test_delete_device(client):
    """測試刪除設備服務配置"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 刪除設備
    response = client.delete("/DeviceServiceConfig/1")
    assert response.status_code == 200
    data = response.json()
    assert "deleted successfully" in data["message"]

def test_start_proxy(client):
    """測試啟動代理服務"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 啟動代理服務
    response = client.post("/Start/1")
    assert response.status_code == 200
    data = response.json()
    assert "start initiated" in data["message"]

def test_get_proxy_status(client):
    """測試獲取代理服務狀態"""
    # 先建立測試資料
    device_data = {
        "proxyid": 1,
        "proxy_ip": "127.0.0.1",
        "proxy_port": 5555,
        "Controller_type": "E82",
        "Controller_ip": "127.0.0.1",
        "Controller_port": 5100,
        "remark": "測試設備",
        "enable": 1,
        "createUser": "test_user"
    }

    client.post("/DeviceServiceConfig", json=device_data)

    # 獲取代理服務狀態
    response = client.get("/ProxyStatus/1")
    assert response.status_code == 200
    data = response.json()
    assert "proxyid" in data
    assert data["proxyid"] == 1