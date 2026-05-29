from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Defenses(Base):
    __tablename__ = "defenses"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    monster1 = Column(String, nullable=False)
    monster2 = Column(String, nullable=False)
    monster3 = Column(String, nullable=False)
    element1 = Column(String, nullable=False)
    element2 = Column(String, nullable=False)
    element3 = Column(String, nullable=False)
    tower = Column(String, nullable=False)
    defense_type = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    observations = Column(String, nullable=True)
    status = Column(String, nullable=False)
    season = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)