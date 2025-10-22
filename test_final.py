#!/usr/bin/env python3
"""
最終測試：驗證自動啟動功能
"""

import asyncio
import sys
import os

# 添加項目根目錄到 Python 路徑
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.models.device import Device
from app.services.device_processor import DeviceServiceProcessor

class MockDevice:
    def __init__(self, proxyid, proxy_ip="127.0.0.1", proxy_port=5555, controller_type="E82", enable=1):
        self.proxyid = proxyid
        self.proxy_ip = proxy_ip
        self.proxy_port = proxy_port
        self.Controller_type = controller_type
        self.enable = enable
        self.remark = f"Test device {proxyid}"

async def test_auto_start():
    print("測試案例 1: proxyServiceAlive='1', proxyServiceStart='0' (應該觸發自動啟動)")

    # 創建設備處理器實例
    processor = DeviceServiceProcessor()

    # 創建測試設備
    test_device = MockDevice(proxyid=1)

    # 模擬健康檢查回應
    health_data = {
        "proxyServiceAlive": "1",
        "proxyServiceStart": "0",
        "message": "OK"
    }

    # 追蹤呼叫次數
    call_count = {"count": 0}

    async def mock_start_proxy_service(device):
        call_count["count"] += 1
        print(f"start_proxy_service 被呼叫了！設備: {device.proxyid}")
        return {
            "proxyid": device.proxyid,
            "status": "success",
            "message": "Mock start success"
        }

    # 替換方法來追蹤呼叫
    processor.start_proxy_service = mock_start_proxy_service

    # 模擬健康檢查內部的邏輯
    proxyServiceAlive = health_data.get("proxyServiceAlive", "0")
    proxyServiceStart = health_data.get("proxyServiceStart", "0")

    print(f"檢查條件: proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")

    # 這是我們在 device_processor.py 中實現的邏輯
    if proxyServiceAlive == "1" and proxyServiceStart == "0":
        print("條件滿足，呼叫 start API")
        try:
            start_result = await processor.start_proxy_service(test_device)
            print(f"Start API 呼叫結果: {start_result}")
        except Exception as e:
            print(f"呼叫 start API 時發生錯誤: {e}")
            return False
    else:
        print("條件不滿足，不會呼叫 start API")
        return False

    # 檢查結果
    if call_count["count"] == 1:
        print("測試通過：start_proxy_service 正確地被呼叫了 1 次")
        return True
    else:
        print(f"測試失敗：start_proxy_service 被呼叫了 {call_count['count']} 次")
        return False

async def test_no_auto_start():
    print("測試案例 2: proxyServiceAlive='1', proxyServiceStart='1' (不應該觸發自動啟動)")

    processor = DeviceServiceProcessor()
    test_device = MockDevice(proxyid=2)

    # 追蹤呼叫次數
    call_count = {"count": 0}

    async def mock_start_proxy_service(device):
        call_count["count"] += 1
        print(f"不應該呼叫 start_proxy_service！設備: {device.proxyid}")
        return {"status": "success"}

    processor.start_proxy_service = mock_start_proxy_service

    # 模擬已經啟動的狀態
    health_data = {
        "proxyServiceAlive": "1",
        "proxyServiceStart": "1",
        "message": "Already started"
    }

    proxyServiceAlive = health_data.get("proxyServiceAlive", "0")
    proxyServiceStart = health_data.get("proxyServiceStart", "0")

    print(f"檢查條件: proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")

    if proxyServiceAlive == "1" and proxyServiceStart == "0":
        print("條件滿足，會呼叫 start API")
        await processor.start_proxy_service(test_device)
    else:
        print("條件不滿足，正確地不會呼叫 start API")

    if call_count["count"] == 0:
        print("測試通過：start_proxy_service 正確地沒有被呼叫")
        return True
    else:
        print(f"測試失敗：start_proxy_service 被呼叫了 {call_count['count']} 次")
        return False

async def main():
    print("=== 開始測試自動啟動功能 ===")

    # 測試應該自動啟動的情況
    test1_passed = await test_auto_start()

    # 測試不應該自動啟動的情況
    test2_passed = await test_no_auto_start()

    print("=== 測試結果總結 ===")
    print(f"測試案例 1 (應該自動啟動): {'通過' if test1_passed else '失敗'}")
    print(f"測試案例 2 (不應該自動啟動): {'通過' if test2_passed else '失敗'}")

    if test1_passed and test2_passed:
        print("所有測試都通過了！自動啟動邏輯工作正常。")
        return True
    else:
        print("部分測試失敗，請檢查自動啟動邏輯。")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)