import os
import logging

# 診斷日誌：顯示此檔案被載入
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("載入 app/config.py - 檢查匯出項目")

SHOULD_LOG_CHANGES = os.getenv("SHOULD_LOG_CHANGES", "False").lower() in ("true", "1", "yes")

# 診斷日誌：顯示此檔案中定義的變數
logger.debug(f"app/config.py 中定義的變數: {dir()}")
logger.debug(f"是否存在 settings 物件: {'settings' in dir()}")