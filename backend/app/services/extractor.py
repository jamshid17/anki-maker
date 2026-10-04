import re
import httpx
import trafilatura
from app.schemas.extract import ExtractResponse

class ExtractionError(Exception):
    pass

async def extract_url_content(url: str) -> ExtractResponse:
    """
    Downloads and extracts clean article text and title from a web URL.
    Strips ads, boilerplates, sidebars, and navigation.
    """
    clean_url = url.strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=20.0) as client:
            resp = await client.get(clean_url)
            resp.raise_for_status()
            html_content = resp.text
    except Exception as e:
        raise ExtractionError(f"Failed to fetch URL ({clean_url}): {str(e)}")

    # Extract with trafilatura
    extracted_text = trafilatura.extract(
        html_content,
        include_comments=False,
        include_tables=True,
        no_fallback=False
    )

    # Extract title
    metadata = trafilatura.extract_metadata(html_content)
    title = metadata.title if metadata and metadata.title else None

    if not title:
        # Simple fallback title from html <title> tag
        title_match = re.search(r"<title[^>]*>(.*?)</title>", html_content, re.IGNORECASE | re.DOTALL)
        if title_match:
            title = re.sub(r"\s+", " ", title_match.group(1)).strip()
        else:
            title = clean_url.split("/")[-1] or "Extracted Document"

    if not extracted_text:
        # Fallback to simple text extraction if trafilatura stripped too much
        # Strip script and style tags
        cleaned_html = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", html_content, flags=re.IGNORECASE | re.DOTALL)
        # Strip all HTML tags
        fallback_text = re.sub(r"<[^>]+>", " ", cleaned_html)
        fallback_text = re.sub(r"\s+", " ", fallback_text).strip()
        if len(fallback_text) < 50:
            raise ExtractionError("Could not extract meaningful article content from the specified URL.")
        extracted_text = fallback_text[:10000]

    word_count = len(extracted_text.split())

    return ExtractResponse(
        url=clean_url,
        title=title,
        content=extracted_text,
        word_count=word_count
    )
