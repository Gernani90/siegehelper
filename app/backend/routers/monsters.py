import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Query, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/monsters", tags=["monsters"])


@router.get("/search")
async def search_monsters(
    name: str = Query(..., min_length=2, description="Monster name to search"),
    page_size: int = Query(50, ge=1, le=100),
):
    """Proxy endpoint to search monsters from SWARFARM API (avoids CORS issues)"""
    try:
        url = f"https://swarfarm.com/api/v2/monsters/?name={name}&page_size={page_size}&awaken_level=1&format=json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                # Filter to only awakened level 1 (base) monsters
                results = [
                    {
                        "id": m.get("id"),
                        "name": m.get("name"),
                        "image_filename": m.get("image_filename"),
                        "element": m.get("element"),
                        "natural_stars": m.get("natural_stars"),
                        "awaken_level": m.get("awaken_level"),
                    }
                    for m in data.get("results", [])
                    if m.get("awaken_level") == 1 and m.get("obtainable", True) is not False
                ]
                return {"results": results}
            else:
                return {"results": []}
    except httpx.TimeoutException:
        logger.warning("SWARFARM API timeout")
        return {"results": []}
    except Exception as e:
        logger.error(f"Error proxying monster search: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monster search error: {str(e)}")