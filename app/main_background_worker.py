import asyncio
import logging
from .services.background_worker import BackgroundWorker
from .database import SessionLocal

# 設定日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

async def main():
    """啟動背景工作程序的主函數"""
    logger = logging.getLogger(__name__)
    logger.info("Starting background worker...")

    # 初始化資料庫會話
    db = SessionLocal()

    try:
        # 創建背景工作程序實例
        worker = BackgroundWorker(db)

        # 啟動背景工作程序
        worker.start()
        logger.info("Background worker started successfully")

        # 保持程序運行
        try:
            while True:
                await asyncio.sleep(3600)  # 每小時檢查一次是否還在運行
        except asyncio.CancelledError:
            logger.info("Background worker cancelled")
        finally:
            # 停止背景工作程序
            worker.stop()
            logger.info("Background worker stopped")

    except Exception as e:
        logger.error(f"Error in background worker: {e}", exc_info=True)
    finally:
        # 確保資料庫會話被關閉
        db.close()
        logger.info("Database session closed")

if __name__ == "__main__":
    """程式入口點"""
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBackground worker interrupted by user")
    except Exception as e:
        print(f"Background worker failed: {e}")