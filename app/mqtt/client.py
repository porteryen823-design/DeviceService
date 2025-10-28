import asyncio
import logging
import json
from typing import Dict, Any, Optional, Callable
import paho.mqtt.client as mqtt
from ..config_mqtt import settings

logger = logging.getLogger(__name__)

class MQTTClient:
    """MQTT客戶端連接管理"""

    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.is_connected = False
        self._connect_lock = asyncio.Lock()
        self._message_handlers: Dict[str, Callable] = {}

    def _on_connect(self, client, userdata, flags, rc):
        """連接回調"""
        if rc == 0:
            logger.info(f"[MQTT_CLIENT] MQTT client connected successfully - Code: {rc}")
            self.is_connected = True
        else:
            logger.error(f"[MQTT_CLIENT] MQTT client connection failed - Code: {rc}")
            self.is_connected = False

    def _on_disconnect(self, client, userdata, rc):
        """斷開連接回調"""
        logger.warning(f"[MQTT_CLIENT] MQTT client disconnected - Code: {rc}, Client ID: {client._client_id if hasattr(client, '_client_id') else 'unknown'}")
        self.is_connected = False

        # 自動重連
        if rc != 0:
            logger.info(f"[MQTT_CLIENT] Auto-reconnect triggered - retrying in {settings.MQTT_RECONNECT_DELAY} seconds")
            asyncio.create_task(self._reconnect())

    def _on_message(self, client, userdata, msg):
        """訊息接收回調"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')

            logger.info(f"[MQTT_CLIENT] Received MQTT message - Topic: {topic}, Payload size: {len(payload)} bytes")

            # 呼叫對應的主題處理器
            if topic in self._message_handlers:
                logger.debug(f"[MQTT_CLIENT] Invoking handler for topic - Topic: {topic}")
                asyncio.create_task(self._message_handlers[topic](topic, payload))
            else:
                logger.debug(f"[MQTT_CLIENT] No handler registered for topic - Topic: {topic}")

        except Exception as e:
            logger.error(f"[MQTT_CLIENT] Error while handling MQTT message - Topic: {msg.topic}, Error: {e}")

    async def _reconnect(self):
        """自動重連"""
        logger.info(f"[MQTT_CLIENT] Attempting to reconnect to MQTT Broker - Delay: {settings.MQTT_RECONNECT_DELAY} seconds")
        await asyncio.sleep(settings.MQTT_RECONNECT_DELAY)
        logger.info(f"[MQTT_CLIENT] Executing MQTT reconnect...")
        await self.connect()

    async def connect(self) -> bool:
        """連接MQTT Broker"""
        async with self._connect_lock:
            try:
                if self.is_connected:
                    logger.info(f"[MQTT_CLIENT] MQTT client already connected - Client ID: {settings.MQTT_CLIENT_ID}")
                    return True

                logger.info(f"[MQTT_CLIENT] Connecting to MQTT Broker - Host: {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}, Client ID: {settings.MQTT_CLIENT_ID}")

                # 創建MQTT客戶端
                client_id = settings.MQTT_CLIENT_ID
                self.client = mqtt.Client(client_id=client_id)

                # 設定回調函數
                self.client.on_connect = self._on_connect
                self.client.on_disconnect = self._on_disconnect
                self.client.on_message = self._on_message

                # 如果有設定用戶名密碼
                if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
                    self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
                    logger.info(f"[MQTT_CLIENT] Using authentication - Username: {settings.MQTT_USERNAME}")

                # 連接MQTT Broker
                logger.info(f"[MQTT_CLIENT] Connecting to MQTT Broker: {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
                self.client.connect(
                    settings.MQTT_BROKER_HOST,
                    settings.MQTT_BROKER_PORT,
                    keepalive=settings.MQTT_KEEPALIVE
                )

                # 啟動網路循環（在背景執行）
                self.client.loop_start()
                logger.info(f"[MQTT_CLIENT] MQTT network loop started")

                # 等待連接建立
                retry_count = 0
                max_retries = 10
                while not self.is_connected and retry_count < max_retries:
                    await asyncio.sleep(0.5)
                    retry_count += 1

                if self.is_connected:
                    logger.info(f"[MQTT_CLIENT] MQTT client connected successfully - Retry count: {retry_count}")
                    return True
                else:
                    logger.error(f"[MQTT_CLIENT] MQTT client connection failed - Retry count: {retry_count}")
                    return False

            except Exception as e:
                logger.error(f"[MQTT_CLIENT] Error while connecting to MQTT Broker: {e}")
                return False

    async def disconnect(self):
        """斷開MQTT連接"""
        async with self._connect_lock:
            if self.client:
                logger.info(f"[MQTT_CLIENT] Disconnecting MQTT client - Client ID: {self.client._client_id if hasattr(self.client, '_client_id') else 'unknown'}")
                self.client.loop_stop()
                self.client.disconnect()
                self.is_connected = False
                logger.info(f"[MQTT_CLIENT] MQTT client disconnected")
            else:
                logger.warning(f"[MQTT_CLIENT] Attempted to disconnect but client is None")

    def subscribe(self, topic: str, handler: Callable = None):
        """訂閱主題"""
        if not self.client or not self.is_connected:
            logger.error(f"[MQTT_CLIENT] MQTT client not connected, cannot subscribe - Topic: {topic}")
            return False

        try:
            if handler:
                self._message_handlers[topic] = handler
                logger.info(f"[MQTT_CLIENT] Registered message handler - Topic: {topic}")

            logger.info(f"[MQTT_CLIENT] Subscribing to topic - Topic: {topic}")
            result = self.client.subscribe(topic)
            if result[0] == 0:
                logger.info(f"[MQTT_CLIENT] Successfully subscribed - Topic: {topic}, Result code: {result[0]}")
                return True
            else:
                logger.error(f"[MQTT_CLIENT] Failed to subscribe - Topic: {topic}, Result code: {result[0]}")
                return False
        except Exception as e:
            logger.error(f"[MQTT_CLIENT] Error while subscribing - Topic: {topic}, Error: {e}")
            return False

    def unsubscribe(self, topic: str):
        """取消訂閱主題"""
        if not self.client or not self.is_connected:
            logger.error("MQTT client not connected, cannot unsubscribe")
            return False

        try:
            if topic in self._message_handlers:
                del self._message_handlers[topic]

            result = self.client.unsubscribe(topic)
            if result[0] == 0:
                logger.info(f"Successfully unsubscribed from topic: {topic}")
                return True
            else:
                logger.error(f"Failed to unsubscribe from topic: {topic}")
                return False
        except Exception as e:
            logger.error(f"Error while unsubscribing from topic: {e}")
            return False

    def publish(self, topic: str, payload: Dict[str, Any], qos: int = 0) -> bool:
        """發佈訊息"""
        if not self.client or not self.is_connected:
            logger.error(f"[MQTT_CLIENT] MQTT client not connected, cannot publish - Topic: {topic}")
            return False

        try:
            # 將payload轉換為JSON格式
            json_payload = json.dumps(payload, ensure_ascii=False)

            # 記錄發佈詳情到一般日誌
            logger.info(f"[MQTT_CLIENT] Publishing message - Topic: {topic}, QoS: {qos}, Payload: {json_payload}")

            # 記錄詳細的 MQTT 發佈資訊到 MQTT 專用日誌
            mqtt_logger = logging.getLogger('mqtt')
            mqtt_logger.info(f"[MQTT_PUBLISH] Topic: {topic}, QoS: {qos}")
            mqtt_logger.info(f"[MQTT_PUBLISH] Payload: {json_payload}")

            # 發佈訊息
            result = self.client.publish(topic, json_payload, qos=qos)

            if result[0] == 0:
                logger.info(f"[MQTT_CLIENT] Successfully published to topic {topic} - Result code: {result[0]}")
                mqtt_logger.info(f"[MQTT_PUBLISH] Publish success - Topic: {topic}, Result code: {result[0]}")
                return True
            else:
                logger.error(f"[MQTT_CLIENT] Failed to publish - Topic: {topic}, Result code: {result[0]}")
                mqtt_logger.error(f"[MQTT_PUBLISH] Publish failed - Topic: {topic}, Result code: {result[0]}")
                return False

        except Exception as e:
            logger.error(f"[MQTT_CLIENT] Error while publishing - Topic: {topic}, Error: {e}")
            mqtt_logger = logging.getLogger('mqtt')
            mqtt_logger.error(f"[MQTT_PUBLISH] Exception during publish - Topic: {topic}, Error: {e}")
            return False

    def is_alive(self) -> bool:
        """檢查客戶端是否正常連接"""
        return self.is_connected and self.client.is_connected() if self.client else False

# 全域MQTT客戶端實例
mqtt_client = MQTTClient()