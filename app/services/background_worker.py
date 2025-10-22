import asyncio
import logging
import httpx
import socket
import time
from typing import List
from sqlalchemy.orm import Session
from ..models.device import Device
from ..repositories.device_repository import DeviceRepository
from ..config_mqtt import settings
from .device_processor import device_processor
from ..mqtt.publisher import mqtt_publisher

logger = logging.getLogger(__name__)

def is_port_open(ip: str, port: int, timeout: float = 2.0) -> bool:
    """檢查指定 IP 和連接埠是否可以連線"""
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

class BackgroundWorker:
    def __init__(self, db: Session):
        self.db = db
        self.device_repository = DeviceRepository(db)
        self.is_running = False
        self.task = None
        self.devices_loaded = False  # 新增標記，記錄設備資料是否已載入

    def start(self):
        """啟動背景工作程序"""
        if self.is_running:
            logger.warning("背景工作程序已經在運行中，跳過重複啟動")
            return

        self.is_running = True
        self.task = asyncio.create_task(self._run())
        logger.info("Background worker started")

    def stop(self):
        """停止背景工作程序"""
        if self.is_running:
            self.is_running = False
            if self.task:
                self.task.cancel()
            logger.info("Background worker stopped")

    def reset_device_cache(self):
        """重置設備快取標記（用於重新載入設備資料）"""
        self.devices_loaded = False
        logger.info("Device cache flag reset - will reload devices on next start")

    async def _run(self):
        """背景工作程序主循環"""
        while self.is_running:
            try:
                await self._execute_tasks()
                await asyncio.sleep(settings.BACKGROUND_WORKER_INTERVAL)  # 從設定檔讀取間隔時間
            except asyncio.CancelledError:
                logger.info("Background worker task cancelled")
                break
            except Exception as e:
                logger.error(f"Error in background worker: {e}", exc_info=True)
                await asyncio.sleep(1)  # 錯誤後等待1秒再繼續

    async def _execute_tasks(self):
        """執行背景任務"""
        try:
            logger.info("[BG_WORKER] Starting background task execution cycle")

            # 1. 從資料庫載入設備資料到快取
            logger.debug("[BG_WORKER] Loading devices to cache")
            await self._load_devices_to_cache()

            # 2. 檢查所有代理服務的健康狀態
            logger.debug("[BG_WORKER] Checking all proxy health status")
            await self._check_all_proxy_health()

            # 3. 處理自動啟動服務（現在邏輯已在健康檢查內部處理）
            logger.debug("[BG_WORKER] Auto-start logic is now handled within health checks")

            logger.info("[BG_WORKER] Background task execution cycle completed")

        except Exception as e:
            logger.error(f"[BG_WORKER] Error executing background tasks: {e}", exc_info=True)

    async def _load_devices_to_cache(self):
        """載入設備資料到快取（僅在啟動時執行一次）"""
        if self.devices_loaded:
            logger.debug("[CACHE_LOAD] Devices already loaded, skipping reload to preserve status")
            return  # 如果已經載入過，直接返回，避免重置狀態快取

        try:
            logger.info("[CACHE_LOAD] Loading devices to cache for the first time")
            devices = self.device_repository.get_all_devices()

            # 【關鍵修復】載入設備時保留現有狀態快取
            device_processor.load_devices_to_cache(devices)
            self.devices_loaded = True  # 標記為已載入
            logger.info(f"[CACHE_LOAD] Loaded {len(devices)} devices to cache (one-time initialization)")

            # 發佈設備載入完成事件
            for device in devices:
                pass

        except Exception as e:
            logger.error(f"[CACHE_LOAD] Error loading devices to cache: {e}", exc_info=True)

    async def _check_all_proxy_health(self):
        """檢查所有代理服務的健康狀態（同步方式）"""
        try:
            logger.info("[HEALTH_SYNC] Starting synchronous health check for all proxy services")
            devices = device_processor.get_all_cached_devices()
            if not devices:
                logger.info("[HEALTH_SYNC] No devices found in cache, skipping health check")
                return

            # 【修復】同步逐個檢查所有代理服務健康狀態，並確保每個設備都被獨立處理
            processed_devices = []
            skipped_devices = []

            for current_device in devices:
                logger.info(f"[HEALTH_SYNC] ========== Processing device {current_device.proxyid} (enabled: {current_device.enable}) ==========")

                # 【修復】檢查設備狀態快取
                device_status = device_processor.get_device_status_from_cache(current_device.proxyid)
                if device_status:
                    current_message = device_status.get('message', 'Unknown')
                    logger.info(f"[HEALTH_SYNC] Device {current_device.proxyid} current status: {current_message}")
                else:
                    logger.warning(f"[HEALTH_SYNC] No status cache for device {current_device.proxyid}")

                # 【修復】確保啟用設備都被健康檢查
                if current_device.enable == 1:
                    logger.info(f"[HEALTH_SYNC] >>>>> Health checking enabled device {current_device.proxyid} <<<<<")
                    processed_devices.append(current_device.proxyid)

                    try:
                        # 同步調用健康檢查（需要將異步方法改為同步）
                        result = await device_processor.check_proxy_health(current_device)

                        if not isinstance(result, dict):
                            logger.error(f"[HEALTH_SYNC] Invalid result type for proxy {current_device.proxyid}: {type(result)}")
                            continue

                        proxyid = int(result["proxyid"]) # 確保 proxyid 為 int
                        proxyServiceAlive = result.get("proxyServiceAlive")
                        proxyServiceStart = result.get("proxyServiceStart")
                        message = result.get("message")
                        healthy = result.get("healthy", False)
                        cached_device = device_processor.get_cached_device(proxyid)
                        controller_type = cached_device.Controller_type if cached_device else "unknown"
                        

                        logger.info(f"[HEALTH_SYNC] Proxy {proxyid} health check result: proxyServiceStart={proxyServiceStart}, healthy={healthy}, message={message}")

                        # 發佈健康檢查結果到MQTT - 使用正確的設備變數
                        # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                        logger.info(f"[DEBUG] Would publish health check result for proxy {proxyid}: healthy={healthy}, response_time=0.0")
                        logger.debug(f"[HEALTH_SYNC] Published health check result for proxy {proxyid}: healthy={healthy}")

                        # 網路通訊正常，發佈服務運行狀態到MQTT
                        logger.debug(f"[HEALTH_SYNC] Proxy {proxyid} network communication OK, publishing running status")
                        
                        device_for_status = device_processor.get_cached_device(proxyid)
                        if device_for_status:
                            if healthy is True:
                                # 發佈服務運行狀態到MQTT
                                mqtt_publisher.publish_proxy_status_update(
                                    proxyid=proxyid,
                                    status="running",
                                    message="OK",
                                    proxyServiceAlive="1",
                                    proxyServiceStart="1",
                                    controller_type=device_for_status.Controller_type,
                                    proxy_ip=device_for_status.proxy_ip,
                                    proxy_port=str(device_for_status.proxy_port),
                                    remark=device_for_status.remark
                                )
                            else:                            
                                # 發佈服務運行狀態到MQTT
                                mqtt_publisher.publish_proxy_status_update(
                                    proxyid=proxyid,
                                    status="connet fail",
                                    message="NG",
                                    proxyServiceAlive="0",
                                    proxyServiceStart="0",
                                    controller_type=device_for_status.Controller_type,
                                    proxy_ip=device_for_status.proxy_ip,
                                    proxy_port=str(device_for_status.proxy_port),
                                    remark=device_for_status.remark
                                )
                                
                            logger.debug(f"[HEALTH_SYNC] Published running status for proxy {proxyid}")
                        else:
                            logger.warning(f"[HEALTH_SYNC] Device data not found in cache for status update, proxyid={proxyid}")

                    except httpx.TimeoutException:
                        logger.error(f"[HEALTH_SYNC] Timeout checking proxy health for device {current_device.proxyid}")
                        # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                        logger.info(f"[DEBUG] Would publish timeout event for proxy {current_device.proxyid}, type: health_check")
                    except httpx.ConnectError as e:
                        logger.error(f"[HEALTH_SYNC] Connection failed checking proxy health for device {current_device.proxyid}: {e}")
                        # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                        logger.info(f"[DEBUG] Would publish connection error for proxy {current_device.proxyid}, error: {e}")
                    except Exception as e:
                        logger.error(f"[HEALTH_SYNC] Error checking proxy health for device {current_device.proxyid}: {e}")
                        # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                        logger.info(f"[DEBUG] Would publish health check error for proxy {current_device.proxyid}, error: {e}")

            logger.info(f"[HEALTH_SYNC] Completed health check for {len(devices)} devices")

        except Exception as e:
            logger.error(f"[HEALTH_SYNC] Error in check_all_proxy_health: {e}", exc_info=True)

    async def _start_device_service(self, device: Device, reason: str) -> bool:
        """統一的設備服務啟動方法

        Args:
            device: 要啟動的設備
            reason: 啟動原因 ("health_check" 或 "auto_start")

        Returns:
            bool: 啟動是否成功
        """
        try:
            logger.info(f"Starting device service {device.proxyid}, reason: {reason}")

            
            # 檢查連接埠是否可通訊
            try:
                proxy_ip = str(device.proxy_ip) if device.proxy_ip is not None else ""
                proxy_port = int(device.proxy_port) if device.proxy_port is not None else 0
                if not is_port_open(proxy_ip, proxy_port, timeout=0.2):
                    logger.error(f"Port {proxy_port} on {proxy_ip} is not accessible for device {device.proxyid}")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish connection error for proxy {device.proxyid}: Port {device.proxy_port} not accessible")
                return False
            except Exception as e:
                logger.error(f"Error checking port accessibility: {e}")
                return False

            # 嘗試啟動服務
            success = await self._try_start_controller_service(device, int(device.proxyid) if device.proxyid else 0)

            if success:
                logger.info(f"[START_SERVICE] Successfully started device service {device.proxyid} via {reason}")

                # 【關鍵修復】更新設備狀態快取，將 proxyServiceStart 設為 "1"
                device_processor.update_device_status_cache(
                    device.proxyid,
                    "OK",
                    "1",  # proxyServiceAlive = 1
                    "1"   # proxyServiceStart = 1 （從 0 變為 1）
                )
                logger.info(f"[START_SERVICE] Updated device status cache for proxy {device.proxyid}: proxyServiceStart changed to '1'")

                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: started, OK")
                logger.debug(f"[START_SERVICE] Published MQTT status update for proxy {device.proxyid}")
            else:
                logger.error(f"[START_SERVICE] Failed to start device service {device.proxyid} via {reason}")

                # 【修復】更新設備狀態快取為失敗狀態
                device_processor.update_device_status_cache(
                    device.proxyid,
                    f"Failed to start via {reason}",
                    "1",  # proxyServiceAlive = 1 (仍然可以通訊)
                    "0"   # proxyServiceStart = 0 (啟動失敗)
                )
                logger.info(f"[START_SERVICE] Updated device status cache for failed start: proxy {device.proxyid}")

                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: start_failed, Failed to start via {reason}")

            return success

        except Exception as e:
            logger.error(f"Error starting device service {device.proxyid} via {reason}: {e}")
            # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
            logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: error, {str(e)}")
            return False

    async def _try_start_controller_service(self, device: Device, proxyid: int) -> bool:
        """嘗試呼叫 Controller 的 start API"""
        try:
            # 先檢查連接埠是否可通訊
            try:
                proxy_ip = str(device.proxy_ip) if device.proxy_ip is not None else ""
                proxy_port = int(device.proxy_port) if device.proxy_port is not None else 0
                if not is_port_open(proxy_ip, proxy_port, timeout=0.2):
                    logger.error(f"ProxyPort {proxy_port} on {proxy_ip} is not accessible for proxy {proxyid}")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish connection error for proxy {proxyid}: Port {device.proxy_port} not accessible")
                return False
            except Exception as e:
                logger.error(f"Error checking port accessibility: {e}")
                return False

            url = f"http://{proxy_ip}:{proxy_port}/start"
            logger.info(f"Calling Controller start API: {url} for proxy {proxyid}")

            # 準備要傳送的 JSON 資料
            start_data = {
                "proxyid": str(proxyid),
                "Controller_type": str(device.Controller_type),
                "proxy_ip": str(device.proxy_ip),
                "proxy_port": str(device.proxy_port),
                "remark": str(device.remark)
            }
            logger.info(f"Sending start data for proxy {proxyid}: {start_data}")

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=start_data, timeout=settings.CONTROLLER_API_TIMEOUT)

            logger.info(f"Controller API response for proxy {proxyid}: status_code={response.status_code}")

            if response.status_code == 200:
                data = response.json()
                logger.info(f"[START_API] Successfully started Controller service {proxyid}: {data}")

                # 【關鍵修復】Start API 成功後，立即更新狀態快取
                device_processor.update_device_status_cache(
                    proxyid,
                    data.get("message", "Controller service started successfully"),
                    "1",  # proxyServiceAlive = 1
                    "1"   # proxyServiceStart = 1 （這是最關鍵的修復）
                )
                logger.info(f"[START_API] Updated device status cache for proxy {proxyid}: proxyServiceStart changed to '1'")

                return True
            elif response.status_code == 404:
                # 如果 Controller API 404，建立移除訊息
                logger.warning(f"Controller service {proxyid} not found (404), marking as removed")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish controller start result for proxy {proxyid}: False, Controller service not found (404)")
                return False
            else:
                logger.error(f"Failed to start Controller service {proxyid}: HTTP {response.status_code}")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish controller start result for proxy {proxyid}: False, HTTP {response.status_code}")
                return False

        except httpx.TimeoutException:
            logger.error(f"Timeout calling Controller start API for proxy {proxyid} (timeout: {settings.CONTROLLER_API_TIMEOUT}s) - marking as removed")
            # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
            logger.info(f"[DEBUG] Would publish timeout event for proxy {proxyid}, type: controller_start")
            return False
        except httpx.ConnectError as e:
            logger.error(f"Connection failed for Controller service {proxyid}: {e} - marking as removed")
            # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
            logger.info(f"[DEBUG] Would publish connection error for proxy {proxyid}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error calling Controller start API for proxy {proxyid}: {e} - marking as removed")
            # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
            logger.info(f"[DEBUG] Would publish controller start result for proxy {proxyid}: False, {str(e)}")
            return False

    async def _process_auto_start_services(self):
        """處理自動啟動服務"""
        try:
            logger.info("[AUTO_START] Starting auto-start process for enabled devices")
            devices = device_processor.get_all_cached_devices()

            for device in devices:
                # 檢查設備是否啟用
                if device.enable == 1:  # 啟用的設備
                    logger.info(f"[AUTO_START] Processing enabled device {device.proxyid}")

                    # 檢查設備狀態快取，決定是否需要自動啟動
                    device_status = device_processor.get_device_status_from_cache(device.proxyid)
                    if device_status:
                        proxyServiceStart = device_status.get("proxyServiceStart", "0")
                        proxyServiceAlive = device_status.get("proxyServiceAlive", "0")

                        logger.info(f"[AUTO_START] Device {device.proxyid} status - proxyServiceStart: {proxyServiceStart}, proxyServiceAlive: {proxyServiceAlive}")

                        if proxyServiceStart == "0" and proxyServiceAlive == "1":
                            # 下位可以通訊但未下達Start命令，進行自動啟動
                            logger.info(f"[AUTO_START] Auto-starting device {device.proxyid} (can communicate but no start command)")
                            await self._start_device_service(device, "auto_start")
                        elif proxyServiceStart == "0" and proxyServiceAlive == "0":
                            # 下位無法通訊，記錄狀態但不啟動
                            logger.warning(f"[AUTO_START] Device {device.proxyid} cannot communicate (proxyServiceAlive: 0), skipping auto-start")
                        else:
                            # 服務已經運行中
                            logger.debug(f"[AUTO_START] Device {device.proxyid} already running (proxyServiceStart: 1)")
                    else:
                        logger.warning(f"[AUTO_START] No status cache found for device {device.proxyid}, attempting start anyway")
                        await self._start_device_service(device, "auto_start")
                else:
                    logger.debug(f"[AUTO_START] Device {device.proxyid} is disabled (enable={device.enable}), skipping")

        except Exception as e:
            logger.error(f"[AUTO_START] Error in process_auto_start_services: {e}", exc_info=True)

    async def _start_disabled_proxy(self, device: Device):
        """啟動被禁用的代理服務"""
        try:
            logger.info(f"Starting disabled proxy service: {device.proxyid}")
            result = await device_processor.start_proxy_service(device)

            if result.get("status") == "success":
                logger.info(f"Successfully started proxy service {device.proxyid}")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: started, OK")
            else:
                logger.error(f"Failed to start proxy service {device.proxyid}: {result.get('message')}")
                # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
                logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: start_failed, {result.get('message', 'Unknown error')}")

        except Exception as e:
            logger.error(f"Error starting disabled proxy {device.proxyid}: {e}")
            # 【DEBUG】暫時註釋MQTT調用，僅記錄日誌
            logger.info(f"[DEBUG] Would publish proxy service status for proxy {device.proxyid}: error, {str(e)}")

    def get_status(self) -> dict:
        """獲取背景工作程序狀態"""
        return {
            "is_running": self.is_running,
            "cached_devices_count": len(device_processor.get_all_cached_devices()),
            "cached_status_count": len(device_processor.get_all_device_status_from_cache())
        }