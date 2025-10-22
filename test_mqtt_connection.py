#!/usr/bin/env python3
"""
測試 MQTT 連線的簡單腳本
"""
import paho.mqtt.client as mqtt
import logging

# 設定日誌
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        logger.info("Test connection successful!")
        client.disconnect()
    else:
        logger.error(f"Test connection failed, return code: {rc}")

def on_disconnect(client, userdata, rc, reasonCode=None, properties=None):
    logger.info(f"Test connection disconnected, return code: {rc}")

def test_mqtt_connection():
    """測試 MQTT 連線"""
    client = mqtt.Client(client_id="test_connection", clean_session=True)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect

    try:
        logger.info("Attempting to connect to MQTT broker: 127.0.0.1:2834")
        client.connect("127.0.0.1", 2834, 60)
        client.loop_start()

        # 等待連線結果
        import time
        time.sleep(3)

        client.loop_stop()

    except Exception as e:
        logger.error(f"Connection error: {e}")

if __name__ == "__main__":
    test_mqtt_connection()