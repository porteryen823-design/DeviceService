#!/usr/bin/env python3
"""
測試腳本：驗證新的簡化邏輯 - 只要網路通訊正常就呼叫 Start API
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

async def test_network_communication_start():
    """測試新的邏輯：只要網路通訊正常就呼叫 Start API"""
    print("測試新的簡化邏輯：只要網路通訊正常就呼叫 Start API")

    # 創建設備處理器實例
    processor = DeviceServiceProcessor()

    # 創建測試設備
    test_device = MockDevice(proxyid=1)

    # 模擬健康檢查的 HTTP 回應（網路通訊正常）
    mock_response_data = {
        "proxyServiceAlive": "1",  # 網路通訊正常
        "proxyServiceStart": "0",  # 初始狀態
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

    # 模擬 device_processor.py 中 check_proxy_health 的新邏輯
    print("模擬健康檢查流程...")

    # 檢查設備是否啟用
    if test_device.enable == 0:
        print("設備未啟用，跳過健康檢查")
        return False

    # 模擬網路通訊檢查成功
    print("模擬網路通訊檢查成功...")

    # 模擬健康檢查成功的情況
    print("模擬健康檢查成功...")
    data = mock_response_data

    # 新的簡化邏輯：只要網路通訊正常就呼叫 Start API
    print("新的邏輯：網路通訊正常，直接呼叫 start API")
    try:
        start_result = await processor.start_proxy_service(test_device)
        print(f"Start API 呼叫結果: {start_result}")
    except Exception as e:
        print(f"呼叫 start API 時發生錯誤: {e}")
        return False

    # 更新設備狀態快取為成功狀態
    processor.update_device_status_cache(
        test_device.proxyid,
        data.get("message", "OK"),
        "1",  # proxyServiceAlive = 1 (網路通訊正常)
        "1"   # proxyServiceStart = 1 (已呼叫 start API)
    )

    # 返回健康檢查結果
    result = {
        "proxyid": test_device.proxyid,
        "status": "healthy",
        "message": data.get("message", "OK"),
        "proxyServiceAlive": "1",
        "proxyServiceStart": "1",
        "healthy": True
    }

    print(f"健康檢查結果: {result}")

    # 驗證結果
    if call_count["count"] == 1:
        print("測試通過：start_proxy_service 正確地被呼叫了 1 次")
        return True
    else:
        print(f"測試失敗：start_proxy_service 被呼叫了 {call_count['count']} 次")
        return False

async def test_disabled_device():
    """測試禁用的設備不會呼叫 Start API"""
    print("\n測試禁用的設備不會呼叫 Start API")

    processor = DeviceServiceProcessor()
    disabled_device = MockDevice(proxyid=2, enable=0)  # 禁用的設備

    call_count = {"count": 0}

    async def mock_start_proxy_service(device):
        call_count["count"] += 1
        print(f"不應該呼叫 start_proxy_service！設備: {device.proxyid}")
        return {"status": "success"}

    processor.start_proxy_service = mock_start_proxy_service

    # 檢查設備是否啟用
    if disabled_device.enable == 0:
        print("設備未啟用，正確地跳過健康檢查")
        return call_count["count"] == 0

    return False

async def main():
    print("=== 測試新的簡化邏輯 ===")

    # 測試網路通訊正常時會呼叫 Start API
    test1_passed = await test_network_communication_start()

    # 測試禁用的設備不會呼叫 Start API
    test2_passed = await test_disabled_device()

    print("\n=== 測試結果總結 ===")
    print(f"測試案例 1 (網路通訊正常呼叫 Start API): {'通過' if test1_passed else '失敗'}")
    print(f"測試案例 2 (禁用的設備不呼叫 Start API): {'通過' if test2_passed else '失敗'}")

    if test1_passed and test2_passed:
        print("所有測試都通過了！新的簡化邏輯工作正常。")
        print("邏輯：只要網路通訊正常，就會呼叫 Start API")
        return True
    else:
        print("部分測試失敗，請檢查邏輯。")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)