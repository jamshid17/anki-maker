from fastapi import APIRouter, HTTPException, status
from app.schemas.extract import ExtractRequest, ExtractResponse
from app.services.extractor import extract_url_content, ExtractionError

router = APIRouter(prefix="/api/extract", tags=["Extraction"])

@router.post("", response_model=ExtractResponse)
async def extract_url(payload: ExtractRequest):
    try:
        return await extract_url_content(payload.url)
    except ExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while extracting URL: {str(e)}"
        )
