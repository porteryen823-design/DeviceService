#!/usr/bin/env python3
"""
MQTT整合測試腳本

測試MQTT功能的完整流程：
1. 測試MQTT客戶端連接
2. 測試MQTT訊息發佈
3. 測試MQTT訊息訂閱
4. 測試BackgroundWorker與MQTT整合
"""

import asyncio
import logging
import sys
import os

# 添加專案根目錄到Python路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.mqtt.client import mqtt_client
from app.mqtt.publisher import mqtt_publisher
from app.mqtt.handler import mqtt_handler
from app.config_mqtt import settings

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MQTTTester:
    """MQTT測試類別"""

    def __init__(self):
        self.received_messages = []

    async def test_mqtt_connection(self):
        """測試MQTT連接"""
        logger.info("測試MQTT連接...")
        try:
            connected = await mqtt_client.connect()
            if connected:
                logger.info("✅ MQTT連接成功")
                return True
            else:
                logger.error("❌ MQTT連接失敗")
                return False
        except Exception as e:
            logger.error(f"❌ MQTT連接測試失敗: {e}")
            return False

    async def test_message_publishing(self):
        """測試MQTT訊息發佈"""
        logger.info("測試MQTT訊息發佈...")

        try:
            # 測試發佈健康檢查結果
            success = mqtt_publisher.publish_health_check_result(
                proxyid=1,
                healthy=True,
                response_time=0.1
            )

            if success:
                logger.info("✅ 健康檢查結果發佈成功")
            else:
                logger.error("❌ 健康檢查結果發佈失敗")
                return False

            # 測試發佈代理服務狀態
            success = mqtt_publisher.publish_proxy_service_status(
                proxyid=1,
                status="running",
                message="OK",
                proxyServiceAlive="1",
                proxyServiceStart="1"
            )

            if success:
                logger.info("✅ 代理服務狀態發佈成功")
            else:
                logger.error("❌ 代理服務狀態發佈失敗")
                return False

            return True

        except Exception as e:
            logger.error(f"❌ MQTT訊息發佈測試失敗: {e}")
            return False

    async def test_message_subscription(self):
        """測試MQTT訊息訂閱"""
        logger.info("測試MQTT訊息訂閱...")

        try:
            # 註冊測試訊息處理器
            def test_handler(topic, payload):
                logger.info(f"收到測試訊息 - 主題: {topic}, 內容: {payload}")
                self.received_messages.append({"topic": topic, "payload": payload})

            # 訂閱測試主題
            mqtt_client.subscribe("mcs/test/response", test_handler)

            # 發佈測試訊息
            test_payload = {"message": "test", "timestamp": "2024-01-01T00:00:00Z"}
            mqtt_client.publish("mcs/test/request", test_payload)

            # 等待訊息接收
            await asyncio.sleep(2)

            # 檢查是否收到回應
            if len(self.received_messages) > 0:
                logger.info("✅ MQTT訊息訂閱測試成功")
                return True
            else:
                logger.error("❌ MQTT訊息訂閱測試失敗：未收到預期的訊息")
                return False

        except Exception as e:
            logger.error(f"❌ MQTT訊息訂閱測試失敗: {e}")
            return False

    async def test_background_worker_integration(self):
        """測試BackgroundWorker與MQTT整合"""
        logger.info("測試BackgroundWorker與MQTT整合...")

        try:
            from app.database import SessionLocal
            from app.services.background_worker import BackgroundWorker

            # 創建資料庫會話
            db = SessionLocal()

            try:
                # 創建BackgroundWorker實例
                worker = BackgroundWorker(db)

                # 檢查BackgroundWorker狀態
                status = worker.get_status()
                logger.info(f"BackgroundWorker狀態: {status}")

                # 啟動BackgroundWorker
                worker.start()
                logger.info("✅ BackgroundWorker啟動成功")

                # 等待一段時間讓BackgroundWorker執行
                await asyncio.sleep(3)

                # 檢查是否發佈了MQTT訊息
                # 注意：這需要實際的設備資料和下位機服務才能完整測試

                # 停止BackgroundWorker
                worker.stop()
                logger.info("✅ BackgroundWorker停止成功")

                return True

            finally:
                db.close()

        except Exception as e:
            logger.error(f"❌ BackgroundWorker整合測試失敗: {e}")
            return False

    async def run_all_tests(self):
        """執行所有測試"""
        logger.info("開始MQTT整合測試...")

        tests = [
            ("MQTT連接測試", self.test_mqtt_connection),
            ("MQTT訊息發佈測試", self.test_message_publishing),
            ("MQTT訊息訂閱測試", self.test_message_subscription),
            ("BackgroundWorker整合測試", self.test_background_worker_integration),
        ]

        results = []

        for test_name, test_func in tests:
            logger.info(f"\n{'='*50}")
            logger.info(f"執行測試: {test_name}")
            logger.info(f"{'='*50}")

            try:
                result = await test_func()
                results.append((test_name, result))

                if result:
                    logger.info(f"✅ {test_name} 通過")
                else:
                    logger.error(f"❌ {test_name} 失敗")

            except Exception as e:
                logger.error(f"❌ {test_name} 發生異常: {e}")
                results.append((test_name, False))

        # 輸出測試結果摘要
        logger.info(f"\n{'='*50}")
        logger.info("測試結果摘要:")
        logger.info(f"{'='*50}")

        passed = 0
        total = len(results)

        for test_name, result in results:
            status = "✅ 通過" if result else "❌ 失敗"
            logger.info(f"{test_name}: {status}")
            if result:
                passed += 1

        logger.info(f"\n總計: {passed}/{total} 個測試通過")

        if passed == total:
            logger.info("🎉 所有測試都通過了！")
            return True
        else:
            logger.error("❌ 部分測試失敗，請檢查MQTT設定和網路連接")
            return False

async def main():
    """主函數"""
    tester = MQTTTester()
    success = await tester.run_all_tests()

    # 關閉MQTT連接
    await mqtt_client.disconnect()

    # 退出程式
    exit_code = 0 if success else 1
    sys.exit(exit_code)

if __name__ == "__main__":
    asyncio.run(main())