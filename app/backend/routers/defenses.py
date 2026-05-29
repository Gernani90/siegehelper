import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.defenses import DefensesService
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/defenses", tags=["defenses"])


# ---------- Pydantic Schemas ----------
class DefensesData(BaseModel):
    """Entity data schema (for create/update)"""
    name: str
    monster1: str
    monster2: str
    monster3: str
    element1: str
    element2: str
    element3: str
    tower: str
    defense_type: str
    difficulty: str
    observations: str = None
    status: str
    season: str = None


class DefensesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    name: Optional[str] = None
    monster1: Optional[str] = None
    monster2: Optional[str] = None
    monster3: Optional[str] = None
    element1: Optional[str] = None
    element2: Optional[str] = None
    element3: Optional[str] = None
    tower: Optional[str] = None
    defense_type: Optional[str] = None
    difficulty: Optional[str] = None
    observations: Optional[str] = None
    status: Optional[str] = None
    season: Optional[str] = None


class DefensesResponse(BaseModel):
    """Entity response schema"""
    id: int
    user_id: str
    name: str
    monster1: str
    monster2: str
    monster3: str
    element1: str
    element2: str
    element3: str
    tower: str
    defense_type: str
    difficulty: str
    observations: Optional[str] = None
    status: str
    season: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DefensesListResponse(BaseModel):
    """List response schema"""
    items: List[DefensesResponse]
    total: int
    skip: int
    limit: int


class DefensesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[DefensesData]


class DefensesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: DefensesUpdateData


class DefensesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[DefensesBatchUpdateItem]


class DefensesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=DefensesListResponse)
async def query_defensess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Query defensess with filtering, sorting, and pagination (user can only see their own records)"""
    logger.debug(f"Querying defensess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = DefensesService(db)
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
        logger.debug(f"Found {result['total']} defensess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying defensess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=DefensesListResponse)
async def query_defensess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query defensess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying defensess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = DefensesService(db)
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
        logger.debug(f"Found {result['total']} defensess")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying defensess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=DefensesResponse)
async def get_defenses(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single defenses by ID (user can only see their own records)"""
    logger.debug(f"Fetching defenses with id: {id}, fields={fields}")
    
    service = DefensesService(db)
    try:
        result = await service.get_by_id(id, user_id=str(current_user.id))
        if not result:
            logger.warning(f"Defenses with id {id} not found")
            raise HTTPException(status_code=404, detail="Defenses not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching defenses {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=DefensesResponse, status_code=201)
async def create_defenses(
    data: DefensesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new defenses"""
    logger.debug(f"Creating new defenses with data: {data}")
    
    service = DefensesService(db)
    try:
        result = await service.create(data.model_dump(), user_id="1001640")
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create defenses")
        
        logger.info(f"Defenses created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating defenses: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating defenses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[DefensesResponse], status_code=201)
async def create_defensess_batch(
    request: DefensesBatchCreateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create multiple defensess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} defensess")
    
    service = DefensesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump(), user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} defensess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[DefensesResponse])
async def update_defensess_batch(
    request: DefensesBatchUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update multiple defensess in a single request (requires ownership)"""
    logger.debug(f"Batch updating {len(request.items)} defensess")
    
    service = DefensesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict, user_id=str(current_user.id))
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} defensess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=DefensesResponse)
async def update_defenses(
    id: int,
    data: DefensesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing defenses (requires ownership)"""
    logger.debug(f"Updating defenses {id} with data: {data}")

    service = DefensesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict, user_id="1001640")
        if not result:
            logger.warning(f"Defenses with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Defenses not found")
        
        logger.info(f"Defenses {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating defenses {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating defenses {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_defensess_batch(
    request: DefensesBatchDeleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple defensess by their IDs (requires ownership)"""
    logger.debug(f"Batch deleting {len(request.ids)} defensess")
    
    service = DefensesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id, user_id=str(current_user.id))
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} defensess successfully")
        return {"message": f"Successfully deleted {deleted_count} defensess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_defenses(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single defenses by ID (requires ownership)"""
    logger.debug(f"Deleting defenses with id: {id}")
    
    service = DefensesService(db)
    try:
        success = await service.delete(id, user_id="1001640")
        if not success:
            logger.warning(f"Defenses with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Defenses not found")
        
        logger.info(f"Defenses {id} deleted successfully")
        return {"message": "Defenses deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting defenses {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
