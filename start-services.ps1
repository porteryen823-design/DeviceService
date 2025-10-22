# Device Service 啟動腳本
# 使用環境變數來設定埠號，而不是硬編碼

Write-Host "啟動 Device Service..." -ForegroundColor Green

# 載入環境變數
if (Test-Path .env) {
    Write-Host "載入環境變數設定..." -ForegroundColor Yellow
    Get-Content .env | ForEach-Object {
        if ($_ -notmatch '^#' -and $_ -match '=') {
            $key, $value = $_ -split '=', 2
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

# 設定預設值（如果環境變數未設定）
$BackendPort = if ($env:DEVICE_SERVICE_PORT) { $env:DEVICE_SERVICE_PORT } else { "8000" }
$FrontendPort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "8080" }

Write-Host "後端服務埠號: $BackendPort" -ForegroundColor Cyan
Write-Host "前端服務埠號: $FrontendPort" -ForegroundColor Cyan

# 啟動後端服務
Write-Host "啟動後端服務..." -ForegroundColor Yellow
Start-Process -NoNewWindow -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", $BackendPort, "--reload" -PassThru
Start-Sleep -Seconds 3

# 啟動前端服務
Write-Host "啟動前端服務..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev", "--", "--host", "0.0.0.0", "--port", $FrontendPort -PassThru
    Set-Location $PSScriptRoot
} else {
    Write-Host "錯誤：找不到 frontend 目錄" -ForegroundColor Red
}

Write-Host "服務啟動完成!" -ForegroundColor Green
Write-Host "後端服務: http://localhost:$BackendPort" -ForegroundColor Magenta
Write-Host "前端服務: http://localhost:$FrontendPort" -ForegroundColor Magenta
Write-Host "按 Ctrl+C 停止服務" -ForegroundColor Red

# 保持腳本運行
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
catch {
    Write-Host "停止服務..." -ForegroundColor Yellow
}