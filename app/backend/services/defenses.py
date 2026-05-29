import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.defenses import Defenses
from models.attacks import Attacks

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class DefensesService:
    """Service layer for Defenses operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Defenses]:
        """Create a new defenses"""
        try:
            if user_id:
                data['user_id'] = user_id
            obj = Defenses(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Created defenses with id: {obj.id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating defenses: {str(e)}")
            raise

    async def check_ownership(self, obj_id: int, user_id: str) -> bool:
        """Check if user owns this record"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            return obj is not None
        except Exception as e:
            logger.error(f"Error checking ownership for defenses {obj_id}: {str(e)}")
            return False

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[Defenses]:
        """Get defenses by ID (user can only see their own records)"""
        try:
            query = select(Defenses).where(Defenses.id == obj_id)
            if user_id:
                query = query.where(Defenses.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching defenses {obj_id}: {str(e)}")
            raise

    async def get_list(
        self, 
        skip: int = 0, 
        limit: int = 20, 
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of defensess (user can only see their own records)"""
        try:
            query = select(Defenses)
            count_query = select(func.count(Defenses.id))
            
            if user_id:
                query = query.where(Defenses.user_id == user_id)
                count_query = count_query.where(Defenses.user_id == user_id)
            
            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(Defenses, field):
                        query = query.where(getattr(Defenses, field) == value)
                        count_query = count_query.where(getattr(Defenses, field) == value)
            
            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith('-'):
                    field_name = sort[1:]
                    if hasattr(Defenses, field_name):
                        query = query.order_by(getattr(Defenses, field_name).desc())
                else:
                    if hasattr(Defenses, sort):
                        query = query.order_by(getattr(Defenses, sort))
            else:
                query = query.order_by(Defenses.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching defenses list: {str(e)}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[Defenses]:
        """Update defenses (requires ownership)"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Defenses {obj_id} not found for update")
                return None
            for key, value in update_data.items():
                if hasattr(obj, key) and key != 'user_id':
                    setattr(obj, key, value)

            await self.db.commit()
            await self.db.refresh(obj)
            logger.info(f"Updated defenses {obj_id}")
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating defenses {obj_id}: {str(e)}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete defenses and linked attacks"""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                logger.warning(f"Defenses {obj_id} not found for deletion")
                return False
            attacks_query = delete(Attacks).where(Attacks.defense_id == obj_id)
            if user_id:
                attacks_query = attacks_query.where(Attacks.user_id == user_id)
            await self.db.execute(attacks_query)
            await self.db.delete(obj)
            await self.db.commit()
            logger.info(f"Deleted defenses {obj_id}")
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting defenses {obj_id}: {str(e)}")
            raise

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Defenses]:
        """Get defenses by any field"""
        try:
            if not hasattr(Defenses, field_name):
                raise ValueError(f"Field {field_name} does not exist on Defenses")
            result = await self.db.execute(
                select(Defenses).where(getattr(Defenses, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching defenses by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Defenses]:
        """Get list of defensess filtered by field"""
        try:
            if not hasattr(Defenses, field_name):
                raise ValueError(f"Field {field_name} does not exist on Defenses")
            result = await self.db.execute(
                select(Defenses)
                .where(getattr(Defenses, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Defenses.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching defensess by {field_name}: {str(e)}")
            raise
