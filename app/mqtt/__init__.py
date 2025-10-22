"""
MQTT通信模組

此模組提供完整的MQTT通信功能，包括：
- MQTT客戶端連接管理
- 訊息發佈和訂閱
- 事件發佈器
- 訊息處理器

主要組件：
- client: MQTT客戶端連接管理
- publisher: MQTT事件發佈器
- handler: MQTT訊息處理器
"""

from .client import mqtt_client
from .publisher import mqtt_publisher
from .handler import mqtt_handler

__all__ = [
    'mqtt_client',
    'mqtt_publisher',
    'mqtt_handler'
]

# MQTT主題定義
MQTT_TOPICS = {
    'DEVICE_SERVICE_START': 'mcs/events/deviceService/start',
    'PROXY_SERVICE_STATUS': 'mcs/events/ProxyService/status',
    'PROXY_STATUS_UPDATE': 'mcs/events/ProxyService/status/{proxyid}',
    'DEVICE_STATUS_UPDATE': 'mcs/events/DeviceService/status/{proxyid}'
}