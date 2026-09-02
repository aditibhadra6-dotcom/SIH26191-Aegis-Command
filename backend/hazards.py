import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.request import Request, urlopen
import httpx
from gis import get_live_feed

TTL_SECONDS = 180
MAX_EVENTS_PER_HIT = 12

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast?current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto&forecast_days=1&latitude={lat}&longitude={lon}"

INDIA_CENTER = (22.5, 82.0)

# Static multi-epoch vulnerability model per state (mirror of frontend).
STATE_MODEL = {
    "Assam": {"flood": 95, "landslide": 75, "cyclone": 20, "earthquake": 60, "districts": 35, "center": (26.2, 92.9)},
    "Kerala": {"flood": 80, "landslide": 88, "cyclone": 50, "earthquake": 15, "districts": 14, "center": (10.5, 76.3)},
    "Odisha": {"flood": 82, "landslide": 35, "cyclone": 90, "earthquake": 20, "districts": 30, "center": (20.9, 85.1)},
    "Bihar": {"flood": 88, "landslide": 20, "cyclone": 10, "earthquake": 40, "districts": 38, "center": (25.9, 85.1)},
    "Uttarakhand": {"flood": 70, "landslide": 90, "cyclone": 5, "earthquake": 75, "districts": 13, "center": (30.3, 78.0)},
    "Himachal Pradesh": {"flood": 60, "landslide": 80, "cyclone": 5, "earthquake": 65, "districts": 12, "center": (31.1, 77.2)},
    "West Bengal": {"flood": 78, "landslide": 40, "cyclone": 70, "earthquake": 30, "districts": 23, "center": (22.9, 87.9)},
    "Andhra Pradesh": {"flood": 60, "landslide": 30, "cyclone": 65, "earthquake": 20, "districts": 26, "center": (15.9, 79.7)},
    "Tamil Nadu": {"flood": 65, "landslide": 25, "cyclone": 60, "earthquake": 10, "districts": 38, "center": (11.1, 78.7)},
    "Manipur": {"flood": 65, "landslide": 85, "cyclone": 5, "earthquake": 70, "districts": 16, "center": (24.8, 93.9)},
    "Nagaland": {"flood": 55, "landslide": 75, "cyclone": 5, "earthquake": 60, "districts": 12, "center": (26.2, 94.6)},
    "Sikkim": {"flood": 75, "landslide": 90, "cyclone": 5, "earthquake": 80, "districts": 6, "center": (27.5, 88.5)},
    "Maharashtra": {"flood": 60, "landslide": 45, "cyclone": 30, "earthquake": 35, "districts": 36, "center": (19.7, 75.7)},
    "Gujarat": {"flood": 50, "landslide": 15, "cyclone": 55, "earthquake": 60, "districts": 33, "center": (22.3, 72.6)},
    "Rajasthan": {"flood": 25, "landslide": 10, "cyclone": 10, "earthquake": 20, "districts": 50, "center": (27.0, 74.2)},
    "Meghalaya": {"flood": 72, "landslide": 82, "cyclone": 10, "earthquake": 50, "districts": 12, "center": (25.5, 91.4)},
    "Arunachal Pradesh": {"flood": 70, "landslide": 85, "cyclone": 5, "earthquake": 75, "districts": 26, "center": (28.2, 94.7)},
    "Mizoram": {"flood": 60, "landslide": 80, "cyclone": 5, "earthquake": 55, "districts": 11, "center": (23.2, 92.9)},
    "Tripura": {"flood": 65, "landslide": 60, "cyclone": 10, "earthquake": 50, "districts": 8, "center": (23.9, 91.5)},
    "Jammu & Kashmir": {"flood": 65, "landslide": 80, "cyclone": 5, "earthquake": 85, "districts": 20, "center": (33.7, 76.9)},
    "Uttar Pradesh": {"flood": 72, "landslide": 20, "cyclone": 5, "earthquake": 40, "districts": 75, "center": (26.8, 80.9)},
    "Madhya Pradesh": {"flood": 58, "landslide": 30, "cyclone": 5, "earthquake": 30, "districts": 52, "center": (23.5, 77.5)},
    "Chhattisgarh": {"flood": 60, "landslide": 35, "cyclone": 5, "earthquake": 25, "districts": 33, "center": (21.3, 81.9)},
    "Jharkhand": {"flood": 65, "landslide": 40, "cyclone": 5, "earthquake": 40, "districts": 24, "center": (23.6, 85.3)},
    "Punjab": {"flood": 40, "landslide": 10, "cyclone": 5, "earthquake": 25, "districts": 23, "center": (31.1, 75.3)},
    "Haryana": {"flood": 35, "landslide": 5, "cyclone": 5, "earthquake": 25, "districts": 22, "center": (29.1, 76.1)},
    "Karnataka": {"flood": 55, "landslide": 40, "cyclone": 25, "earthquake": 20, "districts": 31, "center": (15.3, 75.7)},
    "Telangana": {"flood": 55, "landslide": 20, "cyclone": 25, "earthquake": 15, "districts": 33, "center": (17.9, 79.3)},
    "Goa": {"flood": 45, "landslide": 30, "cyclone": 35, "earthquake": 10, "districts": 2, "center": (15.3, 74.0)},
}

GDACS_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?alertlevel=Green,Orange,Red"
GDACS_TYPE_MAP = {
    "FL": ("flood", "Flood"), "TC": ("cyclone", "Tropical Cyclone"),
    "EQ": ("earthquake", "Earthquake"), "DR": ("drought", "Drought"),
    "WF": ("wildfire", "Wildfire"), "VO": ("volcano", "Volcanic Activity"),
}
GDACS_SEVERITY = {"Red": "high", "Orange": "medium", "Green": "low"}
_GDACS_EVENTS: list[dict] = []


def fetch_live_disasters():
    """Pull the live GDACS (Global Disaster Alert and Coordination System) feed
    and cache India-relevant events for the hazard feed. Runs every 30 min via
    the background scheduler, and once eagerly at startup."""
    global _GDACS_EVENTS
    print("Fetching live GDACS disaster data...")
    try:
        with httpx.Client(timeout=15, headers={"User-Agent": "Aegis-Command/4.2"}) as client:
            response = client.get(GDACS_URL)
            response.raise_for_status()
            data = response.json()

        parsed = []
        for feature in data.get("features", []):
            props = feature.get("properties", {}) or {}
            geom = feature.get("geometry", {}) or {}
            coords = geom.get("coordinates")
            country = (props.get("country") or "")
            # GDACS is global — keep it to India & near neighbours so the feed stays relevant.
            if "india" not in country.lower() and not any(
                n in country.lower() for n in ("nepal", "bangladesh", "pakistan", "sri lanka", "myanmar", "bhutan")
            ):
                continue
            if not coords or len(coords) < 2:
                continue
            etype = props.get("eventtype")
            category, label = GDACS_TYPE_MAP.get(etype, ("other", etype or "Event"))
            parsed.append({
                "id": f"gdacs-{props.get('eventid', len(parsed))}",
                "title": f"{label} — {props.get('name') or country}",
                "category": category,
                "severity": GDACS_SEVERITY.get(props.get("alertlevel"), "low"),
                "place": country or "Region",
                "state": None,
                "latitude": coords[1],
                "longitude": coords[0],
                "time": props.get("fromdate") or datetime.now(timezone.utc).isoformat(),
                "source": "GDACS (Global Disaster Alert & Coordination System)",
                "status": "live",
                "detail": props.get("description") or f"{label} alert level {props.get('alertlevel')} — {country}.",
            })
        _GDACS_EVENTS = parsed
        print(f"GDACS: cached {len(parsed)} India-region events.")
    except Exception as exc:
        print(f"GDACS fetch failed (keeping previous cache): {exc}")
    return _GDACS_EVENTS

# Severe-weather emissary points across India (live telemetry).
WEATHER_POINTS = [
    ("Guwahati", "Assam", {"flood", "landslide"}, 26.18, 91.75),
    ("Silchar", "Assam", {"flood", "landslide"}, 24.82, 92.80),
    ("Patna", "Bihar", {"flood"}, 25.60, 85.12),
    ("Darbhanga", "Bihar", {"flood"}, 26.15, 85.90),
    ("Varanasi", "Uttar Pradesh", {"flood"}, 25.32, 83.01),
    ("Lucknow", "Uttar Pradesh", {"flood", "heat"}, 26.85, 80.95),
    ("Delhi", "Delhi", {"flood", "heat"}, 28.70, 77.10),
    ("Kolkata", "West Bengal", {"flood", "cyclone"}, 22.57, 88.36),
    ("Darjeeling", "West Bengal", {"landslide"}, 27.04, 88.26),
    ("Bhubaneswar", "Odisha", {"flood", "cyclone"}, 20.30, 85.82),
    ("Puri", "Odisha", {"cyclone"}, 19.81, 85.83),
    ("Mumbai", "Maharashtra", {"flood"}, 19.08, 72.88),
    ("Nagpur", "Maharashtra", {"heat"}, 21.15, 79.09),
    ("Ahmedabad", "Gujarat", {"heat"}, 23.02, 72.57),
    ("Porbandar", "Gujarat", {"cyclone"}, 21.64, 69.60),
    ("Jodhpur", "Rajasthan", {"heat"}, 26.24, 73.01),
    ("Chennai", "Tamil Nadu", {"flood", "cyclone"}, 13.08, 80.27),
    ("Visakhapatnam", "Andhra Pradesh", {"cyclone", "flood"}, 17.73, 83.31),
    ("Kochi", "Kerala", {"flood", "landslide"}, 9.93, 76.27),
    ("Wayanad", "Kerala", {"landslide"}, 11.60, 76.08),
    ("Munnar", "Kerala", {"landslide"}, 10.09, 77.06),
    ("Thiruvananthapuram", "Kerala", {"cyclone"}, 8.52, 76.94),
    ("Chamoli", "Uttarakhand", {"landslide", "flood"}, 30.44, 79.32),
    ("Dehradun", "Uttarakhand", {"landslide"}, 30.32, 78.03),
    ("Shimla", "Himachal Pradesh", {"landslide"}, 31.10, 77.17),
    ("Shillong", "Meghalaya", {"landslide", "flood"}, 25.58, 91.89),
    ("Imphal", "Manipur", {"landslide", "flood"}, 24.81, 93.94),
    ("Gangtok", "Sikkim", {"landslide"}, 27.33, 88.61),
]

INDUSTRIAL_REGISTRY = [
    {"id": "ind-001", "title": "Legacy industrial contamination site — Bhopal MIC zone", "place": "Bhopal, Madhya Pradesh", "state": "Madhya Pradesh", "latitude": 23.28, "longitude": 77.41, "severity": "high", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "Legacy methyl-isocyanate groundwater poisoning zone requiring continuous monitoring.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-002", "title": "LPG gas leak incident site — Visakhapatnam", "place": "Visakhapatnam, Andhra Pradesh", "state": "Andhra Pradesh", "latitude": 17.78, "longitude": 83.30, "severity": "high", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "Styrene gas storage cluster, previously affected by LG Polymers leak (2020).", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-003", "title": "Petrochemical complex — Manali, Chennai", "place": "Chennai, Tamil Nadu", "state": "Tamil Nadu", "latitude": 13.19, "longitude": 80.26, "severity": "medium", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "Dense petroleum/fertiliser cluster close to residential wards.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-004", "title": "Refinery & MIDC complex — Taloja/Mahul, Mumbai", "place": "Mumbai, Maharashtra", "state": "Maharashtra", "latitude": 19.04, "longitude": 73.12, "severity": "medium", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "High-density hazardous-material manufacturing belt.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-005", "title": "Refinery belt — Jamnagar", "place": "Jamnagar, Gujarat", "state": "Gujarat", "latitude": 22.47, "longitude": 70.06, "severity": "medium", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "World-scale refinery concentration; vapour-cloud dispersion risk on high-wind days.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-006", "title": "Coastal refinery & port complex — Paradip", "place": "Paradip, Odisha", "state": "Odisha", "latitude": 20.30, "longitude": 86.60, "severity": "medium", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "Refinery adjacent to cyclone-prone coast; combined cyclone + industrial risk.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-007", "title": "Oil refinery — Guwahati, Assam", "place": "Guwahati, Assam", "state": "Assam", "latitude": 26.20, "longitude": 91.70, "severity": "medium", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "Flood-prone environs around petroleum processing units.", "time": "2026-01-01T00:00:00+00:00"},
    {"id": "ind-008", "title": "Refinery cluster — Panipat", "place": "Panipat, Haryana", "state": "Haryana", "latitude": 29.39, "longitude": 76.97, "severity": "low", "status": "monitoring", "source": "India Industrial Hazard Registry", "detail": "High-capacity refinery; routine hazmat drills active.", "time": "2026-01-01T00:00:00+00:00"},
]

_CACHE: dict[str, tuple[float, object]] = {}


def _fetch_json(url, timeout=12):
    req = Request(url, headers={"User-Agent": "Aegis-Command/4.2 live hazard telemetry", "Accept": "application/json"})
    with urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _get_weather():
    now = time.time()
    cached = _CACHE.get("__weather__")
    if cached and (now - cached[0]) < TTL_SECONDS:
        return cached[1]

    def one(point):
        name, state, tags, lat, lon = point
        try:
            blob = _fetch_json(OPEN_METEO_URL.format(lat=lat, lon=lon))
            if not blob:
                return name, None
            import json
            data = json.loads(blob)
            cur = data.get("current") or {}
            return name, {
                "temp": cur.get("temperature_2m"),
                "precip": cur.get("precipitation"),
                "wcode": cur.get("weather_code"),
                "wind": cur.get("wind_speed_10m"),
            }
        except Exception:
            return name, None

    readings = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        for name, reading in pool.map(one, WEATHER_POINTS):
            if reading:
                readings[name] = reading
    _CACHE["__weather__"] = (now, readings)
    return readings


def _sev_badge(level):
    return {"severe": "high", "watch": "medium", "advisory": "low"}.get(level, "low")


def _weather_events():
    readings = _get_weather()
    events = []
    ts = datetime.now(timezone.utc).isoformat()

    def add(point, category, level, title, detail, sev):
        name, state, tags, lat, lon = point
        events.append(
            {
                "id": f"wt-{category}-{name.lower().replace(' ', '-')}",
                "title": title,
                "category": category,
                "severity": _sev_badge(level),
                "level": level,
                "place": f"{name}, {state}",
                "state": state,
                "latitude": lat,
                "longitude": lon,
                "time": ts,
                "source": "Open-Meteo realtime weather",
                "status": "live",
                "detail": detail,
            }
        )

    for point in WEATHER_POINTS:
        name, state, tags, lat, lon = point
        r = readings.get(name)
        if not r:
            continue
        precip = r.get("precip") or 0.0
        wind = r.get("wind") or 0.0
        temp = r.get("temp")
        wcode = r.get("wcode")

        if "flood" in tags:
            if precip >= 20:
                add(point, "flood", "severe", f"Extreme rainfall — flood watch {name}", f"{precip:.1f} mm last hour at {name}, {state}; urban/riverine flooding likely. Code {wcode}.", "high")
            elif precip >= 10:
                add(point, "flood", "watch", f"Heavy rainfall — flood watch {name}", f"{precip:.1f} mm last hour at {name}, {state}; low-lying areas at risk.", "medium")
            elif precip >= 4:
                add(point, "flood", "advisory", f"Steady rainfall — flood advisory {name}", f"{precip:.1f} mm last hour at {name}, {state}; monitor drains.", "low")
        if "landslide" in tags:
            if precip >= 15 or (wcode and wcode >= 95):
                add(point, "landslide", "severe", f"Rain-driven landslide watch {name}", f"{precip:.1f} mm/h and code {wcode} at {name}; slope failure risk elevated.", "high")
            elif precip >= 8:
                add(point, "landslide", "watch", f"Landslide watch {name}", f"{precip:.1f} mm/h at {name}, {state}; monitor hill corridors.", "medium")
        if "cyclone" in tags:
            if wind >= 55:
                add(point, "cyclone", "severe", f"Gale-force winds — cyclone watch {name}", f"Wind {wind:.0f} km/h at coastal {name}; surge & storm risk.", "high")
            elif wind >= 40:
                add(point, "cyclone", "watch", f"Strong coastal winds {name}", f"Wind {wind:.0f} km/h at {name}; small-craft advisory.", "medium")
        if "heat" in tags and temp is not None:
            if temp >= 42:
                add(point, "heatwave", "severe", f"Extreme heat {name}", f"{temp:.0f}°C at {name}; heatwave protocols advised.", "high")
            elif temp >= 40:
                add(point, "heatwave", "watch", f"Heatwave watch {name}", f"{temp:.0f}°C at {name}; hydration advisories.", "medium")
            elif temp >= 38:
                add(point, "heatwave", "advisory", f"Heat advisory {name}", f"{temp:.0f}°C at {name}.", "low")
    return events


def _quake_events():
    feed = get_live_feed()
    out = []
    for raw in feed.get("events", []):
        mag = raw.get("magnitude", 0)
        severity = "high" if mag >= 5 else ("medium" if mag >= 3.5 else "low")
        out.append(
            {
                "id": raw.get("id"),
                "title": f"M{raw.get('magnitude')} earthquake — {raw.get('place')}",
                "category": "earthquake",
                "severity": severity,
                "place": raw.get("place"),
                "state": None,
                "latitude": raw.get("latitude"),
                "longitude": raw.get("longitude"),
                "time": raw.get("time"),
                "source": feed.get("source"),
                "status": "live",
                "detail": f"Magnitude {mag} at {raw.get('depth_km')} km depth.",
            }
        )
    return out


def _state_hazard_events():
    """Nationwide vulnerability-layer events so every category reflects all India."""
    ts = datetime.now(timezone.utc).isoformat()
    events = []
    for category, key, label in (
        ("flood", "flood", "Flood-prone"),
        ("landslide", "landslide", "Landslide-prone"),
        ("cyclone", "cyclone", "Cyclone-prone"),
        ("earthquake", "earthquake", "Seismic"),
    ):
        for name, model in STATE_MODEL.items():
            score = model.get(key, 0)
            if score < 55:
                continue
            severity = "high" if score >= 75 else ("medium" if score >= 65 else "low")
            lat, lon = model["center"]
            events.append(
                {
                    "id": f"vuln-{category}-{name.lower().replace(' ', '-')}",
                    "title": f"{label} risk zone — {name}",
                    "category": category,
                    "severity": severity,
                    "place": f"{name} (state-wide)",
                    "state": name,
                    "latitude": lat,
                    "longitude": lon,
                    "time": ts,
                    "source": "Aegis India Vulnerability Model",
                    "status": "risk",
                    "detail": (
                        f"{name} registers {score}% exposure to {category} across "
                        f"{model['districts']} districts — pre-position relief per state plan."
                    ),
                }
            )
    return events


def _all_events():
    events = []
    events.extend(_state_hazard_events())
    events.extend(_quake_events())
    events.extend(_weather_events())
    events.extend(_GDACS_EVENTS)
    events.extend({**item, "category": "industrial"} for item in INDUSTRIAL_REGISTRY)
    events.sort(key=lambda e: (e.get("time") or "", e.get("severity") or ""), reverse=True)
    return events


def get_hazard_events(category="all"):
    key = category or "all"
    now = time.time()
    cached = _CACHE.get(key)
    if cached and (now - cached[0]) < TTL_SECONDS:
        return cached[1]

    try:
        source = "USGS NEIC + Open-Meteo realtime + Industrial Registry"
        events = _all_events()
        live = True
        stale = False
    except Exception:
        events = [{**dict(e), "category": "industrial"} for e in INDUSTRIAL_REGISTRY]
        source = "Offline buffer"
        live = False
        stale = True

    if key != "all":
        events = [e for e in events if e["category"] == key]

    events = events[: (MAX_EVENTS_PER_HIT * 4 if key == "all" else MAX_EVENTS_PER_HIT)]
    payload = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "live": live,
        "stale": stale,
        "category": key,
        "region": "India nationwide",
        "count": len(events),
        "events": events,
    }
    _CACHE[key] = (now, payload)
    return payload