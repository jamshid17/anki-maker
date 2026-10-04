import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.deck import Deck
from app.models.card import Card

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after test
    db = SessionLocal()
    db.query(Card).delete()
    db.query(Deck).delete()
    db.commit()
    db.close()

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "gemini_configured" in data

def test_settings_status():
    response = client.get("/api/settings/status")
    assert response.status_code == 200
    data = response.json()
    assert "gemini_configured" in data
    assert "anki_url" in data

def test_deck_crud():
    # 1. Create Deck with cards
    deck_payload = {
        "title": "Machine Learning Fundamentals",
        "source_type": "text",
        "source_content": "Deep learning uses neural networks.",
        "cards": [
            {
                "card_type": "basic",
                "front": "What is backpropagation?",
                "back": "An algorithm for computing gradients in neural networks.",
                "tags": ["ml", "deep-learning"]
            },
            {
                "card_type": "cloze",
                "front": "{{c1::Overfitting}} occurs when a model learns training noise.",
                "back": "Prevent with regularization or dropout.",
                "tags": ["ml"]
            }
        ]
    }
    create_res = client.post("/api/decks", json=deck_payload)
    assert create_res.status_code == 201
    created_deck = create_res.json()
    deck_id = created_deck["id"]
    assert created_deck["title"] == "Machine Learning Fundamentals"
    assert len(created_deck["cards"]) == 2
    assert created_deck["card_count"] == 2

    # 2. Get All Decks
    list_res = client.get("/api/decks")
    assert list_res.status_code == 200
    decks = list_res.json()
    assert len(decks) == 1
    assert decks[0]["id"] == deck_id
    assert decks[0]["card_count"] == 2

    # 3. Get Single Deck
    get_res = client.get(f"/api/decks/{deck_id}")
    assert get_res.status_code == 200
    deck_detail = get_res.json()
    assert len(deck_detail["cards"]) == 2

    # 4. Update Deck Title
    update_res = client.put(f"/api/decks/{deck_id}", json={"title": "ML Basics"})
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "ML Basics"

    # 5. Add a card to existing deck
    new_card_res = client.post(
        f"/api/decks/{deck_id}/cards",
        json={
            "card_type": "basic",
            "front": "What is SGD?",
            "back": "Stochastic Gradient Descent",
            "tags": ["optimization"]
        }
    )
    assert new_card_res.status_code == 201
    card_id = new_card_res.json()["id"]

    # 6. Delete single card
    del_card_res = client.delete(f"/api/cards/{card_id}")
    assert del_card_res.status_code == 204

    # Verify count is back to 2
    get_res = client.get(f"/api/decks/{deck_id}")
    assert len(get_res.json()["cards"]) == 2

    # 7. Delete Deck
    del_deck_res = client.delete(f"/api/decks/{deck_id}")
    assert del_deck_res.status_code == 204

    # Verify deck is deleted
    assert client.get(f"/api/decks/{deck_id}").status_code == 404

def test_export_endpoints():
    # Test Raw APKG Export
    raw_payload = {
        "deck_title": "Test Quick Export",
        "cards": [
            {
                "card_type": "basic",
                "front": "Capital of France?",
                "back": "Paris",
                "tags": ["geography"]
            },
            {
                "card_type": "cloze",
                "front": "Water freezes at {{c1::0}} degrees Celsius.",
                "back": "At standard atmospheric pressure.",
                "tags": ["science"]
            }
        ]
    }
    apkg_res = client.post("/api/export/raw/apkg", json=raw_payload)
    assert apkg_res.status_code == 200
    assert apkg_res.headers["content-type"] == "application/octet-stream"
    assert len(apkg_res.content) > 1000

    csv_res = client.post("/api/export/raw/csv", json=raw_payload)
    assert csv_res.status_code == 200
    assert "Capital of France?" in csv_res.text
    assert "Paris" in csv_res.text
