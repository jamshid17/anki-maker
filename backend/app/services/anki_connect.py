import httpx
from typing import List, Dict, Any, Optional
from app.config import settings

class AnkiConnectError(Exception):
    pass

class AnkiConnectClient:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.ANKI_CONNECT_URL).rstrip("/")

    async def _invoke(self, action: str, **params) -> Any:
        payload = {
            "action": action,
            "version": 6,
            "params": params
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.base_url, json=payload)
                resp.raise_for_status()
                data = resp.json()

                if "error" in data and data["error"]:
                    raise AnkiConnectError(f"AnkiConnect error: {data['error']}")
                return data.get("result")
        except httpx.ConnectError:
            raise AnkiConnectError(
                f"Could not connect to Anki desktop at {self.base_url}. "
                "Make sure Anki is running with the AnkiConnect add-on installed."
            )
        except Exception as e:
            if isinstance(e, AnkiConnectError):
                raise
            raise AnkiConnectError(f"AnkiConnect request failed: {str(e)}")

    async def test_connection(self) -> Dict[str, Any]:
        try:
            version = await self._invoke("version")
            return {"connected": True, "version": version, "error": None}
        except Exception as e:
            return {"connected": False, "version": None, "error": str(e)}

    async def get_deck_names(self) -> List[str]:
        decks = await self._invoke("deckNames")
        return decks or []

    async def create_deck(self, deck_name: str) -> None:
        await self._invoke("createDeck", deck=deck_name)

    async def add_cards_to_deck(self, deck_name: str, cards: List[Dict[str, Any]]) -> int:
        """
        Creates target deck if it doesn't exist and pushes cards.
        Handles both Basic and Cloze note types.
        """
        # Ensure deck exists
        existing_decks = await self.get_deck_names()
        if deck_name not in existing_decks:
            await self.create_deck(deck_name)

        notes = []
        for card in cards:
            card_type = card.get("card_type", "basic").lower()
            front = card.get("front", "")
            back = card.get("back", "")
            tags = card.get("tags", [])

            if card_type == "cloze":
                # Cloze note
                notes.append({
                    "deckName": deck_name,
                    "modelName": "Cloze",
                    "fields": {
                        "Text": front,
                        "Back Extra": back
                    },
                    "tags": tags,
                    "options": {
                        "allowDuplicate": False,
                        "duplicateScope": "deck"
                    }
                })
            else:
                # Basic note
                notes.append({
                    "deckName": deck_name,
                    "modelName": "Basic",
                    "fields": {
                        "Front": front,
                        "Back": back
                    },
                    "tags": tags,
                    "options": {
                        "allowDuplicate": False,
                        "duplicateScope": "deck"
                    }
                })

        if not notes:
            return 0

        # Push notes via addNotes
        result = await self._invoke("addNotes", notes=notes)
        # result is a list of note IDs (or null for duplicates)
        added_count = len([nid for nid in result if nid is not None])
        return added_count

anki_client = AnkiConnectClient()
