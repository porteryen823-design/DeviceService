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
        self.device_status_cache: Dict[int, Dict] = {}  # Added device status cache
        self.proxy_status_cache: Dict[int, str] = {}
        from ..config import SHOULD_LOG_CHANGES
        self.should_log_changes = SHOULD_LOG_CHANGES  # Added attribute to control logging changes

    def load_devices_to_cache(self, devices: List[Device]):
        """Load device data into memory cache"""
        logger.info(f"[CACHE_LOAD] Starting device cache load")
        
        # Clear and reload device cache
        self.device_cache.clear()
        
        for device in devices:
            self.device_cache[device.proxyid] = device
            
            # Only enabled devices create status cache
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
        """Get device data from cache"""
        return self.device_cache.get(proxyid)

    def get_all_cached_devices(self) -> List[Device]:
        """Get all cached device data"""
        return list(self.device_cache.values())

    async def check_proxy_health(self, device: Device) -> Dict:
        """Check proxy service health status"""
        logger.info(f"[HEALTH_CHECK] Starting health check for proxy {device.proxyid} (IP: {device.proxy_ip}:{device.proxy_port})")

        # If device is disabled (enable=0), skip the check
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

        # Check if port is accessible
        logger.debug(f"[HEALTH_CHECK] Checking port accessibility for proxy {int(device.proxyid)}")
        if not is_port_open(str(device.proxy_ip), int(device.proxy_port), timeout=0.2):
            logger.error(f"[HEALTH_CHECK] Port {int(device.proxy_port)} on {str(device.proxy_ip)} is not accessible for proxy {int(device.proxyid)}")
            logger.debug(f"[HEALTH_CHECK] Port check failed. Possible reasons: port in use, firewall blocking, or service not running.")

            # Update device status cache to port not accessible status
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

            health_params = {}  # Health check parameters, can add if needed

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=health_params, timeout=5.0)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"[HEALTH_CHECK] Health check response for proxy {int(device.proxyid)}: {data}")

                    # Network communication is OK, call Start API
                    logger.info(f"[HEALTH_CHECK] Network communication OK for device {int(device.proxyid)}, calling start API")
                    try:
                        start_result = await self.start_proxy_service(device)
                        logger.info(f"[HEALTH_CHECK] Start API result for device {int(device.proxyid)}: {start_result}")
                    except Exception as e:
                        logger.error(f"[HEALTH_CHECK] Error calling start API for device {int(device.proxyid)}: {e}")

                    # Update device status cache to success status
                    self.update_device_status_cache(
                        int(device.proxyid),
                        data.get("message", "OK"),
                        "1",  # proxyServiceAlive = 1 (network communication OK)
                        "1"   # proxyServiceStart = 1 (Start API called)
                    )

                    # Publish MQTT message - network communication OK
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
                    # Use the actual proxyid of the device
                    actual_proxyid = int(device.proxyid)
                    mqtt_publisher.publish_proxy_status_update(
                        proxyid=actual_proxyid,
                        status="healthy",
                        **mqtt_payload
                    )
                    logger.info(f"[HEALTH_CHECK] Published MQTT message for device {int(device.proxyid)}: network OK")

                    # Return health check result
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
                    # Create remove message and update cache if health API fails
                    error_message = f"HTTP {response.status_code}"

                    # Update device status cache to failed status
                    self.update_device_status_cache(
                        int(device.proxyid),
                        error_message,
                        "0",  # proxyServiceAlive
                        "0"   # proxyServiceStart
                    )

                    # Publish MQTT message - network communication failed
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
            # Create remove message and publish MQTT, and update cache on timeout
            timeout_message = "NG_Timeout"

            # Update device status cache to timeout status
            self.update_device_status_cache(
                int(device.proxyid),
                timeout_message,
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            # Publish MQTT message - on timeout
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
            # Create remove message and publish MQTT, and update cache on exception
            exception_message = f"Error: {str(e)}"

            # Update device status cache to exception status
            self.update_device_status_cache(
                int(device.proxyid),
                exception_message,
                "0",  # proxyServiceAlive
                "0"   # proxyServiceStart
            )

            # Publish MQTT message - on exception
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
        """Call the lower machine to start the service"""
        # Check if port is accessible
        if not is_port_open(str(device.proxy_ip), int(device.proxy_port), timeout=0.2):
            logger.error(f"Port {device.proxy_port} on {device.proxy_ip} is not accessible for proxy {device.proxyid}")

            # Update device status cache to port not accessible status
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

            # Prepare JSON data to send
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

                    # Update cache status
                    self.proxy_status_cache[int(device.proxyid)] = "starting"

                    # [Key Fix] Update device status cache, set proxyServiceStart to "1"
                    self.update_device_status_cache(
                        int(device.proxyid),
                        data.get("message", "Proxy service start initiated"),
                        "1",  # proxyServiceAlive = 1
                        "1"   # proxyServiceStart = 1 (changed from 0 to 1, this is the key fix)
                    )
                    logger.info(f"[START_PROXY] Updated device status cache for proxy {int(device.proxyid)}: proxyServiceStart changed to '1'")

                    return {
                        "proxyid": int(device.proxyid),
                        "status": "success",
                        "message": data.get("message", "Proxy service start initiated"),
                        "result": data
                    }
                else:
                    # Update cache status
                    self.proxy_status_cache[int(device.proxyid)] = "wait starting"

                    # Update device status cache to failed status
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

            # Update device status cache to exception status
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
        """Update proxy service status cache"""
        self.proxy_status_cache[proxyid] = status
        logger.debug(f"Updated proxy status cache: {proxyid} -> {status}")

    def get_proxy_status_from_cache(self, proxyid: int) -> Optional[str]:
        """Get proxy service status from cache"""
        return self.proxy_status_cache.get(proxyid)

    def get_all_proxy_status_from_cache(self) -> Dict[int, str]:
        """Get all proxy service status cache"""
        return self.proxy_status_cache.copy()

    def update_device_status_cache(self, proxyid: int, message: str, proxyServiceAlive: str, proxyServiceStart: str):
        """Update device status cache"""
        if proxyid in self.device_status_cache:
            # Log original values
            original_status = self.device_status_cache[proxyid].copy()
            original_message = original_status.get('message', 'None')
            original_alive = original_status.get('proxyServiceAlive', 'None')
            original_start = original_status.get('proxyServiceStart', 'None')

            # Update device status cache
            self.device_status_cache[proxyid].update({
                'message': message,
                'proxyServiceAlive': proxyServiceAlive,
                'proxyServiceStart': proxyServiceStart
            })

            # Log new values and changes
            new_message = message
            new_alive = proxyServiceAlive
            new_start = proxyServiceStart

            # logger.info(f"[device_status_cache update log] proxyid={proxyid}")
            # logger.info(f"  Original -> message: '{original_message}', proxyServiceAlive: '{original_alive}', proxyServiceStart: '{original_start}'")
            if self.should_log_changes is True:
                logger.info(f"  New -> message: '{new_message}', proxyServiceAlive: '{new_alive}', proxyServiceStart: '{new_start}'")

            # Log changes if any
            changes = []
            if original_message != new_message:
                changes.append(f"message: '{original_message}' -> '{new_message}'")
            if original_alive != new_alive:
                changes.append(f"proxyServiceAlive: '{original_alive}' -> '{new_alive}'")
            if original_start != new_start:
                changes.append(f"proxyServiceStart: '{original_start}' -> '{new_start}'")

            if changes:
                if self.should_log_changes:
                    logger.info(f"  Changes: {', '.join(changes)}")
            else:
                if self.should_log_changes:
                    logger.info("  No status change")

            logger.debug(f"Updated device status cache for proxyid {proxyid}: message={message}, proxyServiceAlive={proxyServiceAlive}, proxyServiceStart={proxyServiceStart}")
        else:
            logger.warning(f"Proxyid {proxyid} not found in device_status_cache")

    def get_device_status_from_cache(self, proxyid: int) -> Optional[Dict]:
        """Get device status from cache"""
        return self.device_status_cache.get(proxyid)

    def get_all_device_status_from_cache(self) -> Dict[int, Dict]:
        """Get all device status cache"""
        return self.device_status_cache.copy()

# Global processor instance
device_processor = DeviceServiceProcessor()
