import logging
import httpx
import asyncio
from typing import Dict, List, Optional
from ..models.device import Device
from ..utils.network import is_port_open

logger = logging.getLogger(__name__)

class DeviceServiceProcessor:
    def __init__(self):
        self.device_cache: Dict[int, Device] = {}
        self.device_status_cache: Dict[int, Dict] = {}  # 新增的設備狀態快取
        self.proxy_status_cache: Dict[int, str] = {}
        from ..config import SHOULD_LOG_CHANGES
        self.should_log_changes = SHOULD_LOG_CHANGES  # 新增屬性，控制是否記錄變化

    def load_devices_to_cache(self, devices: List[Device]):
        """將設備資料載入到記憶體快取"""
        logger.info(f"[CACHE_LOAD] Starting device cache load")
        
        # 清空並重新載入設備快取
        self.device_cache.clear()
        
        for device in devices:
            self.device_cache[device.proxyid] = device
            
            # 只有啟用的設備才建立狀態快取
            if device.enable == 1:
                self.device_status_cache[device.proxyid] = {
                    'message': 'OK',
                    'proxyid': device.proxyid,
                    'proxyServiceAlive': '0',
                    'proxyServiceStart': '0',
                    'controller_type': str(device.Controller_type or "unknown"),
                    'proxy_ip': str(device.proxy_ip or "unknown"),
                    'proxy_port': str(device.proxy_port or "0"),
                    'remark': str(device.remark or "unknown")
                }
        
        logger.info(f"[CACHE_LOAD] Cache load completed: {len(devices)} devices loaded")
        logger.info(f"[CACHE_LOAD] Device status cache now contains {len(self.device_status_cache)} entries")



    def get_cached_device(self, proxyid: int) -> Optional[Device]:
        """從快取獲取設備資料"""
        return self.device_cache.get(proxyid)

    def get_all_cached_devices(self) -> List[Device]:
        """獲取所有快取的設備資料"""
        return list(self.device_cache.values())


    async def check_proxy_health(self, device: Device) -> Dict:
        """檢查代理服務健康狀態"""
        logger.info(f"[HEALTH_CHECK] Starting health check for proxy {device.proxyid} (IP: {device.proxy_ip}:{device.proxy_port})")

        # 如果設備未啟用(enable=0)，則不檢查直接略過
        if device.enable == 0:
            logger.info(f"[HEALTH_CHECK] Skipping health check for disabled proxy {int(device.proxyid)} (enable=0)")
            return {
                "proxyid": int(device.proxyid),
                "status": "disable",
                "message": "Device disabled",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "needs_start": False,
                "healthy": False
            }

        # 檢查埠是否可連線
        logger.debug(f"[HEALTH_CHECK] Checking port accessibility for proxy {int(device.proxyid)}")
        if not is_port_open(str(device.proxy_ip), int(device.proxy_port), timeout=0.2):
            logger.error(f"[HEALTH_CHECK] Port {int(device.proxy_port)} on {str(device.proxy_ip)} is not accessible for proxy {int(device.proxyid)}")
            logger.debug(f"[HEALTH_CHECK] Port check failed. Possible reasons: port in use, firewall blocking, or service not running.")

            # 更新設備狀態快取為端口無法訪問狀態
            self.update_device_status_cache(
                proxyid=int(device.proxyid),
                message="Proxy Port not accessible",
                proxyServiceAlive="0", 
                proxyServiceStart="0" 
            )

            return {
                "proxyid": int(device.proxyid),
                "status": "unreachable",
                "message": "proxy Port not accessible",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "needs_start": False,
                "healthy": False
            }

        try:
            url = f"http://{str(device.proxy_ip)}:{int(device.proxy_port)}/Health"
            logger.info(f"Checking health for proxy {int(device.proxyid)} at {url}")

            health_params = {}  # 健康檢查參數，如果需要可以添加

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=health_params, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"[HEALTH_CHECK] Health check response for proxy {int(device.proxyid)}: {data}")

                    # 網路通訊正常，直接呼叫 Start API
                    logger.info(f"[HEALTH_CHECK] Network communication OK for device {int(device.proxyid)}, calling start API")
                    try:
                        start_result = await self.start_proxy_service(device)
                        logger.info(f"[HEALTH_CHECK] Start API result for device {int(device.proxyid)}: {start_result}")
                    except Exception as e:
                        logger.error(f"[HEALTH_CHECK] Error calling start API for device {int(device.proxyid)}: {e}")

                    # 更新設備狀態快取為成功狀態
                    self.update_device_status_cache(
                        int(device.proxyid),
                        data.get("message", "OK"),
                        "1",  # proxyServiceAlive = 1 (網路通訊正常)
                        "1"   # proxyServiceStart = 1 (已呼叫 start API)
                    )

                    # 發佈MQTT訊息 - 網路通訊正常時
                    from ..mqtt.publisher import mqtt_publisher
                    mqtt_payload = {
                        "message": data.get("message", "OK"),
                        "proxyServiceAlive": "1",
                        "proxyServiceStart": "1",
                        "controller_type": str(device.Controller_type or "unknown"),
                        "proxy_ip": str(device.proxy_ip or "unknown"),
                        "proxy_port": str(device.proxy_port or "0"),
                        "remark": str(device.remark or "unknown")
                    }
                    # 使用設備的實際proxyid而不是回應中的proxyid
                    actual_proxyid = int(device.proxyid)
                    mqtt_publisher.publish_proxy_status_update(
                        proxyid=actual_proxyid,
                        status="healthy",
                        **mqtt_payload
                    )
                    logger.info(f"[HEALTH_CHECK] Published MQTT message for device {int(device.proxyid)}: network OK")

                    # 返回健康檢查結果
                    return {
                        "proxyid": int(device.proxyid),
                        "status": "healthy",
                        "message": data.get("message", "OK"),
                        "proxyServiceAlive": "1",
                        "proxyServiceStart": "1",
                        "needs_start": False,
                        "healthy": True
                    }
                else:
                    logger.warning(f"Health check failed for proxy {int(device.proxyid)}: HTTP {response.status_code}")
                    # 如果 Health API 失敗，建立移除訊息並更新快取
                    error_message = f"HTTP {response.status_code}"

                    # 更新設備狀態快取為失敗狀態
                    self.update_device_status_cache(
                        int(device.proxyid),
                        error_message,
                        "0",  # proxyServiceAlive
                        "0"   # proxyServiceStart
                    )

                    # 發佈MQTT訊息 - 網路通訊失敗時
                    from ..mqtt.publisher import mqtt_publisher
                    mqtt_payload = {
                        "message": "Request_NG",
                        "proxyServiceAlive": "0",
                        "proxyServiceStart": "0",
                        "controller_type": str(device.Controller_type or "unknown"),
                        "proxy_ip": str(device.proxy_ip or "unknown"),
                        "proxy_port": str(device.proxy_port or "0"),
                        "remark": str(device.remark or "unknown")
                    }
                    mqtt_publisher.publish_proxy_status_update(
                        proxyid=int(device.proxyid),
                        status="remove",
                        **mqtt_payload
                    )
                    logger.info(f"[HEALTH_CHECK] Published MQTT message for device {int(device.proxyid)}: network failed")

                    error_payload = {
                        "proxyid": int(device.proxyid),
                        "status": "remove",
                        "message":  "Request_NG",
                        "proxyServiceAlive":  "0",
                        "proxyServiceStart":  "0",
                        "needs_start": False,
                        "healthy": False
                    }
                    return error_payload
        except httpx.TimeoutException:
            logger.warning(f"Health check timeout for proxy {int(device.proxyid)}")
            # 超時時建立移除訊息並發送 MQTT，並更新快取
            timeout_message = "NG_Timeout"

            # 更新設備狀態快取為超時狀態
            self.update_device_status_cache(
                int(device.proxyid),
                timeout_message,
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            # 發佈MQTT訊息 - 超時時
            from ..mqtt.publisher import mqtt_publisher
            mqtt_payload = {
                "message": "NG_Timeout",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "controller_type": str(device.Controller_type or "unknown"),
                "proxy_ip": str(device.proxy_ip or "unknown"),
                "proxy_port": str(device.proxy_port or "0"),
                "remark": str(device.remark or "unknown")
            }
            mqtt_publisher.publish_proxy_status_update(
                proxyid=int(device.proxyid),
                status="remove",
                **mqtt_payload
            )
            logger.info(f"[HEALTH_CHECK] Published MQTT message for device {int(device.proxyid)}: timeout")

            timeout_payload = {
                "proxyid": int(device.proxyid),
                "status": "remove",
                "message": "NG_Timeout",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "needs_start": False,
                "healthy": False
            }
            return timeout_payload
        except Exception as e:
            logger.error(f"Error checking health for proxy {int(device.proxyid)}: {e}")
            # 發生異常時建立移除訊息並發送 MQTT，並更新快取
            exception_message = f"Error: {str(e)}"

            # 更新設備狀態快取為異常狀態
            self.update_device_status_cache(
                int(device.proxyid),
                exception_message,
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            # 發佈MQTT訊息 - 異常時
            from ..mqtt.publisher import mqtt_publisher
            mqtt_payload = {
                "message": "NG",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "controller_type": str(device.Controller_type or "unknown"),
                "proxy_ip": str(device.proxy_ip or "unknown"),
                "proxy_port": str(device.proxy_port or "0"),
                "remark": str(device.remark or "unknown")
            }
            mqtt_publisher.publish_proxy_status_update(
                proxyid=int(device.proxyid),
                status="remove",
                **mqtt_payload
            )
            logger.info(f"[HEALTH_CHECK] Published MQTT message for device {int(device.proxyid)}: exception")

            exception_payload = {
                "proxyid": int(device.proxyid),
                "status": "remove",
                "message": "NG",
                "proxyServiceAlive": "0",
                "proxyServiceStart": "0",
                "needs_start": False,
                "healthy": False
            }
            return exception_payload

    async def start_proxy_service(self, device: Device) -> Dict:
        """呼叫下位機啟動服務"""
        # 檢查埠是否可連線
        if not is_port_open(str(device.proxy_ip), int(device.proxy_port), timeout=0.2):
            logger.error(f"Port {device.proxy_port} on {device.proxy_ip} is not accessible for proxy {device.proxyid}")

            # 更新設備狀態快取為端口無法訪問狀態
            self.update_device_status_cache(
                device.proxyid,
                "proxy Port not accessible",
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            return {
                "proxyid": int(device.proxyid),
                "status": "error",
                "message": "Proxy Port not accessible"
            }

        try:
            url = f"http://{str(device.proxy_ip)}:{int(device.proxy_port)}/start"

            # 準備要傳送的 JSON 資料
            start_data = {
                "proxyid": str(int(device.proxyid)),
                "Controller_type": str(device.Controller_type),
                "proxy_ip": str(device.proxy_ip),
                "proxy_port": str(int(device.proxy_port)),
                "remark": str(device.remark) if device.remark else None
            }
            logger.info(f"Sending start data for proxy {int(device.proxyid)}: {start_data}")

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=start_data, timeout=2.0)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"[START_PROXY] Successfully started proxy service {int(device.proxyid)}: {data}")

                    # 更新快取狀態
                    self.proxy_status_cache[int(device.proxyid)] = "starting"

                    # 【關鍵修復】更新設備狀態快取，將 proxyServiceStart 設為 "1"
                    self.update_device_status_cache(
                        int(device.proxyid),
                        data.get("message", "Proxy service start initiated"),
                        "1",  # proxyServiceAlive = 1
                        "1"   # proxyServiceStart = 1 （從 0 變為 1，這是最重要的修復）
                    )
                    logger.info(f"[START_PROXY] Updated device status cache for proxy {int(device.proxyid)}: proxyServiceStart changed to '1'")

                    return {
                        "proxyid": int(device.proxyid),
                        "status": "success",
                        "message": data.get("message", "Proxy service start initiated"),
                        "result": data
                    }
                else:
                    # 更新快取狀態
                    self.proxy_status_cache[int(device.proxyid)] = "wait starting"

                    # 更新設備狀態快取為失敗狀態
                    self.update_device_status_cache(
                        int(device.proxyid),
                        f"HTTP {response.status_code}",
                        "0",  # proxyServiceAlive
                        "0"   # proxyServiceStart
                    )

                    return {
                        "proxyid": int(device.proxyid),
                        "status": "error",
                        "message": f"HTTP {response.status_code}",
                        "result": response.text
                    }
        except Exception as e:
            logger.error(f"Error starting proxy service {int(device.proxyid)}: {e}")

            # 更新設備狀態快取為異常狀態
            self.update_device_status_cache(
                int(device.proxyid),
                f"Error: {str(e)}",
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            return {
                "proxyid": int(device.proxyid),
                "status": "error",
                "message": str(e)
            }

    def update_proxy_status_cache(self, proxyid: int, status: str):
        """更新代理服務狀態快取"""
        self.proxy_status_cache[proxyid] = status
        logger.debug(f"Updated proxy status cache: {proxyid} -> {status}")

    def get_proxy_status_from_cache(self, proxyid: int) -> Optional[str]:
        """從快取獲取代理服務狀態"""
        return self.proxy_status_cache.get(proxyid)

    def get_all_proxy_status_from_cache(self) -> Dict[int, str]:
        """獲取所有代理服務狀態快取"""
        return self.proxy_status_cache.copy()

    def update_device_status_cache(self, proxyid: int, message: str, proxyServiceAlive: str, proxyServiceStart: str):
        """更新設備狀態快取"""
        if proxyid in self.device_status_cache:
            # 記錄更新前的原值
            original_status = self.device_status_cache[proxyid].copy()
            original_message = original_status.get('message', 'None')
            original_alive = original_status.get('proxyServiceAlive', 'None')
            original_start = original_status.get('proxyServiceStart', 'None')

            # 更新設備狀態快取
            self.device_status_cache[proxyid].update({
                'message': message,
                'proxyServiceAlive': proxyServiceAlive,
                'proxyServiceStart': proxyServiceStart
            })

            # 記錄更新後的新值和變化
            new_message = message
            new_alive = proxyServiceAlive
            new_start = proxyServiceStart

            # logger.info(f"[device_status_cache 更新記錄] proxyid={proxyid}")
            # logger.info(f"  原值 -> message: '{original_message}', proxyServiceAlive: '{original_alive}', proxyServiceStart: '{original_start}'")
            if self.should_log_changes is True:
                logger.info(f"  新值 -> message: '{new_message}', proxyServiceAlive: '{new_alive}', proxyServiceStart: '{new_start}'")

            # 如果有變化，額外記錄變化詳情
            changes = []
            if original_message != new_message:
                changes.append(f"message: '{original_message}' -> '{new_message}'")
            if original_alive != new_alive:
                changes.append(f"proxyServiceAlive: '{original_alive}' -> '{new_alive}'")
            if original_start != new_start:
                changes.append(f"proxyServiceStart: '{original_start}' -> '{new_start}'")

            if changes:
                if self.should_log_changes:
                    logger.info(f"  變化項目: {', '.join(changes)}")
            else:
                if self.should_log_changes:
                    logger.info("  狀態無變化")

            logger.debug(f"Updated device status cache for proxyid {proxyid}: message={message}, proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")
        else:
            logger.warning(f"Proxyid {proxyid} not found in device_status_cache")

    def get_device_status_from_cache(self, proxyid: int) -> Optional[Dict]:
        """從快取獲取設備狀態"""
        return self.device_status_cache.get(proxyid)

    def get_all_device_status_from_cache(self) -> Dict[int, Dict]:
        """獲取所有設備狀態快取"""
        return self.device_status_cache.copy()

# 全域處理器實例
device_processor = DeviceServiceProcessor()
