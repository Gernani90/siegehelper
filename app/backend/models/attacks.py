from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Attacks(Base):
    __tablename__ = "attacks"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    defense_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    monster1 = Column(String, nullable=False)
    monster2 = Column(String, nullable=False)
    monster3 = Column(String, nullable=False)
    attack_type = Column(String, nullable=False)
    success_rate = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)
    focus_order = Column(String, nullable=True)
    tips = Column(String, nullable=True)
    risks = Column(String, nullable=True)
    requirements = Column(String, nullable=True)
    observations = Column(String, nullable=True)
    season = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)