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
            logger.info(f"[MQTT_CLIENT] MQTT客戶端連接成功 - 錯誤碼: {rc}")
            self.is_connected = True
        else:
            logger.error(f"[MQTT_CLIENT] MQTT客戶端連接失敗 - 錯誤碼: {rc}")
            self.is_connected = False

    def _on_disconnect(self, client, userdata, rc):
        """斷開連接回調"""
        logger.warning(f"[MQTT_CLIENT] MQTT客戶端斷開連接 - 錯誤碼: {rc}, 客戶端ID: {client._client_id if hasattr(client, '_client_id') else 'unknown'}")
        self.is_connected = False

        # 自動重連
        if rc != 0:
            logger.info(f"[MQTT_CLIENT] 啟動自動重連機制 - {settings.MQTT_RECONNECT_DELAY}秒後重試")
            asyncio.create_task(self._reconnect())

    def _on_message(self, client, userdata, msg):
        """訊息接收回調"""
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')

            logger.info(f"[MQTT_CLIENT] 收到MQTT訊息 - 主題: {topic}, 內容長度: {len(payload)} bytes")

            # 呼叫對應的主題處理器
            if topic in self._message_handlers:
                logger.debug(f"[MQTT_CLIENT] 呼叫主題處理器 - 主題: {topic}")
                asyncio.create_task(self._message_handlers[topic](topic, payload))
            else:
                logger.debug(f"[MQTT_CLIENT] 未註冊的主題處理器 - 主題: {topic}")

        except Exception as e:
            logger.error(f"[MQTT_CLIENT] 處理MQTT訊息時發生錯誤 - 主題: {msg.topic}, 錯誤: {e}")

    async def _reconnect(self):
        """自動重連"""
        logger.info(f"[MQTT_CLIENT] 嘗試重新連接MQTT Broker - 延遲: {settings.MQTT_RECONNECT_DELAY}秒")
        await asyncio.sleep(settings.MQTT_RECONNECT_DELAY)
        logger.info(f"[MQTT_CLIENT] 執行MQTT重新連接...")
        await self.connect()

    async def connect(self) -> bool:
        """連接MQTT Broker"""
        async with self._connect_lock:
            try:
                if self.is_connected:
                    logger.info(f"[MQTT_CLIENT] MQTT客戶端已經連接 - 客戶端ID: {settings.MQTT_CLIENT_ID}")
                    return True

                logger.info(f"[MQTT_CLIENT] 開始連接MQTT Broker - 主機: {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}, 客戶端ID: {settings.MQTT_CLIENT_ID}")

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
                    logger.info(f"[MQTT_CLIENT] 使用認證連接 - 用戶名: {settings.MQTT_USERNAME}")

                # 連接MQTT Broker
                logger.info(f"[MQTT_CLIENT] 連接MQTT Broker: {settings.MQTT_BROKER_HOST}:{settings.MQTT_BROKER_PORT}")
                self.client.connect(
                    settings.MQTT_BROKER_HOST,
                    settings.MQTT_BROKER_PORT,
                    keepalive=settings.MQTT_KEEPALIVE
                )

                # 啟動網路循環（在背景執行）
                self.client.loop_start()
                logger.info(f"[MQTT_CLIENT] MQTT網路循環已啟動")

                # 等待連接建立
                retry_count = 0
                max_retries = 10
                while not self.is_connected and retry_count < max_retries:
                    await asyncio.sleep(0.5)
                    retry_count += 1

                if self.is_connected:
                    logger.info(f"[MQTT_CLIENT] MQTT客戶端連接建立成功 - 重試次數: {retry_count}")
                    return True
                else:
                    logger.error(f"[MQTT_CLIENT] MQTT客戶端連接建立失敗 - 重試次數: {retry_count}")
                    return False

            except Exception as e:
                logger.error(f"[MQTT_CLIENT] 連接MQTT Broker時發生錯誤: {e}")
                return False

    async def disconnect(self):
        """斷開MQTT連接"""
        async with self._connect_lock:
            if self.client:
                logger.info(f"[MQTT_CLIENT] 開始斷開MQTT連接 - 客戶端ID: {self.client._client_id if hasattr(self.client, '_client_id') else 'unknown'}")
                self.client.loop_stop()
                self.client.disconnect()
                self.is_connected = False
                logger.info(f"[MQTT_CLIENT] MQTT客戶端已斷開連接")
            else:
                logger.warning(f"[MQTT_CLIENT] 嘗試斷開連接但客戶端為None")

    def subscribe(self, topic: str, handler: Callable = None):
        """訂閱主題"""
        if not self.client or not self.is_connected:
            logger.error(f"[MQTT_CLIENT] MQTT客戶端未連接，無法訂閱主題 - Topic: {topic}")
            return False

        try:
            if handler:
                self._message_handlers[topic] = handler
                logger.info(f"[MQTT_CLIENT] 註冊訊息處理器 - Topic: {topic}")

            logger.info(f"[MQTT_CLIENT] 訂閱主題 - Topic: {topic}")
            result = self.client.subscribe(topic)
            if result[0] == 0:
                logger.info(f"[MQTT_CLIENT] 成功訂閱主題 - Topic: {topic}, 結果碼: {result[0]}")
                return True
            else:
                logger.error(f"[MQTT_CLIENT] 訂閱主題失敗 - Topic: {topic}, 結果碼: {result[0]}")
                return False
        except Exception as e:
            logger.error(f"[MQTT_CLIENT] 訂閱主題時發生錯誤 - Topic: {topic}, 錯誤: {e}")
            return False

    def unsubscribe(self, topic: str):
        """取消訂閱主題"""
        if not self.client or not self.is_connected:
            logger.error("MQTT客戶端未連接，無法取消訂閱主題")
            return False

        try:
            if topic in self._message_handlers:
                del self._message_handlers[topic]

            result = self.client.unsubscribe(topic)
            if result[0] == 0:
                logger.info(f"成功取消訂閱主題: {topic}")
                return True
            else:
                logger.error(f"取消訂閱主題失敗: {topic}")
                return False
        except Exception as e:
            logger.error(f"取消訂閱主題時發生錯誤: {e}")
            return False

    def publish(self, topic: str, payload: Dict[str, Any], qos: int = 0) -> bool:
        """發佈訊息"""
        if not self.client or not self.is_connected:
            logger.error(f"[MQTT_CLIENT] MQTT客戶端未連接，無法發佈訊息 - Topic: {topic}")
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
                logger.info(f"[MQTT_CLIENT] 成功發佈訊息到主題 {topic} - 結果碼: {result[0]}")
                mqtt_logger.info(f"[MQTT_PUBLISH] 發佈成功 - 主題: {topic}, 結果碼: {result[0]}")
                return True
            else:
                logger.error(f"[MQTT_CLIENT] 發佈訊息失敗 - 主題: {topic}, 結果碼: {result[0]}")
                mqtt_logger.error(f"[MQTT_PUBLISH] 發佈失敗 - 主題: {topic}, 結果碼: {result[0]}")
                return False

        except Exception as e:
            logger.error(f"[MQTT_CLIENT] 發佈訊息時發生錯誤 - 主題: {topic}, 錯誤: {e}")
            mqtt_logger = logging.getLogger('mqtt')
            mqtt_logger.error(f"[MQTT_PUBLISH] 發佈異常 - 主題: {topic}, 錯誤: {e}")
            return False

    def is_alive(self) -> bool:
        """檢查客戶端是否正常連接"""
        return self.is_connected and self.client.is_connected() if self.client else False

# 全域MQTT客戶端實例
mqtt_client = MQTTClient()