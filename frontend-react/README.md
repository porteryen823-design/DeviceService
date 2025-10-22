# Device Service Management (React)

一個現代化的 React 應用程式，用於管理設備服務配置。

## 技術棧

- **React 18** - 使用 Function Components 和 Hooks
- **TypeScript** - 類型安全開發
- **Material-UI (MUI)** - React 組件庫與主題系統
- **Redux Toolkit** - 狀態管理
- **React Router** - 路由管理
- **React Hook Form** - 表單處理
- **Axios** - HTTP 客戶端
- **Vite** - 建置工具

## 功能特色

- 📋 設備服務列表顯示與管理
- ➕ 新增設備服務配置
- ✏️ 編輯設備服務配置
- 🗑️ 刪除設備服務配置
- 🔍 搜尋和篈選功能
- 📄 分頁顯示
- 🎨 現代化使用者介面
- 📱 響應式設計
- 🔒 表單驗證
- 🔔 通知系統
- 🌈 主題切換系統（支援五種主題：淺色、深色、粉色、綠色、紫色）

## 快速開始

### 環境需求

- Node.js 18+
- npm 或 yarn

### 安裝依賴

```bash
npm install
```

### 開發環境

```bash
npm run dev
```

應用程式將在 http://localhost:3000 上運行。

### 建置生產版本

```bash
npm run build
```

建置檔案將輸出到 `dist` 目錄。

## 專案結構

```
src/
├── api/                 # API 服務層
├── components/          # React 組件
│   ├── common/         # 通用組件
│   ├── layout/         # 佈局組件
│   └── features/       # 功能組件
├── hooks/              # 自訂 Hooks
├── pages/              # 頁面組件
│   ├── DeviceManagement.tsx    # 設備管理頁面
│   ├── ProxyStatus.tsx         # 代理狀態監控頁面
│   └── NotFound.tsx           # 404 頁面
├── store/              # Redux 狀態管理
├── types/              # TypeScript 類型定義
├── utils/              # 工具函數
└── styles/             # 樣式檔案
```

## 環境變數

建立 `.env` 檔案並設定以下變數：

```env
# API 基礎 URL
VITE_API_BASE_URL=http://localhost:5200

# 應用程式設定
VITE_APP_TITLE=Device Service Management
VITE_APP_VERSION=1.0.0

# 預設主題設定
VITE_DEFAULT_THEME=light
```

## 開發規範

### 程式碼規範

- 使用 TypeScript 進行類型檢查
- 遵循 React Hooks 最佳實務
- 組件名稱使用 PascalCase
- 函數和變數名稱使用 camelCase
- 常數名稱使用 SCREAMING_SNAKE_CASE

### Git 提交規範

- `feat:` 新功能
- `fix:` 錯誤修復
- `docs:` 文檔更新
- `style:` 程式碼格式調整
- `refactor:` 重構
- `test:` 測試相關
- `chore:` 其他修改

## API 整合

應用程式與後端 Device Service API 整合，提供以下功能：

### 設備服務管理 API
- 獲取設備服務列表
- 建立新設備服務
- 更新設備服務配置
- 刪除設備服務

### 代理狀態監控 API
- 獲取所有代理服務狀態 (`GET /ProxyStatus`)
- 獲取特定代理服務狀態 (`GET /ProxyStatus/{proxyid}`)

代理狀態資料包含：
- `message`: 狀態訊息（如 "OK", "NG", "HTTP 404" 等）
- `proxyServiceAlive`: 代理服務是否運行（"1" 表示運行，"0" 表示未運行）
- `proxyServiceStart`: 代理服務是否已啟動（"1" 表示已啟動，"0" 表示未啟動）
- 其他設備基本資訊（controller_type, proxy_ip, proxy_port, remark 等）

## 測試

運行測試套件：

```bash
npm test
```

## 建置和部署

### 建置

```bash
npm run build
```

### 預覽建置結果

```bash
npm run preview
```

## 主題切換功能

應用程式支援五種主題模式，讓使用者可以根據個人喜好調整介面外觀：

### 可用主題

- **淺色主題 (Light)** - 經典淺色介面，適合明亮環境
- **深色主題 (Dark)** - 現代深色介面，減少眼睛疲勞
- **粉色主題 (Pink)** - 溫暖粉色調，增添活力
- **綠色主題 (Green)** - 清新綠色調，舒緩視覺
- **紫色主題 (Purple)** - 優雅紫色調，增添神秘感

### 使用方式

1. 在應用程式右上角找到主題切換按鈕
2. 點擊按鈕展開主題選單
3. 選擇您喜歡的主題
4. 主題將立即應用到整個應用程式

### 技術實現

- 使用 Material-UI 的 `createTheme` 動態生成主題
- Redux 狀態管理確保主題設定持久化
- 支援系統主題偏好檢測
- 所有組件自動適應主題變化

## 授權

本專案採用 MIT 授權條款。