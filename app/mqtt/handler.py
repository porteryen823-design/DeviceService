import logging
import json
import asyncio
from typing import Dict, Any, Callable
from .client import mqtt_client

logger = logging.getLogger(__name__)

class MQTTMessageHandler:
    """MQTT訊息處理器"""

    def __init__(self):
        self.mqtt_client = mqtt_client
        self._handlers: Dict[str, Callable] = {}

    def register_handler(self, topic: str, handler: Callable):
        """註冊主題處理器"""
        self._handlers[topic] = handler
        logger.info(f"註冊MQTT主題處理器: {topic}")

    def unregister_handler(self, topic: str):
        """取消註冊主題處理器"""
        if topic in self._handlers:
            del self._handlers[topic]
            logger.info(f"取消註冊MQTT主題處理器: {topic}")

    async def start_listening(self):
        """開始監聽訊息"""
        # 訂閱預設的主題
        await self._subscribe_default_topics()

    async def _subscribe_default_topics(self):
        """訂閱預設主題"""
        topics = [
            "mcs/events/ProxyService/status/+",  # 訂閱所有代理服務狀態更新
            "mcs/events/DeviceService/status/+", # 訂閱所有設備服務狀態更新
            "mcs/events/deviceService/+"        # 訂閱設備服務事件
        ]

        for topic in topics:
            self.mqtt_client.subscribe(topic, self._default_message_handler)

    def _default_message_handler(self, topic: str, payload: str):
        """預設訊息處理器"""
        try:
            # 解析JSON payload
            data = json.loads(payload)

            logger.info(f"[MQTT_HANDLER] 收到MQTT訊息 - 主題: {topic}, 資料大小: {len(payload)} bytes")
            logger.debug(f"[MQTT_HANDLER] 訊息內容: {data}")

            # 根據主題類型進行處理
            if "ProxyService/status" in topic:
                logger.info(f"[MQTT_HANDLER] 處理代理服務狀態訊息 - 主題: {topic}")
                asyncio.create_task(self._handle_proxy_status_message(topic, data))
            elif "DeviceService/status" in topic:
                logger.info(f"[MQTT_HANDLER] 處理設備服務狀態訊息 - 主題: {topic}")
                asyncio.create_task(self._handle_device_status_message(topic, data))
            elif "deviceService" in topic:
                logger.info(f"[MQTT_HANDLER] 處理設備服務事件訊息 - 主題: {topic}")
                asyncio.create_task(self._handle_device_service_message(topic, data))
            else:
                logger.warning(f"[MQTT_HANDLER] 未識別的主題類型 - 主題: {topic}")

        except json.JSONDecodeError as e:
            logger.error(f"[MQTT_HANDLER] 解析MQTT訊息JSON失敗 - 主題: {topic}, 錯誤: {e}")
        except Exception as e:
            logger.error(f"[MQTT_HANDLER] 處理MQTT訊息時發生錯誤 - 主題: {topic}, 錯誤: {e}")

    async def _handle_proxy_status_message(self, topic: str, data: Dict[str, Any]):
        """處理代理服務狀態訊息"""
        try:
            proxyid = data.get("proxyid")
            status = data.get("status")
            message = data.get("message")

            logger.info(f"處理代理服務狀態更新 - ProxyID: {proxyid}, 狀態: {status}, 訊息: {message}")

            # 這裡可以加入業務邏輯處理
            # 例如：更新資料庫中的狀態、觸發其他服務等

        except Exception as e:
            logger.error(f"處理代理服務狀態訊息時發生錯誤: {e}")

    async def _handle_device_status_message(self, topic: str, data: Dict[str, Any]):
        """處理設備服務狀態訊息"""
        try:
            proxyid = data.get("proxyid")
            status = data.get("status")
            device_info = data.get("device_info", {})

            logger.info(f"處理設備服務狀態更新 - ProxyID: {proxyid}, 狀態: {status}")

            # 這裡可以加入業務邏輯處理
            # 例如：更新設備狀態、記錄設備資訊等

        except Exception as e:
            logger.error(f"處理設備服務狀態訊息時發生錯誤: {e}")

    async def _handle_device_service_message(self, topic: str, data: Dict[str, Any]):
        """處理設備服務事件訊息"""
        try:
            event_type = topic.split("/")[-1]  # 取得事件類型
            proxyid = data.get("proxyid")
            status = data.get("status")

            logger.info(f"處理設備服務事件 - 類型: {event_type}, ProxyID: {proxyid}, 狀態: {status}")

            # 根據事件類型進行處理
            if event_type == "start":
                await self._handle_device_start_event(data)
            elif event_type == "stop":
                await self._handle_device_stop_event(data)

        except Exception as e:
            logger.error(f"處理設備服務事件訊息時發生錯誤: {e}")

    async def _handle_device_start_event(self, data: Dict[str, Any]):
        """處理設備啟動事件"""
        proxyid = data.get("proxyid")
        logger.info(f"設備服務啟動事件 - ProxyID: {proxyid}")

        # 這裡可以加入啟動後的處理邏輯
        # 例如：記錄啟動時間、更新狀態等

    async def _handle_device_stop_event(self, data: Dict[str, Any]):
        """處理設備停止事件"""
        proxyid = data.get("proxyid")
        logger.info(f"設備服務停止事件 - ProxyID: {proxyid}")

        # 這裡可以加入停止後的處理邏輯
        # 例如：記錄停止時間、清理資源等

# 全域MQTT訊息處理器實例
mqtt_handler = MQTTMessageHandler()