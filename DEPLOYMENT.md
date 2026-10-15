# Anki Maker - Deployment Guide

This guide covers deploying **Anki Maker** to any Linux server (Ubuntu, Debian, CentOS, etc.) or cloud VM using Docker & Docker Compose.

---

## 🚀 Quick Start (Production Server)

### 1. Clone the Repository
```bash
git clone <your-repo-url> anki-maker
cd anki-maker
```

### 2. Configure Environment Variables
Copy the example file and add your Google Gemini API key:
```bash
cp .env.example .env
nano .env
```
Inside `.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash
FRONTEND_PORT=80
BACKEND_PORT=8000
```

### 3. Build & Run Containers
```bash
docker compose up -d --build
```

That's it! Your application will be live at:
- **Web App**: `http://<your-server-ip>`
- **API Docs**: `http://<your-server-ip>:8000/docs`

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    Client["User Browser"] -->|Port 80| Nginx["Frontend Container (Nginx)"]
    Nginx -->|Static Assets| SPA["React + Vite Single Page App"]
    Nginx -->|/api/* (Reverse Proxy)| FastAPI["Backend Container (FastAPI)"]
    FastAPI -->|SQLite Volume| DB[("anki_db_data Volume\n/app/data/anki_maker.db")]
    FastAPI -->|HTTPS| Gemini["Google Gemini API (gemini-3.8-flash)"]
```

### Container Details
| Container | Description | Port | Healthcheck |
|---|---|---|---|
| **anki-maker-frontend** | Production Nginx image serving built React assets and reverse-proxying `/api/` calls to the backend | `80` | Built-in |
| **anki-maker-backend** | Python 3.12-slim FastAPI app with non-root user `appuser` and Uvicorn | `8000` | `curl -f http://localhost:8000/api/health` |

---

## 💾 Data Persistence

All saved decks and flashcards are persisted inside a Docker named volume:
- Volume Name: `anki_db_data`
- Mount path: `/app/data/anki_maker.db`

Your data will remain completely intact across container restarts, updates, and rebuilds.

To back up your database file on the server:
```bash
docker compose cp backend:/app/data/anki_maker.db ./backup_anki_maker.db
```

---

## 🛠️ Common Maintenance Commands

| Task | Command |
|---|---|
| **View logs** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **Check container status** | `docker compose ps` |
| **Restart services** | `docker compose restart` |
| **Pull code & update** | `git pull && docker compose up -d --build` |
| **Stop services** | `docker compose down` |
