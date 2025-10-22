import socket
import logging

logger = logging.getLogger(__name__)

def is_port_open(ip: str, port: int, timeout: float = 0.5) -> bool:
    """檢查指定 IP 和連接埠是否可以連線"""
    try:
        with socket.create_connection((ip, port), timeout=timeout):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False