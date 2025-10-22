import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..models.device import Device, DeviceCreate, DeviceUpdate
from ..repositories.device_repository import DeviceRepository

logger = logging.getLogger(__name__)

class DeviceServiceManager:
    def __init__(self, db: Session):
        self.db = db
        self.device_repository = DeviceRepository(db)

    def get_health_status(self) -> dict:
        """獲取服務健康狀態"""
        return {
            "message": "Device Service is running",
            "version": "1.0.0"
        }

    def get_all_devices(self) -> list[Device]:
        """獲取所有設備服務配置"""
        return self.device_repository.get_all_devices()

    def get_device(self, proxyid: int) -> Device | None:
        """獲取特定設備服務配置"""
        return self.device_repository.get_device(proxyid)

    def create_device(self, device_data: DeviceCreate) -> Device:
        """建立新設備服務配置"""
        logger.info(f"Creating device with proxyid: {device_data.proxyid}")
        device = self.device_repository.create_device(device_data)
        logger.info(f"Device created successfully: {device.proxyid}")
        return device

    def update_device(self, proxyid: int, device_update: DeviceUpdate) -> Device | None:
        """更新設備服務配置"""
        logger.info(f"Updating device with proxyid: {proxyid}")
        device = self.device_repository.update_device(proxyid, device_update)
        if device:
            logger.info(f"Device updated successfully: {proxyid}")
        else:
            logger.warning(f"Device not found for update: {proxyid}")
        return device

    def delete_device(self, proxyid: int) -> Device | None:
        """刪除設備服務配置"""
        logger.info(f"Deleting device with proxyid: {proxyid}")
        device = self.device_repository.delete_device(proxyid)
        if device:
            logger.info(f"Device deleted successfully: {proxyid}")
        else:
            logger.warning(f"Device not found for deletion: {proxyid}")
        return device

    def start_proxy(self, proxyid: int) -> dict:
        """啟動代理服務"""
        logger.info(f"Starting proxy service: {proxyid}")
        device = self.get_device(proxyid)
        if not device:
            return {"error": f"Device with proxyid {proxyid} not found"}

        # TODO: 呼叫下位機的 start API
        # result = call_proxy_api(device.proxy_ip, device.proxy_port, "start")


        return {"message": f"Proxy service {proxyid} start initiated"}

    def stop_proxy(self, proxyid: int) -> dict:
        """停止代理服務"""
        logger.info(f"Stopping proxy service: {proxyid}")
        device = self.get_device(proxyid)
        if not device:
            return {"error": f"Device with proxyid {proxyid} not found"}

        # TODO: 呼叫下位機的 stop API
        # result = call_proxy_api(device.proxy_ip, device.proxy_port, "stop")


        return {"message": f"Proxy service {proxyid} stop initiated"}

    def pause_proxy(self, proxyid: int) -> dict:
        """暫停代理服務"""
        logger.info(f"Pausing proxy service: {proxyid}")
        device = self.get_device(proxyid)
        if not device:
            return {"error": f"Device with proxyid {proxyid} not found"}

        # TODO: 呼叫下位機的 pause API
        # result = call_proxy_api(device.proxy_ip, device.proxy_port, "pause")


        return {"message": f"Proxy service {proxyid} pause initiated"}

    def resume_proxy(self, proxyid: int) -> dict:
        """恢復代理服務"""
        logger.info(f"Resuming proxy service: {proxyid}")
        device = self.get_device(proxyid)
        if not device:
            return {"error": f"Device with proxyid {proxyid} not found"}

        # TODO: 呼叫下位機的 resume API
        # result = call_proxy_api(device.proxy_ip, device.proxy_port, "resume")


        return {"message": f"Proxy service {proxyid} resume initiated"}

    def get_proxy_status(self, proxyid: Optional[int] = None) -> dict | list:
        """獲取代理服務狀態（從 device_status_cache 讀取）"""
        from .device_processor import device_processor

        logger.info(f"Getting proxy status for proxyid: {proxyid}")

        if proxyid:
            # 從 device_status_cache 獲取設備狀態
            device_status = device_processor.get_device_status_from_cache(proxyid)
            logger.info(f"Device status from cache for proxyid {proxyid}: {device_status}")

            if device_status:
                logger.info(f"Returning cached status for proxyid {proxyid}: {device_status}")
                return device_status
            else:
                # 如果快取中沒有資料，從資料庫獲取設備基本資訊
                device = self.get_device(proxyid)
                if not device:
                    logger.warning(f"Device with proxyid {proxyid} not found in database")
                    return {"error": f"Device with proxyid {proxyid} not found"}

                # 返回設備基本資訊，但狀態設為預設值
                default_status = {
                    "proxyid": proxyid,
                    "message": "NG",
                    "proxyServiceAlive": "0",
                    "proxyServiceStart": "0",
                    "controller_type": device.Controller_type,
                    "proxy_ip": device.proxy_ip,
                    "proxy_port": str(device.proxy_port),
                    "remark": device.remark
                }
                logger.info(f"Returning default status for proxyid {proxyid}: {default_status}")
                return default_status
        else:
            # 獲取所有代理服務狀態，從 device_status_cache 讀取
            all_device_status = device_processor.get_all_device_status_from_cache()
            logger.info(f"All device status from cache: {all_device_status}")

            if not all_device_status:
                # 如果快取為空，返回空列表
                logger.info("No device status in cache, returning empty list")
                return []

            # 將快取資料轉換為列表格式返回
            status_list = []
            for proxyid, status in all_device_status.items():
                status_list.append(status)

            logger.info(f"Returning status list with {len(status_list)} items")
            return status_list