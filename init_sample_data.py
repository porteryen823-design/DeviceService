#!/usr/bin/env python3
"""
初始化腳本：建立範例資料
執行方式：python init_sample_data.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.device import Device, Base

def init_database():
    """初始化資料庫和範例資料"""
    # 建立資料庫表格
    Base.metadata.create_all(bind=engine)
    print("資料庫表格建立完成")

    # 建立會話
    db = SessionLocal()
    try:
        # 檢查是否已有資料
        existing_count = db.query(Device).count()
        if existing_count > 0:
            print(f"資料庫中已有 {existing_count} 筆資料，跳過初始化")
            return

        # 插入範例資料
        sample_devices = [
            Device(
                proxyid=1,
                ip="127.0.0.1",
                port=5555,
                Controller_type="E82",
                Controller_ip="127.0.0.1",
                Controller_port=5100,
                remark="tsc1",
                enable=0,
                createUser="Wepapi"
            ),
            Device(
                proxyid=2,
                ip="127.0.0.1",
                port=5556,
                Controller_type="E88",
                Controller_ip="127.0.0.1",
                Controller_port=5101,
                remark="stk1",
                enable=0,
                createUser="Wepapi"
            ),
            Device(
                proxyid=3,
                ip="127.0.0.1",
                port=5557,
                Controller_type="E88",
                Controller_ip="127.0.0.1",
                Controller_port=5102,
                remark="stk2",
                enable=0,
                createUser="Wepapi"
            )
        ]

        for device in sample_devices:
            db.add(device)

        db.commit()
        print(f"成功插入 {len(sample_devices)} 筆範例資料")

        # 顯示插入的資料
        devices = db.query(Device).all()
        print("\n目前資料庫中的設備資料：")
        for device in devices:
            print(f"  proxyid={device.proxyid}, proxy_ip={device.proxy_ip}, proxy_port={device.proxy_port}, "
                  f"Controller_type={device.Controller_type}, Controller_ip={device.Controller_ip}, "
                  f"Controller_port={device.Controller_port}, remark={device.remark}, enable={device.enable}")

    except Exception as e:
        print(f"初始化資料時發生錯誤：{e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("開始初始化 Device Service 資料庫...")
    init_database()
    print("初始化完成！")