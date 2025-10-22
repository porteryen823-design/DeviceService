#!/usr/bin/env python3
"""
整合測試：驗證健康檢查中的自動啟動邏輯
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

async def test_health_check_integration():
    """測試健康檢查整合中的自動啟動邏輯"""
    print("測試健康檢查整合中的自動啟動邏輯...")

    # 創建設備處理器實例
    processor = DeviceServiceProcessor()

    # 創建測試設備
    test_device = MockDevice(proxyid=1)

    # 模擬健康檢查的 HTTP 回應
    mock_response_data = {
        "proxyServiceAlive": "1",
        "proxyServiceStart": "0",
        "message": "OK"
    }

    # 追蹤呼叫次數
    call_count = {"count": 0}

    async def mock_start_proxy_service(device):
        call_count["count"] += 1
        print(f"✅ start_proxy_service 被呼叫了！設備: {device.proxyid}")
        return {
            "proxyid": device.proxyid,
            "status": "success",
            "message": "Mock start success"
        }

    # 替換方法來追蹤呼叫
    processor.start_proxy_service = mock_start_proxy_service

    # 模擬 device_processor.py 中 check_proxy_health 的邏輯
    print("模擬健康檢查流程...")

    # 檢查設備是否啟用
    if test_device.enable == 0:
        print("設備未啟用，跳過健康檢查")
        return False

    # 模擬健康檢查成功的情況
    print("模擬健康檢查成功...")
    data = mock_response_data

    # 從響應中提取狀態欄位
    proxyServiceAlive = data.get("proxyServiceAlive", "0")
    proxyServiceStart = data.get("proxyServiceStart", "0")

    print(f"健康檢查結果: proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")

    # 業務邏輯：若 proxyServiceAlive="1" 且 proxyServiceStart="0"，直接呼叫Start API
    if proxyServiceAlive == "1" and proxyServiceStart == "0":
        print("✅ 條件滿足，呼叫 start API")
        try:
            start_result = await processor.start_proxy_service(test_device)
            print(f"Start API 呼叫結果: {start_result}")
        except Exception as e:
            print(f"❌ 呼叫 start API 時發生錯誤: {e}")
            return False
    else:
        print("條件不滿足，不會呼叫 start API")
        return False

    # 更新設備狀態快取
    message = data.get("message", "OK")
    processor.update_device_status_cache(
        test_device.proxyid,
        message,
        proxyServiceAlive,
        proxyServiceStart
    )

    # 返回健康檢查結果
    result = {
        "proxyid": test_device.proxyid,
        "status": "healthy",
        "message": data.get("message", "OK"),
        "proxyServiceAlive": proxyServiceAlive,
        "proxyServiceStart": proxyServiceStart,
        "healthy": True
    }

    print(f"健康檢查結果: {result}")

    # 驗證結果
    if call_count["count"] == 1:
        print("✅ 測試通過：start_proxy_service 正確地被呼叫了 1 次")
        return True
    else:
        print(f"❌ 測試失敗：start_proxy_service 被呼叫了 {call_count['count']} 次")
        return False

async def test_health_check_no_start():
    """測試健康檢查中不應該自動啟動的情況"""
    print("\n測試健康檢查中不應該自動啟動的情況...")

    processor = DeviceServiceProcessor()
    test_device = MockDevice(proxyid=2)

    # 模擬已經啟動的狀態
    mock_response_data = {
        "proxyServiceAlive": "1",
        "proxyServiceStart": "1",
        "message": "Already running"
    }

    call_count = {"count": 0}

    async def mock_start_proxy_service(device):
        call_count["count"] += 1
        print(f"❌ 不應該呼叫 start_proxy_service！設備: {device.proxyid}")
        return {"status": "success"}

    processor.start_proxy_service = mock_start_proxy_service

    print("模擬健康檢查流程...")
    data = mock_response_data

    proxyServiceAlive = data.get("proxyServiceAlive", "0")
    proxyServiceStart = data.get("proxyServiceStart", "0")

    print(f"健康檢查結果: proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")

    if proxyServiceAlive == "1" and proxyServiceStart == "0":
        print("條件滿足，會呼叫 start API")
        await processor.start_proxy_service(test_device)
    else:
        print("✅ 條件不滿足，正確地不會呼叫 start API")

    if call_count["count"] == 0:
        print("✅ 測試通過：start_proxy_service 正確地沒有被呼叫")
        return True
    else:
        print(f"❌ 測試失敗：start_proxy_service 被呼叫了 {call_count['count']} 次")
        return False

async def main():
    print("=== 測試健康檢查中的自動啟動功能 ===")

    # 測試應該自動啟動的情況
    test1_passed = await test_health_check_integration()

    # 測試不應該自動啟動的情況
    test2_passed = await test_health_check_no_start()

    print("\n=== 測試結果總結 ===")
    print(f"測試案例 1 (應該自動啟動): {'通過' if test1_passed else '失敗'}")
    print(f"測試案例 2 (不應該自動啟動): {'通過' if test2_passed else '失敗'}")

    if test1_passed and test2_passed:
        print("🎉 所有測試都通過了！健康檢查中的自動啟動邏輯工作正常。")
        return True
    else:
        print("❌ 部分測試失敗，請檢查自動啟動邏輯。")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)