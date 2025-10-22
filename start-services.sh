#!/bin/bash

# Device Service 啟動腳本
# 使用環境變數來設定埠號，而不是硬編碼

echo "啟動 Device Service..."

# 載入環境變數
if [ -f .env ]; then
    echo "載入環境變數設定..."
    export $(cat .env | grep -v '^#' | xargs)
fi

# 設定預設值（如果環境變數未設定）
BACKEND_PORT=${DEVICE_SERVICE_PORT:-8000}
FRONTEND_PORT=${FRONTEND_PORT:-8080}

echo "後端服務埠號: $BACKEND_PORT"
echo "前端服務埠號: $FRONTEND_PORT"

# 啟動後端服務
echo "啟動後端服務..."
python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
BACKEND_PID=$!

# 等待後端服務啟動
sleep 3

# 啟動前端服務
echo "啟動前端服務..."
cd frontend && npx vite --host 0.0.0.0 --port $FRONTEND_PORT &
FRONTEND_PID=$!

echo "服務啟動完成!"
echo "後端服務 PID: $BACKEND_PID"
echo "前端服務 PID: $FRONTEND_PID"
echo "後端服務: http://localhost:$BACKEND_PORT"
echo "前端服務: http://localhost:$FRONTEND_PORT"

# 等待服務結束
wait $BACKEND_PID $FRONTEND_PID