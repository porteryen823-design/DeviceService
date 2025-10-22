# 🚀 Device Service 管理網站啟動指南

## 📋 系統架構概述

Device Service 管理系統採用全端分離架構：

- **後端服務**: FastAPI + SQLite + MQTT
- **前端介面**: Vue 3 + TypeScript + Element Plus
- **通訊協定**: RESTful API + WebSocket

## 🛠️ 環境需求

### 系統需求
- **作業系統**: Windows 10/11, macOS, 或 Linux
- **記憶體**: 至少 2GB RAM
- **磁碟空間**: 至少 1GB 可用空間
- **網路**: 支援 IPv4 網路連線

### 軟體需求
- **Python 3.8+** (後端服務)
- **Node.js 18+** (前端建置)
- **Git** (版本控制)

## ⚡ 快速啟動

### 方法一：自動化啟動（推薦）

#### 步驟 1：安裝後端依賴套件
```bash
# 安裝 Python 依賴套件
pip install -r requirements.txt

# 或使用 conda
conda install --file requirements.txt
```

#### 步驟 2：初始化資料庫
```bash
# 執行資料庫初始化腳本
python init_sample_data.py
```

#### 步驟 3：啟動後端服務
```bash
# 啟動 FastAPI 服務
python -m app.main

# 或使用 uvicorn 直接啟動
uvicorn app.main:app --host 0.0.0.0 --port 5200 --reload
```

#### 步驟 4：安裝前端依賴套件
```bash
cd frontend
npm install
```

#### 步驟 5：啟動前端開發服務器
```bash
# 在 frontend 目錄下執行
npm run dev
```

### 方法二：使用腳本啟動

#### 建立啟動腳本 `start-services.bat` (Windows)
```batch
@echo off
echo Starting Device Service Management System...
echo.

echo [1/4] Installing backend dependencies...
pip install -r requirements.txt

echo [2/4] Initializing database...
python init_sample_data.py

echo [3/4] Starting backend service...
start "Backend API" cmd /k "uvicorn app.main:app --host 0.0.0.0 --port 5200 --reload"

echo [4/4] Starting frontend service...
cd frontend
start "Frontend App" cmd /k "npm install && npm run dev"

echo.
echo Services started successfully!
echo - Backend API: http://localhost:5200
echo - Frontend App: http://localhost:3000
echo.
pause
```

#### 建立啟動腳本 `start-services.sh` (macOS/Linux)
```bash
#!/bin/bash

echo "Starting Device Service Management System..."
echo

echo "[1/4] Installing backend dependencies..."
pip install -r requirements.txt

echo "[2/4] Initializing database..."
python init_sample_data.py

echo "[3/4] Starting backend service..."
uvicorn app.main:app --host 0.0.0.0 --port 5200 --reload &
BACKEND_PID=$!

echo "[4/4] Starting frontend service..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo
echo "Services started successfully!"
echo "- Backend API: http://localhost:5200"
echo "- Frontend App: http://localhost:3000"
echo "- Backend PID: $BACKEND_PID"
echo "- Frontend PID: $FRONTEND_PID"
echo
echo "Press Ctrl+C to stop all services"

# 等待中斷信號
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

## 🌐 服務存取

### 後端服務 (Port 5200)
- **API 文件**: http://localhost:5200/docs
- **ReDoc 文件**: http://localhost:5200/redoc
- **健康檢查**: http://localhost:5200/health

### 前端介面 (Port 3000)
- **主頁面**: http://localhost:3000
- **設備管理**: http://localhost:3000/devices

## 🔧 詳細設定說明

### 後端服務設定

#### 環境變數設定 `.env`
```env
# 服務設定
DEVICE_SERVICE_HOST=0.0.0.0
DEVICE_SERVICE_PORT=5200

# 資料庫設定
DATABASE_URL=sqlite:///./device_service.db

# MQTT 設定
MQTT_BROKER_HOST=127.0.0.1
MQTT_BROKER_PORT=2834
MQTT_CLIENT_ID=device_service

# 背景工作程序設定
BACKGROUND_WORKER_INTERVAL=1.0

# 控制器 API 逾時設定
CONTROLLER_API_TIMEOUT=1.0

# 日誌設定
LOG_LEVEL=INFO
LOG_FILE=logs/device_service.log
MQTT_LOG_FILE=logs/mqtt.log
```

#### 資料庫初始化
系統會自動建立 SQLite 資料庫檔案 `device_service.db`。如果需要重新初始化：

```bash
# 刪除舊的資料庫檔案
rm device_service.db

# 重新執行初始化腳本
python init_sample_data.py
```

### 前端應用設定

#### 環境變數設定 `frontend/.env.development`
```env
# API 設定
VITE_API_BASE_URL=http://localhost:5200
VITE_API_TIMEOUT=10000

# 應用程式設定
VITE_APP_TITLE=Device Service Management
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=設備服務管理系統

# 功能開關
VITE_ENABLE_PWA=false
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false

# 開發設定
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_MOCK=false
```

## 🧪 測試與驗證

### 後端 API 測試
```bash
# 執行所有測試
python -m pytest tests/ -v

# 執行特定測試檔案
python -m pytest tests/test_device_service.py -v

# 執行單個測試
python -m pytest tests/test_device_service.py::test_health_check -v
```

### 前端應用測試
```bash
cd frontend

# 執行單元測試
npm run test

# 執行測試並顯示覆蓋率
npm run test:coverage

# 執行測試 UI
npm run test:ui
```

### 手動測試檢查清單

- [ ] 後端服務成功啟動在 port 5200
- [ ] 前端應用成功啟動在 port 3000
- [ ] API 文件可正常存取
- [ ] 資料庫連線正常
- [ ] MQTT 連線正常（如果設定）
- [ ] 前後端資料通訊正常

## 🚨 常見問題與解決方案

### 問題 1：Port 被佔用
**解決方案**：
```bash
# 檢查 port 使用情況
netstat -ano | findstr :5200
netstat -ano | findstr :3000

# 終止佔用 port 的程序
taskkill /PID <PID> /F
```

### 問題 2：Python 依賴套件安裝失敗
**解決方案**：
```bash
# 更新 pip
pip install --upgrade pip

# 使用鏡像源安裝
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 建立虛擬環境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows
```

### 問題 3：Node.js 依賴套件安裝失敗
**解決方案**：
```bash
# 清除 npm 快取
npm cache clean --force

# 使用其他套件管理器
yarn install
# 或
pnpm install

# 使用鏡像源
npm install --registry=https://registry.npmmirror.com
```

### 問題 4：資料庫連線失敗
**解決方案**：
```bash
# 檢查資料庫檔案權限
ls -la device_service.db

# 重新初始化資料庫
rm device_service.db
python init_sample_data.py
```

### 問題 5：前端無法連接到後端
**解決方案**：
1. 確認後端服務正在運行
2. 檢查防火牆設定
3. 確認 CORS 設定正確
4. 檢查網路連線設定

## 📊 服務監控

### 日誌檔案位置
- **應用程式日誌**: `logs/device_service.log`
- **MQTT 日誌**: `logs/mqtt.log`
- **前端建置日誌**: 終端機輸出

### 健康檢查端點
- **後端健康檢查**: http://localhost:5200/health
- **前端健康檢查**: 檢查瀏覽器開發者工具主控台

### 效能監控
- 使用瀏覽器開發者工具監控前端效能
- 檢查後端日誌中的錯誤和警告訊息
- 監控資料庫連線狀態

## 🔄 服務管理

### 啟動服務
```bash
# 後端服務
python -m app.main

# 前端服務
cd frontend && npm run dev
```

### 停止服務
- 後端服務：使用 `Ctrl+C` 或終止程序
- 前端服務：使用 `Ctrl+C` 或關閉終端機

### 重新啟動服務
```bash
# 重新啟動後端服務
# 1. 停止當前服務 (Ctrl+C)
# 2. 重新執行啟動命令

# 重新啟動前端服務
# 1. 停止當前服務 (Ctrl+C)
# 2. 重新執行 npm run dev
```

## 🔒 安全性考量

### 開發環境
- 預設允許所有 CORS 來源
- 啟用詳細錯誤訊息
- 啟用熱重載功能

### 生產環境建議
- 設定適當的 CORS 政策
- 啟用 HTTPS
- 設定適當的認證機制
- 關閉詳細錯誤訊息
- 設定適當的日誌輪替

## 📚 相關文件

- [前端規格文檔](frontend-specification.md)
- [組件架構設計](component-architecture.md)
- [API 整合規範](api-integration-spec.md)
- [UI 樣式規範](ui-style-guide.md)
- [開發環境設定](development-setup.md)

## 🆘 技術支援

如果遇到問題，請：

1. 檢查日誌檔案中的錯誤訊息
2. 確認所有服務都在正確的 port 上運行
3. 檢查網路連線設定
4. 確認環境變數設定正確
5. 查看相關的設定文件

---

**祝使用愉快！** 🎉

如果有任何問題或需要協助，請查看上述文件或聯繫技術支援團隊。