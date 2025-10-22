#### RESTful API 端點
基於現有後端 API：

```
GET    /DeviceServiceConfig           # 獲取所有設備
GET    /DeviceServiceConfig/{proxyid} # 獲取特定設備
POST   /DeviceServiceConfig           # 建立設備
PUT    /DeviceServiceConfig/{proxyid} # 更新設備
DELETE /DeviceServiceConfig/{proxyid} # 刪除設備

# 其他後端路由
POST   /Start/{proxyid}               # 啟動代理服務
POST   /Stop/{proxyid}                # 停止代理服務
POST   /Pause/{proxyid}               # 暫停代理服務
POST   /Resume/{proxyid}              # 恢復代理服務
GET    /ProxyStatus                   # 獲取所有代理狀態
GET    /ProxyStatus/{proxyid}         # 獲取特定代理狀態
GET    /health                        # 健康檢查