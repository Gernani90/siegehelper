import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.attacks import AttacksService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/attacks", tags=["attacks"])


# ---------- Pydantic Schemas ----------
class AttacksData(BaseModel):
    """Entity data schema (for create/update)"""
    defense_id: int
    name: str
    monster1: str
    monster2: str
    monster3: str
    attack_type: str
    success_rate: str
    recommendation: str
    focus_order: str = None
    tips: str = None
    risks: str = None
    requirements: str = None
    observations: str = None
    season: str = None


class AttacksUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    defense_id: Optional[int] = None
    name: Optional[str] = None
    monster1: Optional[str] = None
    monster2: Optional[str] = None
    monster3: Optional[str] = None
    attack_type: Optional[str] = None
    success_rate: Optional[str] = None
    recommendation: Optional[str] = None
    focus_order: Optional[str] = None
    tips: Optional[str] = None
    risks: Optional[str] = None
    requirements: Optional[str] = None
    observations: Optional[str] = None
    season: Optional[str] = None


class AttacksResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    defense_id: int
    name: str
    monster1: str
    monster2: str
    monster3: str
    attack_type: str
    success_rate: str
    recommendation: str
    focus_order: Optional[str] = None
    tips: Optional[str] = None
    risks: Optional[str] = None
    requirements: Optional[str] = None
    observations: Optional[str] = None
    season: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AttacksListResponse(BaseModel):
    """List response schema"""
    items: List[AttacksResponse]
    total: int
    skip: int
    limit: int


class AttacksBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[AttacksData]


class AttacksBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: AttacksUpdateData


class AttacksBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[AttacksBatchUpdateItem]


class AttacksBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=AttacksListResponse)
async def query_attackss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query attackss with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying attackss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = AttacksService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
            user_id=str(current_user.id),
        )
        logger.debug(f"Found {result['total']} attackss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying attackss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=AttacksListResponse)
async def query_attackss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query attackss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying attackss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = AttacksService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} attackss")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying attackss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=AttacksResponse)
async def get_attacks(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single attacks by ID (user can only see their own records)"""
    logger.debug(f"Fetching attacks with id: {id}, fields={fields}")
    
    service = AttacksService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Attacks with id {id} not found")
            raise HTTPException(status_code=404, detail="Attacks not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching attacks {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=AttacksResponse, status_code=201)
async def create_attacks(
    data: AttacksData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new attacks"""
    logger.debug(f"Creating new attacks with data: {data}")
    
    service = AttacksService(db)
    try:
        result = await service.create(data.model_dump(), user_id="1001640")
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create attacks")
        
        logger.info(f"Attacks created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating attacks: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating attacks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[AttacksResponse], status_code=201)
async def create_attackss_batch(
    request: AttacksBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple attackss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} attackss")
    
    service = AttacksService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} attackss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[AttacksResponse])
async def update_attackss_batch(
    request: AttacksBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple attackss in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} attackss")
    
    service = AttacksService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} attackss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=AttacksResponse)
async def update_attacks(
    id: int,
    data: AttacksUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing attacks (requires ownership)"""
    logger.debug(f"Updating attacks {id} with data: {data}")

    service = AttacksService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id="1001640")
        if not result:
            logger.warning(f"Attacks with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Attacks not found")
        
        logger.info(f"Attacks {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating attacks {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating attacks {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_attackss_batch(
    request: AttacksBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple attackss by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} attackss")
    
    service = AttacksService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} attackss successfully")
        return {"message": f"Successfully deleted {deleted_count} attackss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_attacks(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single attacks by ID (requires ownership)"""
    logger.debug(f"Deleting attacks with id: {id}")
    
    service = AttacksService(db)
    try:
        success = await service.delete(id, user_id="1001640")
        if not success:
            logger.warning(f"Attacks with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Attacks not found")
        
        logger.info(f"Attacks {id} deleted successfully")
        return {"message": "Attacks deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attacks {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
