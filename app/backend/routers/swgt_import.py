import logging
import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.defenses import Defenses
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/import", tags=["import"])


class SwgtDefenseRow(BaseModel):
    monster1: str
    monster2: str
    monster3: str


class SwgtImportRequest(BaseModel):
    raw_text: str
    season: str
    tower: str = "4star"
    difficulty: str = "medium"
    defense_type: str = "bruiser"


class SwgtImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: List[str]


# Common element mapping based on known monster elements
ELEMENT_MAP = {
    # This will be a best-effort mapping; users can edit later
}


def parse_swgt_table(raw_text: str) -> List[SwgtDefenseRow]:
    """Parse pasted SWGT table data into defense rows.
    
    Expected formats:
    - Tab-separated: "Monster1\tMonster2\tMonster3\t..."
    - Comma-separated: "Monster1, Monster2, Monster3"
    - Long name list: "Monster1, Monster2, Monster3, Monster4, Monster5, Monster6"
    - Line with 3 monster names separated by various delimiters
    """
    rows = []
    lines = raw_text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip header lines
        if any(header in line.lower() for header in ['defense', 'rank', 'monster', 'win rate', 'usage']):
            continue
        
        for parts in split_candidate_columns(line):
            monsters = extract_monster_names(parts)
            if len(monsters) >= 3:
                for trio in chunk_monster_names(monsters):
                    rows.append(SwgtDefenseRow(
                        monster1=trio[0],
                        monster2=trio[1],
                        monster3=trio[2],
                    ))
                break

    if not rows:
        monsters = extract_monster_names(split_loose_name_list(raw_text))
        for trio in chunk_monster_names(monsters):
            rows.append(SwgtDefenseRow(
                monster1=trio[0],
                monster2=trio[1],
                monster3=trio[2],
            ))

    return rows


def chunk_monster_names(monsters: List[str]) -> List[List[str]]:
    """Group a flat monster-name list into complete defenses of 3 monsters."""
    return [
        monsters[index:index + 3]
        for index in range(0, len(monsters) - 2, 3)
        if len(monsters[index:index + 3]) == 3
    ]


def split_loose_name_list(raw_text: str) -> List[str]:
    """Split a pasted list that contains only monster names."""
    return [
        part.strip()
        for part in re.split(r'[,;\n]+', raw_text)
        if part.strip()
    ]


def split_candidate_columns(line: str) -> List[List[str]]:
    """Return possible column splits, trying the most structured formats first."""
    candidates = [
        [p.strip() for p in line.split('\t') if p.strip()],
        [p.strip() for p in line.split('|') if p.strip()],
        [p.strip() for p in line.split(',') if p.strip()],
        [p.strip() for p in re.split(r'\s{2,}', line) if p.strip()],
        [p.strip() for p in re.split(r'[/\\]', line) if p.strip()],
    ]
    return [parts for parts in candidates if len(parts) >= 3]


def extract_monster_names(parts: List[str]) -> List[str]:
    """Extract valid monster names from a list of parts."""
    valid = []
    for p in parts:
        p = normalize_monster_name(p)
        if p:
            valid.append(p)
    return valid


def normalize_monster_name(value: str) -> Optional[str]:
    """Clean copied-table noise from a monster-name candidate."""
    p = value.strip()
    p = re.sub(r'^#?\d+[\.\)]\s*', '', p)
    p = re.sub(r'^#?\d+\s+', '', p)
    p = re.sub(r'\([^)]*\)', '', p)
    p = re.sub(r'\b\d+(\.\d+)?%?\b', '', p)
    p = re.sub(r'\b(W|L|Win|Loss|Rate|Used|Usage|Defense|Def)\b', '', p, flags=re.IGNORECASE)
    p = re.sub(r'\s+', ' ', p).strip()

    if len(p) >= 2 and re.match(r'^[A-Za-z0-9\s\'\-\(\)\.]+$', p):
        return p
    return None


def canonical_defense_name(row: SwgtDefenseRow) -> str:
    return f"{row.monster1} / {row.monster2} / {row.monster3}"


@router.post("/swgt", response_model=SwgtImportResponse)
async def import_swgt_defenses(
    request: SwgtImportRequest,
    db: AsyncSession = Depends(get_db),
):
    """Import defenses from pasted SWGT table data"""
    try:
        parsed_rows = parse_swgt_table(request.raw_text)
        
        if not parsed_rows:
            return SwgtImportResponse(imported=0, skipped=0, errors=["Nenhuma defesa encontrada no texto colado. Verifique o formato."])
        
        imported = 0
        skipped = 0
        errors = []
        seen_names = set()
        
        for row in parsed_rows:
            try:
                defense_name = canonical_defense_name(row)
                if defense_name.lower() in seen_names:
                    skipped += 1
                    continue
                seen_names.add(defense_name.lower())

                existing_result = await db.execute(
                    select(Defenses.id).where(Defenses.name == defense_name).limit(1)
                )
                if existing_result.scalar_one_or_none():
                    skipped += 1
                    continue

                defense = Defenses(
                    user_id="1001640",
                    name=defense_name,
                    monster1=row.monster1,
                    monster2=row.monster2,
                    monster3=row.monster3,
                    element1="fire",  # Default - user can edit later
                    element2="fire",
                    element3="fire",
                    tower=request.tower,
                    defense_type=request.defense_type,
                    difficulty=request.difficulty,
                    observations="Importado do SWGT",
                    status="active",
                    season=request.season,
                )
                db.add(defense)
                imported += 1
            except Exception as e:
                errors.append(f"Erro ao importar {row.monster1}/{row.monster2}/{row.monster3}: {str(e)}")
                skipped += 1
        
        await db.commit()
        
        return SwgtImportResponse(
            imported=imported,
            skipped=skipped,
            errors=errors,
        )
    
    except Exception as e:
        logger.error(f"Error importing SWGT data: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Import error: {str(e)}")
