# 使用者介面樣式規範

## 設計原則

### 1. 設計理念
- **簡潔明瞭**: 介面設計以簡潔為主，避免過多裝飾
- **使用者中心**: 以使用者操作習慣為導向，提供直觀的互動體驗
- **一致性**: 保持視覺元素和互動模式的一致性
- **回應式**: 支援不同螢幕尺寸的適配

### 2. 色彩系統

#### 主色調
```css
/* 主品牌色 */
--primary-color: #409EFF
--primary-light: #66B1FF
--primary-dark: #337ECC

/* 成功色 */
--success-color: #67C23A
--success-light: #85CE61
--success-dark: #5A9F32

/* 警告色 */
--warning-color: #E6A23C
--warning-light: #E6A23C
--warning-dark: #CF9236

/* 危險色 */
--danger-color: #F56C6C
--danger-light: #F78989
--danger-dark: #DD6161

/* 資訊色 */
--info-color: #909399
--info-light: #B1B3B8
--info-dark: #73767A
```

#### 中性色
```css
/* 背景色 */
--bg-primary: #FFFFFF
--bg-secondary: #F5F7FA
--bg-tertiary: #FAFBFC

/* 文字色 */
--text-primary: #303133
--text-regular: #606266
--text-secondary: #909399
--text-placeholder: #C0C4CC

/* 邊框色 */
--border-light: #DCDFE6
--border-regular: #E4E7ED
--border-dark: #D3D4D6
```

#### 狀態色彩
```css
/* 載入狀態 */
--loading-bg: rgba(255, 255, 255, 0.8)
--loading-text: #999999

/* 遮罩層 */
--overlay-bg: rgba(0, 0, 0, 0.5)

/* 陰影 */
--shadow-light: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04)
--shadow-regular: 0 2px 12px 0 rgba(0, 0, 0, 0.1)
--shadow-dark: 0 4px 16px rgba(0, 0, 0, 0.15)
```

### 3. 字體系統

#### 字體族群
```css
/* 中文字體 */
--font-family-chinese: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Segoe UI', Tahoma, Arial, 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif

/* 英文字體 */
--font-family-english: 'Helvetica Neue', Helvetica, 'Segoe UI', Tahoma, Arial, sans-serif

/* 程式碼字體 */
--font-family-mono: 'Monaco', 'Consolas', 'Courier New', monospace
```

#### 字體大小
```css
/* 標題字級 */
--font-size-h1: 28px
--font-size-h2: 24px
--font-size-h3: 20px
--font-size-h4: 18px
--font-size-h5: 16px
--font-size-h6: 14px

/* 內文字級 */
--font-size-large: 16px
--font-size-regular: 14px
--font-size-small: 13px
--font-size-mini: 12px

/* 按鈕字級 */
--font-size-button-large: 16px
--font-size-button-regular: 14px
--font-size-button-small: 12px
```

#### 字重設定
```css
--font-weight-light: 300
--font-weight-regular: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

### 4. 間距系統

#### 基礎間距單位
```css
/* 基礎間距 */
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-xxl: 48px
```

#### 頁面邊距
```css
/* 頁面容器 */
--page-padding: var(--spacing-lg)
--page-max-width: 1200px

/* 區塊間距 */
--section-margin: var(--spacing-xl)
--section-padding: var(--spacing-lg)

/* 組件間距 */
--component-margin: var(--spacing-md)
--component-padding: var(--spacing-md)
```

### 5. 版面配置

#### 網格系統
```css
/* 網格設定 */
--grid-columns: 24
--grid-gutter: 16px
--grid-container-padding: 16px

/* 斷點設定 */
--breakpoint-xs: 480px
--breakpoint-sm: 768px
--breakpoint-md: 992px
--breakpoint-lg: 1200px
--breakpoint-xl: 1920px
```

#### 容器寬度
```css
/* 容器最大寬度 */
--container-xs: 100%
--container-sm: 540px
--container-md: 720px
--container-lg: 960px
--container-xl: 1140px
```

## 元件樣式規範

### 1. 按鈕元件

#### 按鈕尺寸
```css
/* 大按鈕 */
.button-large {
  height: 48px;
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-button-large);
  border-radius: 6px;
}

/* 預設按鈕 */
.button-regular {
  height: 40px;
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-button-regular);
  border-radius: 4px;
}

/* 小按鈕 */
.button-small {
  height: 32px;
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-button-small);
  border-radius: 4px;
}
```

#### 按鈕狀態
```css
/* 預設狀態 */
.button {
  border: 1px solid var(--border-regular);
  background-color: var(--bg-primary);
  color: var(--text-regular);
  transition: all 0.2s ease;
}

/* 懸停狀態 */
.button:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 焦點狀態 */
.button:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 載入狀態 */
.button.loading {
  position: relative;
  color: transparent;
}

.button.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 16px;
  height: 16px;
  margin: -8px 0 0 -8px;
  border: 2px solid var(--primary-color);
  border-top-color: transparent;
  border-radius: 50%;
  animation: button-loading-spin 1s linear infinite;
}
```

#### 按鈕類型樣式
```css
/* 主要按鈕 */
.button-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.button-primary:hover {
  background-color: var(--primary-light);
  border-color: var(--primary-light);
}

/* 成功按鈕 */
.button-success {
  background-color: var(--success-color);
  border-color: var(--success-color);
  color: white;
}

/* 危險按鈕 */
.button-danger {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
}

/* 文字按鈕 */
.button-text {
  border: none;
  background: transparent;
  color: var(--primary-color);
  padding: 0;
}
```

### 2. 表格元件

#### 表格樣式
```css
/* 表格容器 */
.device-table {
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: var(--shadow-light);
  overflow: hidden;
}

/* 表格標頭 */
.table-header {
  background-color: var(--bg-secondary);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.table-header th {
  padding: var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

/* 表格內容 */
.table-body td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  color: var(--text-regular);
  vertical-align: middle;
}

/* 表格行懸停效果 */
.table-body tr:hover {
  background-color: var(--bg-secondary);
}

/* 表格斑馬紋 */
.table-body tr:nth-child(even) {
  background-color: var(--bg-tertiary);
}
```

#### 操作按鈕區域
```css
/* 按鈕群組 */
.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

/* 按鈕間距 */
.action-buttons .el-button {
  margin: 0 2px;
}

/* 按鈕在小螢幕上的樣式 */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .action-buttons .el-button {
    width: 100%;
    margin: 0;
  }
}
```

### 3. 對話盒元件

#### 對話盒樣式
```css
/* 對話盒容器 */
.device-dialog {
  border-radius: 8px;
  box-shadow: var(--shadow-dark);
}

/* 對話盒標題 */
.dialog-header {
  padding: var(--spacing-lg) var(--spacing-lg) var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
  font-size: var(--font-size-h6);
  font-weight: var(--font-weight-semibold);
}

/* 對話盒內容 */
.dialog-body {
  padding: var(--spacing-lg);
  max-height: 70vh;
  overflow-y: auto;
}

/* 對話盒底部 */
.dialog-footer {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
```

#### 表單樣式
```css
/* 表單區域 */
.form-container {
  max-width: 600px;
}

/* 表單欄位間距 */
.form-field {
  margin-bottom: var(--spacing-lg);
}

/* 欄位標籤 */
.field-label {
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

/* 必填欄位標記 */
.required-mark {
  color: var(--danger-color);
  margin-left: 2px;
}

/* 唯讀欄位樣式 */
.readonly-field {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: not-allowed;
}

/* 錯誤狀態 */
.field-error {
  color: var(--danger-color);
  font-size: var(--font-size-small);
  margin-top: var(--spacing-xs);
}
```

### 4. 載入狀態元件

#### 骨架屏樣式
```css
/* 表格骨架屏 */
.table-skeleton {
  padding: var(--spacing-lg);
}

.skeleton-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.skeleton-item {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

#### 載入動畫
```css
/* 全域載入遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--loading-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-regular);
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 5. 通知元件

#### 訊息樣式
```css
/* 訊息容器 */
.message-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 3000;
  max-width: 400px;
}

/* 訊息項目 */
.message-item {
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: 6px;
  box-shadow: var(--shadow-regular);
  border-left: 4px solid;
  animation: message-slide-in 0.3s ease;
}

.message-item.success {
  background-color: #f0f9ff;
  border-left-color: var(--success-color);
  color: var(--success-dark);
}

.message-item.error {
  background-color: #fef0f0;
  border-left-color: var(--danger-color);
  color: var(--danger-dark);
}

.message-item.warning {
  background-color: #fdf6ec;
  border-left-color: var(--warning-color);
  color: var(--warning-dark);
}

@keyframes message-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## 回應式設計規範

### 1. 斷點設計

#### 桌面版面 (> 1200px)
```css
/* 三欄式配置 */
.desktop-layout {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  gap: var(--spacing-lg);
}
```

#### 平板版面 (768px - 1200px)
```css
/* 雙欄式配置 */
.tablet-layout {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-md);
}
```

#### 手機版面 (< 768px)
```css
/* 單欄式配置 */
.mobile-layout {
  padding: var(--spacing-sm);
}

/* 表格水平捲軸 */
.mobile-table {
  overflow-x: auto;
}

.mobile-table table {
  min-width: 600px;
}
```

### 2. 彈性元件設計

#### 彈性按鈕
```css
/* 按鈕在不同螢幕尺寸的適配 */
.responsive-button {
  width: 100%;
  max-width: 200px;
}

@media (min-width: 768px) {
  .responsive-button {
    width: auto;
    min-width: 120px;
  }
}
```

#### 彈性表格
```css
/* 表格欄位寬度適配 */
.device-table {
  /* 桌面版欄位寬度 */
}

@media (max-width: 768px) {
  .device-table {
    font-size: var(--font-size-small);
  }

  .device-table th,
  .device-table td {
    padding: var(--spacing-sm);
  }

  /* 隱藏不重要的欄位 */
  .hide-on-mobile {
    display: none;
  }
}
```

## 動畫與過渡效果

### 1. 過渡效果
```css
/* 通用過渡效果 */
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
  transition: color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
}

.transition-transform {
  transition: transform 0.3s ease;
}
```

### 2. 動畫效果
```css
/* 淡入動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滑入動畫 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

/* 縮放動畫 */
.scale-enter-active,
.scale-leave-active {
  transition: transform 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.8);
}
```

## 無障礙設計規範

### 1. 鍵盤導航
```css
/* 焦點樣式 */
.focus-visible:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

/* 隱藏視覺焦點，但保留邏輯焦點 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 2. 螢幕閱讀器支援
```css
/* 為重要元素加入適當的 ARIA 標籤 */
.table-container {
  role: "table";
  aria-label: "設備服務配置列表";
}

.table-header {
  role: "row";
}

.table-cell {
  role: "gridcell";
}

/* 狀態提示 */
.loading-status {
  aria-live: "polite";
  aria-atomic: "true";
}
```

這個樣式規範提供了完整的使用者介面設計指導方針，涵蓋了色彩系統、字體設定、間距規範、元件樣式、回應式設計和無障礙支援，為後續的實作提供了統一的視覺標準。