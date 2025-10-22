import logging
from typing import Dict, Any, Optional
from app.mqtt.client import mqtt_client

logger = logging.getLogger(__name__)

class MQTTEventPublisher:
    """MQTT事件發佈器"""

    # MQTT主題定義
    TOPICS = {
        'DEVICE_SERVICE_START': 'mcs/events/deviceService/start',
        'PROXY_SERVICE_STATUS': 'mcs/events/ProxyService/status',
        'PROXY_STATUS_UPDATE': 'mcs/events/ProxyService/status/{proxyid}',
        'DEVICE_STATUS_UPDATE': 'mcs/events/DeviceService/status/{proxyid}'
    }

    def __init__(self):
        self.mqtt_client = mqtt_client

    def publish_device_service_start(self, proxyid: int, status: str = "start", **kwargs) -> bool:
        """發佈設備服務啟動事件"""
        payload = {
            "message": "OK",
            "proxyid": proxyid,
            "status": status,
            "timestamp": None  # 這裡可以加入時間戳
        }

        topic = self.TOPICS['DEVICE_SERVICE_START']

        # 記錄MQTT發佈詳情到一般日誌
        logger.info(f"[MQTT_PUBLISH] Publishing device service start - Topic: {topic}, Payload: {payload}")

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] 設備服務啟動 - ProxyID: {proxyid}, Status: {status}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Topic: {topic}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        # 發佈MQTT訊息
        result = self.mqtt_client.publish(topic, payload)

        # 記錄發佈結果
        if result:
            logger.info(f"[MQTT_PUBLISH] Successfully published device service start to topic: {topic}")
            mqtt_logger.info(f"[MQTT_PUBLISH] 發佈成功 - 主題: {topic}")
        else:
            logger.error(f"[MQTT_PUBLISH] Failed to publish device service start to topic: {topic}")
            mqtt_logger.error(f"[MQTT_PUBLISH] 發佈失敗 - 主題: {topic}")

        return result

    def publish_proxy_service_status(self, proxyid: int, status: str, message: str = "OK",
                                    proxyServiceAlive: str = "1", proxyServiceStart: str = "1",
                                    **kwargs) -> bool:
        """發佈代理服務狀態"""
        payload = {
            "message": message,
            "proxyid": proxyid,
            "status": status,
            "proxyServiceAlive": proxyServiceAlive,
            "proxyServiceStart": proxyServiceStart,
            **kwargs
        }

        topic = self.TOPICS['PROXY_SERVICE_STATUS']

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] 代理服務狀態 - ProxyID: {proxyid}, Status: {status}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Topic: {topic}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.mqtt_client.publish(topic, payload)

    def publish_proxy_status_update(self, proxyid: int, status: str, message: str = "OK",
                                    proxyServiceAlive: str = "1", proxyServiceStart: str = "1",
                                    **kwargs) -> bool:
        """發佈特定代理服務狀態更新"""
        payload = {
            "message": message,
            "proxyid": proxyid,
            "status": status,
            "proxyServiceAlive": proxyServiceAlive,
            "proxyServiceStart": proxyServiceStart,
            **kwargs
        }

        topic = self.TOPICS['PROXY_STATUS_UPDATE'].format(proxyid=proxyid)

        # 記錄MQTT發佈詳情到一般日誌
        logger.info(f"[MQTT_PUBLISH] Publishing proxy status update - Topic: {topic}, Payload: {payload}")

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] 代理狀態更新 - ProxyID: {proxyid}, Status: {status}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Topic: {topic}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        # 發佈MQTT訊息
        result = self.mqtt_client.publish(topic, payload)

        # 記錄發佈結果
        if result:
            logger.info(f"[MQTT_PUBLISH] Successfully published to topic: {topic}")
            mqtt_logger.info(f"[MQTT_PUBLISH] 發佈成功 - 主題: {topic}")
        else:
            logger.error(f"[MQTT_PUBLISH] Failed to publish to topic: {topic}")
            mqtt_logger.error(f"[MQTT_PUBLISH] 發佈失敗 - 主題: {topic}")

        return result

    def publish_device_status_update(self, proxyid: int, device_info: Dict[str, Any],
                                    status: str = "active") -> bool:
        """發佈設備狀態更新"""
        payload = {
            "message": "OK",
            "proxyid": proxyid,
            "status": status,
            "device_info": device_info
        }

        topic = self.TOPICS['DEVICE_STATUS_UPDATE'].format(proxyid=proxyid)

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] 設備狀態更新 - ProxyID: {proxyid}, Status: {status}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Topic: {topic}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.mqtt_client.publish(topic, payload)

    def publish_health_check_result(self, proxyid: int, healthy: bool, response_time: Optional[float] = None,
                                    error_message: Optional[str] = None) -> bool:
        """發佈健康檢查結果"""
        if healthy:
            payload = {
                "message": "OK",
                "proxyid": proxyid,
                "status": "healthy",
                "proxyServiceAlive": "1",
                "proxyServiceStart": "1",
                "response_time": response_time
            }
            status = "healthy"
        else:
            payload = {
                "message": "NG",
                "proxyid": proxyid,
                "status": "unhealthy",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "error_message": error_message
            }
            status = "unhealthy"

        # 記錄健康檢查結果發佈詳情到一般日誌
        logger.info(f"[MQTT_PUBLISH] Publishing health check result - ProxyID: {proxyid}, Healthy: {healthy}, Topic: mcs/events/ProxyService/status/{proxyid}, Payload: {payload}")

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] 健康檢查結果 - ProxyID: {proxyid}, 健康狀態: {healthy}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.publish_proxy_status_update(proxyid, status, **payload)

    def publish_controller_start_result(self, proxyid: int, success: bool, response_data: Optional[Dict[str, Any]] = None,
                                       error_message: Optional[str] = None) -> bool:
        """發佈Controller啟動結果"""
        if success:
            payload = {
                "message": "OK",
                "proxyid": proxyid,
                "status": "controller_started",
                "proxyServiceAlive": "1",
                "proxyServiceStart": "1",
                "response_data": response_data
            }
            status = "controller_started"
        else:
            payload = {
                "message": "NG",
                "proxyid": proxyid,
                "status": "controller_start_failed",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "error_message": error_message
            }
            status = "controller_start_failed"

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.info(f"[MQTT_PUBLISH] Controller啟動結果 - ProxyID: {proxyid}, 成功: {success}")
        mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.publish_proxy_status_update(proxyid, status, **payload)

    def publish_timeout_event(self, proxyid: int, timeout_type: str = "health_check") -> bool:
        """發佈超時事件"""
        payload = {
            "message": "timeout_NG",
            "proxyid": proxyid,
            "status": "timeout",
            "proxyServiceAlive": "0",
            "proxyServiceStart": "0",
            "timeout_type": timeout_type
        }

        # 記錄超時事件發佈詳情到一般日誌
        logger.warning(f"[MQTT_PUBLISH] Publishing timeout event - ProxyID: {proxyid}, TimeoutType: {timeout_type}, Topic: mcs/events/ProxyService/status/{proxyid}")

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.warning(f"[MQTT_PUBLISH] 超時事件 - ProxyID: {proxyid}, 類型: {timeout_type}")
        mqtt_logger.warning(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.publish_proxy_status_update(
            proxyid=proxyid,
            status="timeout",
            message="timeout_NG",
            proxyServiceAlive="0",
            proxyServiceStart="0",
            timeout_type=timeout_type
        )

    def publish_connection_error(self, proxyid: int, error_message: str) -> bool:
        """發佈連接錯誤事件"""
        payload = {
            "message": "connection_NG",
            "proxyid": proxyid,
            "status": "connection_error",
            "proxyServiceAlive": "0",
            "proxyServiceStart": "0",
            "error_message": error_message
        }

        # 記錄連接錯誤事件發佈詳情到一般日誌
        logger.error(f"[MQTT_PUBLISH] Publishing connection error - ProxyID: {proxyid}, Error: {error_message}, Topic: mcs/events/ProxyService/status/{proxyid}")

        # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
        mqtt_logger = logging.getLogger('mqtt')
        mqtt_logger.error(f"[MQTT_PUBLISH] 連接錯誤 - ProxyID: {proxyid}, 錯誤訊息: {error_message}")
        mqtt_logger.error(f"[MQTT_PUBLISH] Payload: {payload}")

        return self.publish_proxy_status_update(
            proxyid=proxyid,
            status="connection_error",
            message="connection_NG",
            proxyServiceAlive="0",
            proxyServiceStart="0",
            error_message=error_message
        )

# 全域MQTT事件發佈器實例
mqtt_publisher = MQTTEventPublisher()
# MQTT Payload Example Documentation

"""
This module provides examples of MQTT payloads for various events and statuses.

### Payload Examples

1. **Health Check Result**
```json
{
  "message": "OK",
  "proxyid": 55,
  "proxyServiceAlive": "1",
  "proxyServiceStart": "1",
  "controller_type": "E82",
  "proxy_ip": "127.0.0.1",
  "proxy_port": "5555",
  "remark": "tsc11",
  "timestamp": "2025-10-20T02:48:43.054Z",
  "response_time": 120
}
```

2. **Controller Start Result**
```json
{
  "message": "OK",
  "proxyid": 55,
  "proxyServiceAlive": "1",
  "proxyServiceStart": "1",
  "controller_type": "E82",
  "proxy_ip": "127.0.0.1",
  "proxy_port": "5555",
  "remark": "tsc11",
  "timestamp": "2025-10-20T02:48:43.054Z",
  "start_status": "success",
  "details": "Controller started successfully"
}
```

3. **Timeout Event**
```json
{
  "message": "timeout_NG",
  "proxyid": 55,
  "proxyServiceAlive": "0",
  "proxyServiceStart": "0",
  "controller_type": "E82",
  "proxy_ip": "127.0.0.1",
  "proxy_port": "5555",
  "remark": "tsc11",
  "timestamp": "2025-10-20T02:48:43.054Z",
  "timeout_type": "connection_timeout"
}
```

4. **Connection Error**
```json
{
  "message": "connection_error",
  "proxyid": 55,
  "proxyServiceAlive": "0",
  "proxyServiceStart": "0",
  "controller_type": "E82",
  "proxy_ip": "127.0.0.1",
  "proxy_port": "5555",
  "remark": "tsc11",
  "timestamp": "2025-10-20T02:48:43.054Z",
  "error_message": "Failed to connect to proxy"
}
```

### Notes
- All payloads include a `timestamp` field for event tracking.
- Ensure all fields are properly populated before publishing to MQTT topics.
"""
import logging

def log_mqtt_message(topic: str, payload: dict):
    """
    Log MQTT messages to a dedicated MQTT log file using the unified logging system.

    Args:
        topic (str): The MQTT topic the message was published to.
        payload (dict): The payload of the MQTT message.
    """
    # Use the unified MQTT logger from the logging system
    mqtt_logger = logging.getLogger('mqtt')
    mqtt_logger.info(f"Published to topic: {topic}, Payload: {payload}")