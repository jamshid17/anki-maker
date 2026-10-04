import json
import logging
from google import genai
from google.genai import types
from app.config import settings
from app.schemas.card import (
    CardGenerateRequest,
    CardGenerateResponse,
    CardRefineRequest,
    CardRefineResponse,
    GeneratedCard
)

logger = logging.getLogger(__name__)

class GeminiServiceError(Exception):
    pass

class GeminiService:
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL or "gemini-2.5-flash"

    def _get_client(self) -> genai.Client:
        key = self.api_key or settings.GEMINI_API_KEY
        if not key or key.strip() == "":
            raise GeminiServiceError(
                "Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env"
            )
        return genai.Client(api_key=key.strip())

    async def generate_cards(self, request: CardGenerateRequest) -> CardGenerateResponse:
        client = self._get_client()

        format_instruction = ""
        if request.format == "basic":
            format_instruction = (
                "Create ONLY 'basic' flashcards. "
                "'front' should be a clear, unambiguous question or prompt. "
                "'back' should be a concise, direct, accurate answer or explanation."
            )
        elif request.format == "cloze":
            format_instruction = (
                "Create ONLY 'cloze' flashcards. "
                "'front' MUST be a full sentence with cloze deletion syntax like {{c1::key concept}} "
                "or multiple {{c1::...}} markers. "
                "'back' should provide a brief contextual explanation or extra detail."
            )
        else: # mixed
            format_instruction = (
                "Create a balanced mix of 'basic' questions and 'cloze' deletions. "
                "Use 'cloze' with {{c1::keyword}} when memorizing definitions, dates, or precise terms. "
                "Use 'basic' for conceptual explanations or 'why/how' questions."
            )

        custom_prompt_text = f"\nUser Custom Directives:\n{request.custom_prompt}" if request.custom_prompt else ""

        system_instruction = (
            "You are a master pedagogical flashcard designer creating high-yield Anki flashcards. "
            "Follow the Minimum Information Principle: each card must be atomic, precise, and easily recallable. "
            "Never make vague cards. Avoid trivia or fluff. Focus on high-signal understanding.\n"
            f"{format_instruction}\n"
            "Generate appropriate tags for each card (e.g. ['science', 'biology']).\n"
            "Also suggest a clean, descriptive deck title summarizing the material."
        )

        user_content = (
            f"Generate exactly {request.quantity} high-quality flashcards from the following text:\n\n"
            f"\"\"\"\n{request.content}\n\"\"\"\n"
            f"{custom_prompt_text}"
        )

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=CardGenerateResponse
            )

            # Generate via Google GenAI SDK (synchronous call wrapped safely)
            response = client.models.generate_content(
                model=self.model,
                contents=user_content,
                config=config
            )

            if not response.text:
                raise GeminiServiceError("Empty response from Gemini API")

            data = json.loads(response.text)
            return CardGenerateResponse(**data)

        except GeminiServiceError:
            raise
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            raise GeminiServiceError(f"Failed to generate cards: {str(e)}")

    async def refine_cards(self, request: CardRefineRequest) -> CardRefineResponse:
        client = self._get_client()

        cards_json = json.dumps([card.model_dump() for card in request.cards], indent=2)

        system_instruction = (
            "You are an expert Anki flashcard editor. "
            "You will receive an existing list of flashcards and user refinement instructions. "
            "Apply the requested changes faithfully (e.g., shorten answers, change basic to cloze, "
            "improve clarity, reword questions, update tags, or add more nuance). "
            "Keep valid cloze syntax {{c1::term}} whenever card_type is 'cloze'. "
            "Preserve cards that don't need changes and return the full updated list of cards."
        )

        user_content = (
            f"Current Deck Title: {request.deck_title or 'Flashcards'}\n\n"
            f"Current Cards:\n{cards_json}\n\n"
            f"Refinement Instructions:\n{request.instructions}"
        )

        try:
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.3,
                response_mime_type="application/json",
                response_schema=CardRefineResponse
            )

            response = client.models.generate_content(
                model=self.model,
                contents=user_content,
                config=config
            )

            if not response.text:
                raise GeminiServiceError("Empty response from Gemini API during refinement")

            data = json.loads(response.text)
            return CardRefineResponse(**data)

        except GeminiServiceError:
            raise
        except Exception as e:
            logger.error(f"Gemini refinement error: {e}")
            raise GeminiServiceError(f"Failed to refine cards: {str(e)}")

gemini_service = GeminiService()
