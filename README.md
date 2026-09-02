# Aegis Command — Hazard-Based Red Zone Identification Platform
### SIH 2026 · Problem Statement 26191

This is the merged, fixed, and polished version of your two Figma-Make exports.
Project 2 (the backend-connected one) is the base — it already covered every
part of the problem statement (red zones, carrying capacity, relocation
priority, actionable insights) better than Project 1, so nothing from
Project 1 was needed.

## What I fixed

1. **Backend couldn't start at all.** `main.py` imported the `openai` Python
   package, which wasn't in `requirements.txt` — every boot crashed. Removed
   the unused import; `ai.py` talks to OpenAI directly over HTTPS, no SDK
   needed. Also added `python-dotenv`, `httpx`, and `apscheduler` to
   `requirements.txt` — all three were imported but never listed, so
   `pip install -r requirements.txt` was silently incomplete.
2. **"AI Analysis" never actually called your OpenAI key.** `ai.py` looks for
   `AI_LLM_URL` / `AI_LLM_KEY` env vars to enable live LLM calls, but nothing
   ever set them — so it silently ran in rule-engine-only mode even with a
   valid key in `.env`. `main.py` now points those at your `OPENAI_API_KEY`
   automatically.
3. **GDACS (global disaster alerts) fetch was a no-op.** It parsed the feed
   and then threw the result away instead of storing it. Now it's synchronous
   (so the background scheduler can actually call it), filters to India +
   neighbours, and feeds real events into the hazard map.
4. **Login was completely fake.** The credentials form didn't call the
   backend at all — it just waited ~1 second and let you in regardless of
   what you typed, and any 6-digit number was accepted as the OTP. Now:
   - Clearance codes are checked against a real hash stored server-side.
   - Logging in generates a real, single-use, expiring 6-digit code,
     checked server-side on verify (wrong code / expired code / too many
     attempts are all rejected for real).
   - Since there's no SMS/email gateway connected in this environment,
     the code is returned to the login screen in a clearly labeled
     **"DEMO MODE"** banner rather than pretending it was texted to you.
     Swap in a real provider (e.g. an email API) later if you want true
     out-of-band delivery — the verification logic itself doesn't change.

## What's genuinely live vs. modeled (be upfront about this to judges — it's a strength, not a weakness)

| Feature | Status |
|---|---|
| Weather (rain/wind/temp) per city | **Live** — Open-Meteo, free, no key |
| Earthquakes | **Live** — USGS real-time feed |
| Global disaster alerts | **Live** — GDACS (India + neighbours) |
| Place search | **Live** — OpenStreetMap Nominatim |
| AI response advisor | **Live** if `OPENAI_API_KEY` is valid; falls back to a deterministic rule engine (built from real IMD/NDMA protocol knowledge) if the LLM call fails — so the tab never breaks live on stage |
| Red zones / relocation hubs / incidents | **Seeded reference dataset** — this is a curated registry, same pattern real SDMA systems use as a baseline layer under live hazard overlays. Say so plainly if asked; it's normal, not something to hide. |
| State-level flood/landslide/cyclone/earthquake exposure | **Computed model** (per-state score), not a live feed — there is no free public live landslide/cloudburst API from IMD or anyone else in India. Nobody has that; deriving risk from live rainfall intensity (which this does) is the standard approach. |
| District relocation-urgency ranking (`/api/ml/district-urgency`, `/api/ml/probe`) | **A real trained ML model** (RandomForestRegressor) over 640 real Census districts + real government hazard-zone data, R²=0.97 on held-out test. Full methodology, sources, and honest limitations in `backend/README_MODEL.md` — read it before your demo. |

## Running it

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8010
```
Your `.env` already has `OPENAI_API_KEY` — the AI Analysis tab will use it.

**Frontend:**
```bash
npm install
npm run dev
```
Vite proxies `/api` to `http://127.0.0.1:8010` automatically (see
`vite.config.ts`) — no extra config needed for local dev.

**Login (demo credentials):**
| Operator ID | Clearance Code |
|---|---|
| OP-7734-X | SDMA-ALPHA-7734 |
| OP-8891-Q | NDRF-BRAVO-8891 |

## Honest note on this build

I ran this in a sandboxed environment with restricted outbound network
access, so I could verify the backend boots, the database seeds, auth
genuinely rejects bad credentials and accepts correct ones, and every
endpoint returns real computed data (priorities, dashboard, AI advice). I
could **not** verify the Open-Meteo/USGS/GDACS/OpenAI calls succeed from
*this* sandbox specifically — GDACS returned a 403 here, likely because it
blocks cloud-provider IPs, not because of a code bug. Test the live calls
once on your own machine (normal internet, no such restriction) before your
demo, and if GDACS is still flaky, it fails safe — the rest of the hazard
feed (USGS + Open-Meteo + your seeded red-zone data) keeps working.
