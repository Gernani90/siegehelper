import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.defenses import Defenses
from models.attacks import Attacks

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/search", tags=["search"])


class DefenseSearchResult(BaseModel):
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


class AttackSearchResult(BaseModel):
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


class DefenseWithAttacks(BaseModel):
    defense: DefenseSearchResult
    attacks: List[AttackSearchResult]
    attack_count: int


class SearchResponse(BaseModel):
    results: List[DefenseWithAttacks]
    total: int


@router.get("/defenses", response_model=SearchResponse)
async def search_defenses(
    q: str = Query("", description="Search query - monster names separated by spaces"),
    tower: str = Query(None, description="Filter by tower: 4star or 5star"),
    difficulty: str = Query(None, description="Filter by difficulty: easy, medium, hard"),
    defense_type: str = Query(None, description="Filter by defense type"),
    element: str = Query(None, description="Filter by element"),
    season: str = Query(None, description="Filter by season"),
    status: str = Query("active", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Search defenses by monster names with partial matching"""
    try:
        query = select(Defenses)

        # Apply text search - split query into terms and match against monster fields
        if q and q.strip():
            terms = [t.strip().lower() for t in q.split() if t.strip()]
            for term in terms:
                term_filter = or_(
                    func.lower(Defenses.monster1).contains(term),
                    func.lower(Defenses.monster2).contains(term),
                    func.lower(Defenses.monster3).contains(term),
                    func.lower(Defenses.name).contains(term),
                )
                query = query.where(term_filter)

        # Apply filters
        if tower:
            query = query.where(Defenses.tower == tower)
        if difficulty:
            query = query.where(Defenses.difficulty == difficulty)
        if defense_type:
            query = query.where(Defenses.defense_type == defense_type)
        if element:
            query = query.where(
                or_(
                    Defenses.element1 == element,
                    Defenses.element2 == element,
                    Defenses.element3 == element,
                )
            )
        if season:
            query = query.where(Defenses.season == season)
        if status:
            query = query.where(Defenses.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply pagination and ordering
        query = query.order_by(Defenses.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        defenses = result.scalars().all()

        # For each defense, get associated attacks
        results = []
        for defense in defenses:
            attacks_query = (
                select(Attacks)
                .where(Attacks.defense_id == defense.id)
                .order_by(
                    # Order: recommended first, then situational, then not_recommended
                    case(
                        (Attacks.recommendation == "recommended", 1),
                        (Attacks.recommendation == "situational", 2),
                        else_=3,
                    ),
                    # Then by success rate: high first
                    case(
                        (Attacks.success_rate == "high", 1),
                        (Attacks.success_rate == "medium", 2),
                        else_=3,
                    ),
                )
            )
            attacks_result = await db.execute(attacks_query)
            attacks = attacks_result.scalars().all()

            results.append(
                DefenseWithAttacks(
                    defense=defense,
                    attacks=attacks,
                    attack_count=len(attacks),
                )
            )

        return SearchResponse(results=results, total=total)

    except Exception as e:
        logger.error(f"Error searching defenses: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/defense/{defense_id}", response_model=DefenseWithAttacks)
async def get_defense_detail(
    defense_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single defense with all its attacks (visible to all authenticated users)"""
    try:
        # Get defense
        result = await db.execute(select(Defenses).where(Defenses.id == defense_id))
        defense = result.scalar_one_or_none()

        if not defense:
            raise HTTPException(status_code=404, detail="Defense not found")

        # Get attacks for this defense
        attacks_query = (
            select(Attacks)
            .where(Attacks.defense_id == defense_id)
            .order_by(
                case(
                    (Attacks.recommendation == "recommended", 1),
                    (Attacks.recommendation == "situational", 2),
                    else_=3,
                ),
                case(
                    (Attacks.success_rate == "high", 1),
                    (Attacks.success_rate == "medium", 2),
                    else_=3,
                ),
            )
        )
        attacks_result = await db.execute(attacks_query)
        attacks = attacks_result.scalars().all()

        return DefenseWithAttacks(
            defense=defense,
            attacks=attacks,
            attack_count=len(attacks),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting defense detail: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/attack/{attack_id}", response_model=AttackSearchResult)
async def get_attack_detail(
    attack_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single attack detail (visible to all authenticated users)"""
    try:
        result = await db.execute(select(Attacks).where(Attacks.id == attack_id))
        attack = result.scalar_one_or_none()

        if not attack:
            raise HTTPException(status_code=404, detail="Attack not found")

        return attack

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting attack detail: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
