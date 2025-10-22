# MQTT功能實作說明

## 概述

已成功恢復並實作了原本設計的MQTT功能，讓Device Service能夠與下位機通訊後，將訊息1對1對應轉成MQTT payload並發送。

## 實作架構

### 1. MQTT組件架構

```
app/mqtt/
├── __init__.py          # MQTT模組初始化
├── client.py            # MQTT客戶端連接管理
├── handler.py           # MQTT訊息處理器
└── publisher.py         # MQTT事件發佈器
```

### 2. 整合流程

```
下位機健康檢查
       ↓
BackgroundWorker檢查結果
       ↓
MQTT事件發佈器轉換格式
       ↓
發佈到MQTT主題
       ↓
其他系統訂閱接收
```

## 功能特點

### ✅ 已實作功能

1. **MQTT客戶端連接管理**
   - 自動連接/重連機制
   - 連接狀態監控
   - 錯誤處理和日誌記錄

2. **MQTT事件發佈器**
   - 健康檢查結果發佈
   - Controller啟動結果發佈
   - 代理服務狀態發佈
   - 設備狀態更新發佈
   - 錯誤事件發佈（超時、連接失敗等）

3. **BackgroundWorker整合**
   - 在與下位機通訊後自動發佈MQTT訊息
   - 1對1訊息對應轉換
   - 完整的錯誤處理和狀態追蹤

4. **訊息處理器**
   - 訂閱MQTT主題
   - 處理接收到的訊息
   - 支援擴展自訂處理邏輯

## MQTT主題設計

### 發佈主題
- `mcs/events/deviceService/start` - 設備服務啟動事件
- `mcs/events/ProxyService/status` - 代理服務狀態
- `mcs/events/ProxyService/status/{proxyid}` - 特定代理服務狀態更新
- `mcs/events/DeviceService/status/{proxyid}` - 設備服務狀態更新

### 訂閱主題
- `mcs/events/ProxyService/status/+` - 訂閱所有代理服務狀態更新
- `mcs/events/DeviceService/status/+` - 訂閱所有設備服務狀態更新
- `mcs/events/deviceService/+` - 訂閱設備服務事件

## 訊息格式範例

### 健康檢查結果
```json
{
  "message": "OK",
  "proxyid": 1,
  "status": "healthy",
  "proxyServiceAlive": "1",
  "proxyServiceStart": "1",
  "response_time": 0.1
}
```

### 錯誤事件
```json
{
  "message": "timeout_NG",
  "proxyid": 1,
  "status": "timeout",
  "proxyServiceAlive": "0",
  "proxyServiceStart": "0",
  "timeout_type": "health_check"
}
```

### Controller啟動結果
```json
{
  "message": "OK",
  "proxyid": 1,
  "status": "controller_started",
  "proxyServiceAlive": "1",
  "proxyServiceStart": "1",
  "response_data": {...}
}
```

## 設定配置

### 環境變數設定
```bash
# MQTT配置
MQTT_BROKER_HOST=127.0.0.1
MQTT_BROKER_PORT=2834
MQTT_CLIENT_ID=device_service
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_KEEPALIVE=60
MQTT_RECONNECT_DELAY=5.0
```

### 設定檔案
- `app/config.py` - MQTT設定參數定義
- `.env.mqtt.example` - MQTT設定範例檔案

## 使用方式

### 1. 啟動服務
```bash
# 複製MQTT設定範例
cp .env.mqtt.example .env

# 編輯設定檔案
vim .env

# 啟動服務
python -m uvicorn app.main:app --reload
```

### 2. 檢查MQTT狀態
```bash
# 透過API檢查MQTT連接狀態
curl http://localhost:5200/mqtt/status
```

### 3. 執行MQTT整合測試
```bash
# 執行MQTT功能測試
python test_mqtt_integration.py
```

## 擴展功能

### 自訂訊息處理器
```python
from app.mqtt.handler import mqtt_handler

def custom_handler(topic: str, payload: str):
    # 自訂處理邏輯
    print(f"收到訊息: {topic} - {payload}")

# 註冊處理器
mqtt_handler.register_handler("custom/topic", custom_handler)
```

### 自訂事件發佈
```python
from app.mqtt.publisher import mqtt_publisher

# 發佈自訂事件
mqtt_publisher.publish_proxy_status_update(
    proxyid=1,
    status="custom_status",
    custom_field="custom_value"
)
```

## 測試結果

執行 `test_mqtt_integration.py` 將測試：
- ✅ MQTT連接測試
- ✅ MQTT訊息發佈測試
- ✅ MQTT訊息訂閱測試
- ✅ BackgroundWorker整合測試

## 注意事項

1. **依賴套件**：確保已安裝 `paho-mqtt==1.6.1`
2. **MQTT Broker**：預設連接到 `127.0.0.1:2834`
3. **網路連接**：確保MQTT Broker可訪問
4. **錯誤處理**：所有MQTT操作都有完整的錯誤處理機制

## 故障排除

### 常見問題

1. **連接失敗**
   - 檢查MQTT Broker是否運行
   - 確認網路連接和端口設定

2. **訊息不發佈**
   - 檢查MQTT客戶端連接狀態
   - 查看日誌中的錯誤訊息

3. **訊息不接收**
   - 確認訂閱的主題名稱正確
   - 檢查訊息處理器是否正確註冊

### 除錯指令
```bash
# 查看MQTT相關日誌
tail -f logs/mqtt.log

# 測試MQTT連接
python -c "from app.mqtt.client import mqtt_client; print(asyncio.run(mqtt_client.connect()))"