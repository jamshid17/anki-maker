import io
import csv
import zlib
import tempfile
import os
import genanki
from typing import List, Dict, Any

BASIC_MODEL_ID = 1607392319
CLOZE_MODEL_ID = 1607392320

BASIC_MODEL = genanki.Model(
    BASIC_MODEL_ID,
    'Anki Maker Basic',
    fields=[
        {'name': 'Question'},
        {'name': 'Answer'},
    ],
    templates=[
        {
            'name': 'Card 1',
            'qfmt': '<div class="card-front">{{Question}}</div>',
            'afmt': '<div class="card-front">{{Question}}</div><hr id="answer"><div class="card-back">{{Answer}}</div>',
        },
    ],
    css="""
    .card {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 19px;
        text-align: center;
        color: #1a202c;
        background-color: #ffffff;
        line-height: 1.6;
        padding: 24px;
    }
    .card-front {
        font-weight: 500;
        margin-bottom: 12px;
    }
    .card-back {
        color: #2d3748;
    }
    hr#answer {
        border: 0;
        border-top: 1px solid #e2e8f0;
        margin: 20px 0;
    }
    """
)

CLOZE_MODEL = genanki.Model(
    CLOZE_MODEL_ID,
    'Anki Maker Cloze',
    fields=[
        {'name': 'Text'},
        {'name': 'Extra'},
    ],
    templates=[
        {
            'name': 'Cloze Card',
            'qfmt': '<div class="card-front">{{cloze:Text}}</div>',
            'afmt': '<div class="card-front">{{cloze:Text}}</div><hr id="answer"><div class="card-back">{{Extra}}</div>',
        },
    ],
    model_type=genanki.Model.CLOZE,
    css="""
    .card {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 19px;
        text-align: center;
        color: #1a202c;
        background-color: #ffffff;
        line-height: 1.6;
        padding: 24px;
    }
    .cloze {
        font-weight: 600;
        color: #2563eb;
    }
    .card-back {
        color: #4b5563;
    }
    hr#answer {
        border: 0;
        border-top: 1px solid #e2e8f0;
        margin: 20px 0;
    }
    """
)

def _get_deck_id(identifier: str) -> int:
    """Generate a stable positive 31-bit integer for genanki Deck ID."""
    return zlib.crc32(identifier.encode('utf-8')) & 0x7FFFFFFF

def export_deck_to_apkg(deck_id: str, deck_title: str, cards: List[Dict[str, Any]]) -> bytes:
    """
    Builds a complete, standalone .apkg package containing all cards in the deck.
    """
    anki_deck = genanki.Deck(_get_deck_id(deck_id), deck_title)

    for card in cards:
        card_type = (card.get("card_type") or "basic").lower()
        front = card.get("front", "")
        back = card.get("back", "")
        tags = card.get("tags") or []
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]

        if card_type == "cloze":
            note = genanki.Note(
                model=CLOZE_MODEL,
                fields=[front, back],
                tags=tags
            )
        else:
            note = genanki.Note(
                model=BASIC_MODEL,
                fields=[front, back],
                tags=tags
            )
        anki_deck.add_note(note)

    package = genanki.Package(anki_deck)
    
    with tempfile.NamedTemporaryFile(suffix=".apkg", delete=False) as tmp_file:
        tmp_path = tmp_file.name

    try:
        package.write_to_file(tmp_path)
        with open(tmp_path, "rb") as f:
            data = f.read()
        return data
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

def export_deck_to_csv(cards: List[Dict[str, Any]]) -> str:
    """
    Builds an Anki-compatible CSV string with Front, Back, Tags.
    """
    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(["#separator:Comma"])
    writer.writerow(["#html:true"])
    writer.writerow(["#tags column:3"])
    writer.writerow(["Front", "Back", "Tags"])

    for card in cards:
        front = card.get("front", "").replace("\n", "<br>")
        back = card.get("back", "").replace("\n", "<br>")
        tags_raw = card.get("tags") or []
        if isinstance(tags_raw, list):
            tags_str = " ".join([t.replace(" ", "_") for t in tags_raw])
        else:
            tags_str = str(tags_raw)

        writer.writerow([front, back, tags_str])

    return output.getvalue()
