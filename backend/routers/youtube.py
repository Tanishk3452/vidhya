from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.youtube_service import youtube_service

router = APIRouter(prefix="/api/youtube", tags=["YouTube Analytics"])

class VideoRequest(BaseModel):
    url: str

@router.post("/process")
async def process_video(req: VideoRequest):
    result = youtube_service.process_video(req.url)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
