from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, Field, field_serializer
from typing import Optional, List
from datetime import datetime
from ..database import Base

class Device(Base):
    __tablename__ = "DeviceServiceTbl"

    proxyid = Column(Integer, primary_key=True, index=True)
    proxy_ip = Column(String, nullable=False)
    proxy_port = Column(Integer, nullable=False)
    Controller_type = Column(String, nullable=False)
    Controller_ip = Column(String, nullable=False)
    Controller_port = Column(Integer, nullable=False)
    remark = Column(String, nullable=True)
    enable = Column(Integer, default=0, nullable=False)
    createUser = Column(String, nullable=False)
    createDate = Column(DateTime, default=func.now())
    ModiftyDate = Column(DateTime, default=func.now(), onupdate=func.now())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

class DeviceBase(BaseModel):
    proxy_ip: str
    proxy_port: int
    Controller_type: str
    Controller_ip: str
    Controller_port: int
    remark: Optional[str] = None
    enable: int = 0
    createUser: str

class DeviceCreate(DeviceBase):
    proxyid: Optional[int] = None  # 創建時可選，資料庫會自動生成

class DeviceUpdate(BaseModel):
    proxy_ip: Optional[str] = None
    proxy_port: Optional[int] = None
    Controller_type: Optional[str] = None
    Controller_ip: Optional[str] = None
    Controller_port: Optional[int] = None
    remark: Optional[str] = None
    enable: Optional[int] = None

class DeviceInDB(DeviceBase):
    proxyid: int  # 添加 proxyid 欄位
    createDate: Optional[datetime] = Field(default=None, description="創建日期")
    ModiftyDate: Optional[datetime] = Field(default=None, description="修改日期")

    class Config:
        from_attributes = True

    @field_serializer('createDate', 'ModiftyDate')
    def serialize_datetime(self, value: datetime) -> str:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

class DeviceListResponse(BaseModel):
    data: List[DeviceInDB]
    total: int
    page: int
    size: int