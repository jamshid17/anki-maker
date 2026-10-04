from pydantic import BaseModel, HttpUrl

class ExtractRequest(BaseModel):
    url: str

class ExtractResponse(BaseModel):
    url: str
    title: str
    content: str
    word_count: int
