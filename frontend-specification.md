# Device Service 管理系統前端規格

## 專案概述

建立一個 Vue 3 架構的管理網站，用於管理 DeviceServiceTbl 資料表的內容。提供完整的 CRUD 功能，包含表格顯示、建立、更新、刪除等操作。

## 技術架構

### 前端技術棧
- **框架**: Vue 3 (Composition API)
- **建置工具**: Vite
- **UI 框架**: Element Plus (基於 Vue 3 的元件庫)
- **狀態管理**: Pinia
- **HTTP 客戶端**: Axios
- **路由**: Vue Router 4
- **表單驗證**: VeeValidate
- **程式語言**: TypeScript

### 目錄結構
```
frontend/
├── public/                 # 靜態資源
├── src/
│   ├── api/               # API 服務層
│   │   ├── client.ts      # HTTP 客戶端設定
│   │   └── device.ts      # 設備相關 API
│   ├── components/        # 共用元件
│   │   ├── DeviceTable.vue    # 設備表格元件
│   │   ├── DeviceDialog.vue   # 設備對話盒元件
│   │   └── ConfirmDialog.vue  # 確認對話盒元件
│   ├── composables/       # 組合式函數
│   │   ├── useDevice.ts   # 設備相關邏輯
│   │   └── useNotification.ts # 通知相關邏輯
│   ├── stores/           # 狀態管理
│   │   └── device.ts     # 設備狀態管理
│   ├── types/            # TypeScript 類型定義
│   │   ├── device.ts     # 設備相關類型
│   │   └── api.ts        # API 相關類型
│   ├── utils/            # 工具函數
│   │   ├── validators.ts # 驗證規則
│   │   └── formatters.ts # 格式化工具
│   ├── views/            # 頁面元件
│   │   └── DeviceManagement.vue # 設備管理主頁面
│   ├── App.vue           # 根元件
│   ├── main.ts           # 應用程式入口
│   └── style.css         # 全域樣式
├── index.html            # HTML 模板
├── package.json          # 專案設定
├── tsconfig.json         # TypeScript 設定
├── vite.config.ts        # Vite 設定
└── README.md            # 專案說明
```

## 功能規格

### 1. 設備列表頁面

#### 表格顯示
- 顯示所有設備服務配置資料
- 支援分頁功能（預設每頁 20 筆）
- 支援搜尋功能（依 proxyid、proxy_ip、Controller_type 等欄位）
- 顯示欄位：
  - proxyid (主鍵)
  - proxy_ip (代理 IP)
  - proxy_port (代理埠號)
  - Controller_type (控制器類型)
  - Controller_ip (控制器 IP)
  - Controller_port (控制器埠號)
  - remark (備註)
  - enable (啟用狀態)
  - createDate (創建日期)
  - ModiftyDate (修改日期)

#### 操作按鈕
每一列包含三個操作按鈕：
- **Create**: 建立新資料（複製當前列資料作為預設值）
- **Update**: 更新當前資料（proxyid 為唯讀）
- **Delete**: 刪除當前資料

### 2. 設備對話盒

#### 基本功能
- 模式對話盒設計
- 支援建立、更新、刪除三種模式
- 表單驗證（必填欄位檢查、格式驗證）
- 兩個操作按鈕：確認、放棄

#### 表單欄位
所有欄位均為必填（除 remark 外）：
- proxyid: 整數，主鍵（唯讀）
- proxy_ip: 字串，IP 位址格式驗證
- proxy_port: 整數，埠號範圍驗證 (1-65535)
- Controller_type: 字串，下拉選單（E82, E84, E90 等）
- Controller_ip: 字串，IP 位址格式驗證
- Controller_port: 整數，埠號範圍驗證 (1-65535)
- remark: 字串，選填欄位
- enable: 整數，啟用狀態 (0: 停用, 1: 啟用)
- createUser: 字串，建立使用者（自動帶入當前使用者）

#### 特殊處理
- **Create 模式**: proxyid 欄位為自動產生（隱藏或唯讀）
- **Update 模式**: proxyid 欄位為唯讀，無法修改
- **Delete 模式**: 僅顯示確認訊息，不顯示表單欄位

### 3. API 整合

#### RESTful API 端點
基於現有後端 API：

```
GET    /DeviceServiceConfig           # 獲取所有設備
GET    /DeviceServiceConfig/{proxyid} # 獲取特定設備
POST   /DeviceServiceConfig           # 建立設備
PUT    /DeviceServiceConfig/{proxyid} # 更新設備
DELETE /DeviceServiceConfig/{proxyid} # 刪除設備
```

#### 錯誤處理
- 網路錯誤：顯示連線失敗訊息
- HTTP 錯誤：顯示後端返回的錯誤訊息
- 驗證錯誤：顯示欄位驗證失敗訊息
- 操作成功：顯示成功訊息並重新載入資料

### 4. 使用者體驗設計

#### 載入狀態
- 表格載入時顯示骨架屏
- API 呼叫時顯示載入動畫
- 操作執行時按鈕顯示載入狀態

#### 通知系統
- 成功操作：綠色成功通知
- 失敗操作：紅色錯誤通知
- 警告訊息：黃色警告通知

#### 回應式設計
- 支援桌面版面（主要）
- 平板和手機版面適配
- 表格在小螢幕上自動捲軸顯示

## 資料流程設計

### 狀態管理
使用 Pinia 進行狀態管理：

```typescript
// stores/device.ts
interface DeviceState {
  devices: Device[]
  loading: boolean
  currentDevice: Device | null
  dialogMode: 'create' | 'update' | 'delete'
  dialogVisible: boolean
  searchQuery: string
  pagination: {
    page: number
    size: number
    total: number
  }
}
```

### API 服務層
封裝所有 HTTP 請求：

```typescript
// api/device.ts
class DeviceAPI {
  async getAllDevices(params?: DeviceQueryParams): Promise<DeviceResponse>
  async getDevice(proxyid: number): Promise<Device>
  async createDevice(device: DeviceCreate): Promise<Device>
  async updateDevice(proxyid: number, device: DeviceUpdate): Promise<Device>
  async deleteDevice(proxyid: number): Promise<void>
}
```

## 開發規範

### 程式碼規範
- 使用 TypeScript 進行類型檢查
- 遵循 Vue 3 Composition API 最佳實務
- 組件名稱使用 PascalCase
- 函數和變數名稱使用 camelCase
- 常數名稱使用 SCREAMING_SNAKE_CASE

### Git 提交規範
- feat: 新功能
- fix: 錯誤修復
- docs: 文檔更新
- style: 程式碼格式調整
- refactor: 重構
- test: 測試相關
- chore: 其他修改

## 部署規劃

### 開發環境
- Node.js 18+
- npm 或 yarn 套件管理器
- Vite 開發伺服器

### 建置流程
1. 安裝依賴套件
2. 開發階段：`npm run dev`
3. 建置階段：`npm run build`
4. 預覽建置結果：`npm run preview`

### 環境變數
```env
# API 基礎 URL
VITE_API_BASE_URL=http://localhost:8000

# 應用程式設定
VITE_APP_TITLE=Device Service Management
VITE_APP_VERSION=1.0.0
```

## 測試規劃

### 單元測試
- 組件測試（Vue Test Utils）
- 組合式函數測試
- 工具函數測試

### 整合測試
- API 服務測試
- 狀態管理測試
- 使用者操作流程測試

### E2E 測試
- 使用 Playwright 或 Cypress
- 涵蓋主要使用者操作流程

## 未來擴充性

### 預留功能
- 批次操作（批次刪除、批次更新）
- 匯入匯出功能（Excel/CSV）
- 進階搜尋和篩選
- 資料視覺化圖表
- 使用者權限管理
- 操作日誌記錄

### 架構擴充性
- 模組化設計，易於新增其他管理功能
- 支援多語言國際化
- 深色模式支援
- PWA 離線功能支援