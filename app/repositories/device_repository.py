from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.device import Device, DeviceCreate, DeviceUpdate

class DeviceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_device(self, proxyid: int) -> Optional[Device]:
        return self.db.query(Device).filter(Device.proxyid == proxyid).first()

    def get_all_devices(self, skip: int = 0, limit: int = 100) -> List[Device]:
        return self.db.query(Device).offset(skip).limit(limit).all()

    def create_device(self, device: DeviceCreate) -> Device:
        db_device = Device(**device.model_dump())
        self.db.add(db_device)
        self.db.commit()
        self.db.refresh(db_device)
        return db_device

    def update_device(self, proxyid: int, device_update: DeviceUpdate) -> Optional[Device]:
        db_device = self.db.query(Device).filter(Device.proxyid == proxyid).first()
        if db_device:
            for key, value in device_update.model_dump(exclude_unset=True).items():
                setattr(db_device, key, value)
            self.db.commit()
            self.db.refresh(db_device)
        return db_device

    def delete_device(self, proxyid: int) -> Optional[Device]:
        db_device = self.db.query(Device).filter(Device.proxyid == proxyid).first()
        if db_device:
            self.db.delete(db_device)
            self.db.commit()
        return db_device