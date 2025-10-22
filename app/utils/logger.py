import logging
import os
import time
from datetime import datetime
from logging.handlers import RotatingFileHandler

class SizeAndTimeRotatingFileHandler(RotatingFileHandler):
    """自定義的日誌輪替處理器，結合大小和時間輪替"""

    def __init__(self, filename, maxBytes=20*1024*1024, backupCount=5, encoding=None, delay=False):
        """
        Args:
            filename: 日誌檔案名稱（不包含日期時間戳）
            maxBytes: 最大檔案大小（預設 20MB）
            backupCount: 保留的備份檔案數量
            encoding: 檔案編碼
            delay: 是否延遲創建檔案
        """
        # 生成帶有日期時間戳的檔案名稱
        timestamp = datetime.now().strftime("%Y%m%d_%H")
        name, ext = os.path.splitext(filename)
        timestamped_filename = f"{name}_{timestamp}{ext}"

        super().__init__(timestamped_filename, maxBytes=maxBytes, backupCount=backupCount,
                        encoding=encoding, delay=delay)

    def doRollover(self):
        """執行檔案輪替"""
        if self.stream:
            self.stream.close()
            self.stream = None

        # 生成新的檔案名稱（包含時間戳）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(self.baseFilename)
        new_filename = f"{name}_{timestamp}{ext}"

        if os.path.exists(self.baseFilename):
            # 將舊檔案移動到新名稱
            if not os.path.abspath(self.baseFilename) == os.path.abspath(new_filename):
                os.rename(self.baseFilename, new_filename)

        # 創建新的日誌檔案
        if not self.delay:
            self.stream = self._open()

def setup_logging(log_file="logs/device_service.log", mqtt_log_file="logs/mqtt.log", level="INFO"):
    """設定應用程式日誌系統"""

    # 確保 logs 目錄存在
    os.makedirs("logs", exist_ok=True)

    # 轉換日誌等級
    log_level = getattr(logging, level.upper(), logging.INFO)

    # 設定根 logger
    logger = logging.getLogger()
    logger.setLevel(log_level)

    # 清除現有的 handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # 創建格式器
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # 設定主日誌檔案（帶輪替功能）
    main_handler = SizeAndTimeRotatingFileHandler(
        log_file,
        maxBytes=20*1024*1024,  # 20MB
        backupCount=5
    )
    main_handler.setFormatter(formatter)
    main_handler.setLevel(log_level)
    logger.addHandler(main_handler)

    # 設定控制台輸出
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    logger.addHandler(console_handler)

    # 設定 MQTT 專用 logger
    mqtt_logger = logging.getLogger('mqtt')
    mqtt_logger.setLevel(log_level)

    # 清除 MQTT logger 現有的 handlers
    for handler in mqtt_logger.handlers[:]:
        mqtt_logger.removeHandler(handler)

    # MQTT 日誌檔案（帶輪替功能）
    mqtt_file_handler = SizeAndTimeRotatingFileHandler(
        mqtt_log_file,
        maxBytes=20*1024*1024,  # 20MB
        backupCount=5
    )
    mqtt_file_handler.setFormatter(formatter)
    mqtt_file_handler.setLevel(log_level)
    mqtt_logger.addHandler(mqtt_file_handler)

    # 避免 MQTT 日誌重複輸出到根 logger
    mqtt_logger.propagate = False

    return logger, mqtt_logger

def get_logger(name: str = None):
    """獲取指定名稱的 logger"""
    return logging.getLogger(name)

def test_logging():
    """測試日誌功能"""
    logger = get_logger(__name__)
    mqtt_logger = get_logger('mqtt')

    logger.info("測試一般日誌輸出")
    logger.warning("測試警告日誌")
    logger.error("測試錯誤日誌")

    mqtt_logger.info("測試 MQTT 日誌輸出")
    mqtt_logger.warning("測試 MQTT 警告日誌")
    mqtt_logger.error("測試 MQTT 錯誤日誌")

    print("日誌測試完成，請檢查 logs/ 目錄下的檔案")

if __name__ == "__main__":
    setup_logging()
    test_logging()