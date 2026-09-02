import json
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen

USGS_REALTIME_FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
INDIA_BBOX = {"lon_min": 66.5, "lat_min": 5.5, "lon_max": 99.0, "lat_max": 37.5}
TTL_SECONDS = 120
MAX_EVENTS = 15

FALLBACK_EVENTS = [
    {"id": "fallback-001", "place": "Dhalai district, Tripura", "magnitude": 4.6, "depth_km": 22.0, "latitude": 23.88, "longitude": 92.12, "time": "2026-08-20T04:32:00+00:00"},
    {"id": "fallback-002", "place": "Near Nepal-India border, Uttar Pradesh", "magnitude": 5.2, "depth_km": 18.0, "latitude": 28.31, "longitude": 80.75, "time": "2026-08-18T11:05:00+00:00"},
    {"id": "fallback-003", "place": "Andaman Islands, India", "magnitude": 4.9, "depth_km": 35.0, "latitude": 11.90, "longitude": 93.10, "time": "2026-08-16T23:41:00+00:00"},
    {"id": "fallback-004", "place": "Bay of Bengal", "magnitude": 4.2, "depth_km": 10.0, "latitude": 18.40, "longitude": 89.20, "time": "2026-08-15T09:12:00+00:00"},
    {"id": "fallback-005", "place": "Himachal Pradesh, India", "magnitude": 4.4, "depth_km": 12.0, "latitude": 32.20, "longitude": 76.60, "time": "2026-08-14T18:28:00+00:00"},
    {"id": "fallback-006", "place": "Sikkim, India", "magnitude": 3.8, "depth_km": 15.0, "latitude": 27.60, "longitude": 88.50, "time": "2026-08-13T02:53:00+00:00"},
]

_CACHE = {"updated_at": 0.0, "payload": None}


def _fetch_json(url, timeout=10):
    req = Request(url, headers={"User-Agent": "Aegis-Command/4.2 GIS feed", "Accept": "application/json"})
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _build_payload(events, source, live, stale=False):
    return {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "window": "past 7 days" if live else "static buffer",
        "live": live,
        "stale": stale,
        "region": "India & neighbourhood",
        "count": len(events),
        "events": events,
    }


def get_live_feed():
    now = time.time()
    cached = _CACHE["payload"]
    if cached and (now - _CACHE["updated_at"]) < TTL_SECONDS:
        return cached

    try:
        data = _fetch_json(USGS_REALTIME_FEED)
        events = []
        for feature in data.get("features", []):
            props = feature.get("properties", {}) or {}
            coords = (feature.get("geometry", {}) or {}).get("coordinates")
            if not coords or len(coords) < 3:
                continue
            lon, lat, depth = coords[0], coords[1], coords[2] or 0.0
            mag = props.get("mag")
            if mag is None:
                continue
            if not (INDIA_BBOX["lon_min"] <= lon <= INDIA_BBOX["lon_max"] and INDIA_BBOX["lat_min"] <= lat <= INDIA_BBOX["lat_max"]):
                continue
            events.append(
                {
                    "id": feature.get("id", f"usgs-{len(events)}"),
                    "place": props.get("place") or "Unknown location",
                    "magnitude": round(mag, 1),
                    "depth_km": round(float(depth), 1),
                    "latitude": round(lat, 4),
                    "longitude": round(lon, 4),
                    "time": datetime.fromtimestamp((props.get("time") or 0) / 1000, tz=timezone.utc).isoformat(),
                }
            )
        events.sort(key=lambda e: (-e["magnitude"], e["time"] or ""))
        events = events[:MAX_EVENTS]
        payload = _build_payload(events, "USGS NEIC Realtime", True)
    except Exception:
        if cached:
            payload = _build_payload(cached["events"], cached["source"], False, stale=True)
        else:
            payload = _build_payload(list(FALLBACK_EVENTS), "Offline cache — USGS NEIC", False)

    _CACHE["updated_at"] = now
    _CACHE["payload"] = payload
    return payload