import json
import math
import os
import re
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen

from gis import get_live_feed
from hazards import STATE_MODEL, WEATHER_POINTS, get_hazard_events

# ── AI advice knowledge base ──────────────────────────────────────
# Deterministic decision graph: hazard type -> responder departments,
# first-response actions and operational timeline. Fused with live
# telemetry before being served, so each call reflects current ground truth.

HAZARD_KB = {
    "flood": {
        "title": "Riverine / Flash Flood",
        "icon": "wave",
        "summary": (
            "Flood inundation is the highest-frequency hazard in India. Priority is "
            "life safety: pre-emptive evacuation, de-energising waterlogged feeders, "
            "safe drinking water, sanitation containment and rescue staging before "
            "peak discharge reaches habitations."
        ),
        "affected_states": ["Assam", "Bihar", "West Bengal", "Odisha", "Uttar Pradesh"],
        "departments": [
            ("NDRF — National Disaster Response Force", "Flood rescue, boat teams & pre-staged evacuation columns", 1),
            ("SDRF / SDMA (State)", "State-level rescue, relief camps and search operations", 2),
            ("Electricity Board / Discom", "De-energise flooded feeders, prevent electrocution, restore post-recession", 3),
            ("Sanitation & PHE", "Safe drinking water, water-borne disease control, waste disposal", 4),
            ("Health & Medical Services", "Water-borne illness surge, malaria/dengue watch, field clinics", 5),
            ("Fire & Emergency Services", "Rope/barge rescue, pump-out operations in low-lying wards", 6),
            ("District Administration / Collector", "Evacuation orders, relief & compensation, camp coordination", 7),
            ("Police & Home", "Cordon, traffic management, prevent loot of vacated assets", 8),
            ("Water Resources / CWC", "River-level telemetry, breach alerts, dam-gate coordination", 9),
            ("Telecom / BSNL", "Emergency comms continuity for rescue crews", 10),
        ],
        "actions": [
            "Issue pre-emptive evacuation for 'critical' & 'high' flood zones within impact window",
            "De-energise distribution feeders crossing flooded streets",
            "Stock relief camps with clean water, ORS, blankets and generators",
            "Activate river-gauge watch and breach crews at levees/embankments",
            "Route medical and sanitation teams to high-population low-lying wards",
            "Publish daily flood bulletins via IMD + CWC telemetry to field units",
        ],
        "timeline": "0h: alerts · 0–6h: rescue & evacuation · 6–48h: relief, power & water restoration · 1–4 weeks: sanitation & rehabilitation",
    },
    "earthquake": {
        "title": "Earthquake / Seismic Event",
        "icon": "activity",
        "summary": (
            "Seismic events risk structural collapse and mass-casualty scenarios. "
            "Urban Search & Rescue (USAR), rapid structural triage and energy "
            "isolation must activate simultaneously with aftershock monitoring."
        ),
        "affected_states": ["Jammu & Kashmir", "Sikkim", "Arunachal Pradesh", "Uttarakhand", "Gujarat"],
        "departments": [
            ("NDRF USAR Teams", "Urban search & rescue, collapsed-structure breaching", 1),
            ("Fire & Emergency Services", "Fire suppression, extraction, building evacuation", 2),
            ("Health & Hospitals", "Mass-casualty triage, trauma care, blood supply", 3),
            ("PWD / Municipal Corporation", "Rapid structural inspection, demolition of unsafe buildings", 4),
            ("Electricity Board", "Grid islanding, hazard-wire isolation, restoration", 5),
            ("Telecom / BSNL", "Rebuild emergency comms, public alerting", 6),
            ("Police & Home", "Access control, safe-zone management, missing persons", 7),
            ("Public Works / Irrigation", "Dam & slope inspections for secondary failure", 8),
        ],
        "actions": [
            "Deploy USAR teams to highest priority-score zones",
            "Inspect schools, hospitals and high-rise clusters for integrity",
            "Isolate gas and power in affected wards first",
            "Stand up field coordination post immediately",
            "Run aftershock monitoring via GSI and seismological observatories",
        ],
        "timeline": "0–48h: search & rescue · 0–72h: medical surge · 1–2 weeks: structural audit · 1–3 months: reconstruction planning",
    },
    "cyclone": {
        "title": "Cyclone / Coastal Storm",
        "icon": "shield",
        "summary": (
            "Tropical cyclones couple wind, surge and torrential rain. Evacuation "
            "of low-lying coastal tracts, shelter operability and port/fishery "
            "suspension are the deciding factors for casualty reduction."
        ),
        "affected_states": ["Odisha", "West Bengal", "Andhra Pradesh", "Tamil Nadu", "Gujarat"],
        "departments": [
            ("IMD — Cyclone Warning Division", "Track, landfall window & intensity advisories", 1),
            ("Coast Guard / Navy", "Fisher folk warnings, coastal patrol, vessel guidance", 2),
            ("NDRF / SDRF", "Coastal evacuation & cyclone shelter operations", 3),
            ("Police & Revenue", "Evacuation enforcement, shelter registration", 4),
            ("Agriculture & Fisheries Dept", "Boat-ban, seed relief, crop-loss assessment", 5),
            ("Electricity Board", "Pre-storm grid securing, line repair after landfall", 6),
            ("PWD / Water Resources", "Cyclone shelters, embankment watch, surge bunds", 7),
            ("Health & Medical Services", "Shelter clinics, snakebite & trauma readiness", 8),
            ("Telecom / BSNL", "Keep warning channels & shelter comms live", 9),
        ],
        "actions": [
            "Issue fishermen return to shore notification 12–24h ahead of impact",
            "Convert schools/multipurpose buildings into notified cyclone shelters",
            "Pre-position boats, generators and food at shelters",
            "Secure embankments and close surge-prone roads early",
            "Disable power in surge-affected substations before landfall",
        ],
        "timeline": "72h: track & warn · 24h: full evacuation · 0–12h: landfall response · 1–7 days: power/comm restoration & damage census",
    },
    "landslide": {
        "title": "Landslide / Slope Failure",
        "icon": "layers",
        "summary": (
            "Slope failures in the Himalayan and Western Ghats ranges isolate "
            "communities and block roads. Immediate actions centre on road "
            "reopening, geotechnical assessment and safe relocation of cliff-"
            "adjacent habitations."
        ),
        "affected_states": ["Uttarakhand", "Kerala", "Meghalaya", "Manipur", "Sikkim"],
        "departments": [
            ("SDRF / NDRF", "Trapped-person rescue and slope-adjacent evacuation", 1),
            ("GSI — Geological Survey of India", "Slope stability & residual-risk assessment", 2),
            ("State PWD / BRO", "Road clearance, detour routes, culvert repair", 3),
            ("Electricity Board", "Restore lines cut by slides; isolate damaged stretches", 4),
            ("Telecom / BSNL", "Restore connectivity cut along hill corridors", 5),
            ("Health & Medical Services", "Trauma & evacuation of injured from blocked zones", 6),
            ("District Administration", "Relief sheltering for displaced hill habitations", 7),
            ("Water Resources", "Watch blocked river channels for flash-dam failure", 8),
        ],
        "actions": [
            "Close high-risk cliff corridors at night and during heavy rain",
            "Deploy slope actuators/wireless sensors on active scarps",
            "Clear arterial roads with priority to rescue corridors",
            "Relocate households within run-out zones after GSI assessment",
            "Alert downstream communities of possible river-blockage flash floods",
        ],
        "timeline": "0–12h: rescue · 1–3 days: road & power restoration · 1–2 weeks: geotechnical audit · 1–6 months: relocation planning",
    },
    "industrial": {
        "title": "Industrial / Hazmat Incident",
        "icon": "factory",
        "summary": (
            "Industrial sites near habitations pose toxic-vapour, fire and water-"
            "contamination risks. Response must be command-controlled: cordons, "
            "hazmat teams, environmental sampling and public health screening."
        ),
        "affected_states": ["Gujarat", "Maharashtra", "Tamil Nadu", "Andhra Pradesh", "Odisha"],
        "departments": [
            ("District Emergency / CIFSE Command", "On-scene command, evacuation decisions & public info", 1),
            ("Fire & Hazardous Materials Teams", "Containment, firefighting, vapour suppression", 2),
            ("State Pollution Control Board / CPCB", "Air-water sampling, plume modelling, advisories", 3),
            ("Health & Hospitals", "Exposure screening, decontamination & toxicology support", 4),
            ("Police & Home", "Radius cordon, traffic diversion, perimeter security", 5),
            ("Labour & Factories Inspectorate", "Site regulatory response, incident records", 6),
            ("Electricity Board", "Isolate grid/plant power to cut ignition sources", 7),
            ("PHE / Water Department", "Stop intake from contaminated waterbodies, supply tankers", 8),
            ("Transport Dept / ONGC-PSUs", "Chemical-transit tracking and mutual-aid teams", 9),
        ],
        "actions": [
            "Establish incident command and cordon radius from plume model",
            "Order evacuation of populated downwind sectors",
            "Stop water intakes near any contaminant-detected waterbody",
            "Screen exposed residents and livestock for intoxication",
            "Publish verified safety/health guidance to counter misinformation",
        ],
        "timeline": "0–1h: command & cordon · 1–24h: hazmat containment · 1–7 days: environmental sampling · 1–3 months: remediation & audit",
    },
    "heatwave": {
        "title": "Heatwave / Extreme Temperature",
        "icon": "thermometer",
        "summary": (
            "Sustained extreme temperatures multiply heatstroke, power-grid and "
            "agricultural stress. Cooling-centre activation, work-hour rules and "
            "power prioritisation for health facilities are the core responses."
        ),
        "affected_states": ["Rajasthan", "Uttar Pradesh", "Haryana", "Punjab", "Gujarat"],
        "departments": [
            ("IMD", "Heatwave classification & district-level warnings", 1),
            ("Health & Medical Services", "Heatstroke clinics, hydration camps", 2),
            ("Electricity Board", "Grid balancing for AC/cooling load, outage triage", 3),
            ("Water / PHE", "Drinking-water augmentation, tanker routes", 4),
            ("Labour Department", "Work-hour restrictions for outdoor labour", 5),
            ("Municipal Corporations", "Cooling shelters, water kiosks, parks management", 6),
            ("Agriculture Dept", "Crop advisories, livestock heat care", 7),
            ("Police / DM", "Public advisories and power-cut coordination", 8),
        ],
        "actions": [
            "Open notified cooling centres in urban wards",
            "Shift outdoor labour schedules off peak heat hours",
            "Prioritise power feeds to hospitals and water pumps",
            "Increase water-tanker frequency to high-density areas",
            "Publish daily heat advisories with district classifications",
        ],
        "timeline": "Daily: advisories · 48h: preparedness · immediate: emergency response & relief · 1–3 weeks: recovery & impact assessment",
    },
}

CANONICAL = {
    "flash_flood": "flood", "floods": "flood", "flooding": "flood", "riverine": "flood",
    "earthquakes": "earthquake", "quake": "earthquake", "seismic": "earthquake",
    "cyclones": "cyclone", "storm": "cyclone", "storm surge": "cyclone", "typhoon": "cyclone",
    "landslides": "landslide", "mudslide": "landslide", "mudslide": "landslide",
    "industrial": "industrial", "hazmat": "industrial", "chemical": "industrial", "factory": "industrial",
    "heatwave": "heatwave", "heat_wave": "heatwave", "extreme heat": "heatwave",
}

HAZARD_LABEL = {
    "flood": "Floods", "earthquake": "Earthquakes", "cyclone": "Cyclones",
    "landslide": "Landslides", "industrial": "Industrial / Hazmat", "heatwave": "Heatwave",
}

# Keyword scanner for free-form questions → hazard type. Questions are scored
# against every hazard's vocabulary so that mixed/vague phrasing picks the
# strongest family instead of first-match-wins.
HAZARD_KEYWORDS = [
    ("earthquake", ["earthquake", "quake", "seismic", "tremor", "aftershock", "richter", "magnitude", "epicentre", "epicenter", "rumbling", "trembling", "ground shake"]),
    ("cyclone", ["cyclone", "tropical storm", "storm surge", "typhoon", "hurricane", "landfall", "gale", "coastal wind", "wind speed", "sea storm"]),
    ("landslide", ["landslide", "landslip", "mudslide", "slope failure", "debris flow", "rock fall", "hill collapse", "cloudburst", "glacial burst"]),
    ("industrial", ["industrial", "hazmat", "chemical", "factory", "gas leak", "refinery", "toxic", "explosion", "blast", "plant", "psu", "ammonia", "pipeline leak", "acid"]),
    ("heatwave", ["heatwave", "heat wave", "extreme heat", "scorching", "heat stroke", "hot spell", "sunstroke"]),
    ("flood", ["flood", "flooding", "rain", "inundat", "waterlog", "dam breach", "river rise", "monsoon", "deluge", "downpour", "embankment", "water level", "reservoir release"]),
]

# Question intent families — decide the *shape* of the answer so that
# "what should we do", "who responds", "how many", "will it rain", etc.
# each get a genuinely different, situation-aware response.
INTENT_RULES = [
    ("compare", [" vs ", "versus", "compare ", "compared to", "which is worse", "difference between"]),
    ("statistics", ["how many", "count", "number of", "statistics", "stats", "total", "data", "census"]),
    ("weather", ["weather", "temperature", "forecast", "rain today", "will it rain", "cloud", "thunder", "sunny", "humid", "degrees", "celsius", "atmospheric"]),
    ("evacuation", ["evacuat", "shelter", "relocat", "where to go", "safe zone", "who should leave", "move out", "camps"]),
    ("status", ["status", "latest", "update", "news", "situation", "current", "going on", "live feed", "right now", "moment"]),
    ("risk", ["risk", "danger", "dangerous", "safe", "severe", "threat", "how bad", "impacted", "affected", "high alert", "warning"]),
    ("responders", ["who", " ndrf", "ndrf", "sdma", "agenc", "department", "collector", "team", "command", "responsible", "rescue", "deploy", "deployed", "battalion"]),
    ("action", ["what to do", "how to", "what should", "action", "prepare", "prepared", "guideline", "do's and don't", "dos and don'ts", "do's & don'ts", "safety", "protect", "respond", "measures", "plan", "tips"]),
    ("definition", ["what is", "what are", "explain", "define", "about ", "meaning", "understand", "tell me about"]),
    ("timeline", ["when", "how long", "time to", "duration", "how soon", "how fast"]),
    ("location", ["where", "location", "which area", "which states", "near ", "places"]),
]

STATE_ALIASES = {
    "andhra pradesh": "Andhra Pradesh", " ap": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh", "arunachal": "Arunachal Pradesh",
    "assam": "Assam", "bihar": "Bihar", "chhattisgarh": "Chhattisgarh",
    "chattisgarh": "Chhattisgarh", " cg": "Chhattisgarh", "goa": "Goa", "gujarat": "Gujarat",
    "haryana": "Haryana", "himachal pradesh": "Himachal Pradesh", "himachal": "Himachal Pradesh",
    "jammu": "Jammu & Kashmir", "kashmir": "Jammu & Kashmir", " j&k": "Jammu & Kashmir",
    "jharkhand": "Jharkhand", "karnataka": "Karnataka", "kerala": "Kerala", "kashmir": "Jammu & Kashmir",
    "madhya pradesh": "Madhya Pradesh", " mp": "Madhya Pradesh",
    "maharashtra": "Maharashtra", "manipur": "Manipur", "meghalaya": "Meghalaya", "mizoram": "Mizoram",
    "nagaland": "Nagaland", "odisha": "Odisha", "orissa": "Odisha", "punjab": "Punjab",
    "rajasthan": "Rajasthan", "sikkim": "Sikkim", "tamil nadu": "Tamil Nadu", " tn": "Tamil Nadu",
    "telangana": "Telangana", "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh", " up": "Uttar Pradesh", "uttarakhand": "Uttarakhand",
    "west bengal": "West Bengal", "bengal": "West Bengal", " wb": "West Bengal",
    "delhi": "Delhi",
}

RISK_BY_STATE = {
    "Assam": "critical", "Kerala": "high", "Odisha": "high", "Bihar": "high",
    "Uttarakhand": "high", "West Bengal": "high", "Sikkim": "high", "Manipur": "high",
    "Arunachal Pradesh": "high", "Meghalaya": "high", "Jammu & Kashmir": "high",
}

_SEV_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}

_WMO = {
    0: "clear sky", 1: "mainly clear", 2: "partly cloudy", 3: "overcast",
    45: "fog", 48: "rime fog",
    51: "light drizzle", 53: "drizzle", 55: "heavy drizzle", 56: "freezing drizzle", 57: "freezing drizzle",
    61: "light rain", 63: "moderate rain", 65: "heavy rain", 66: "freezing rain", 67: "freezing rain",
    71: "light snow", 73: "moderate snow", 75: "heavy snow", 77: "snow grains",
    80: "light showers", 81: "moderate showers", 82: "violent showers", 85: "snow showers", 86: "snow showers",
    95: "thunderstorm", 96: "thunderstorm with hail", 99: "thunderstorm with heavy hail",
}

_LIVE_CACHE: dict[str, tuple[float, object]] = {}


def normalize_hazard(hazard):
    key = (hazard or "").strip().lower().replace("-", "_")
    if key in HAZARD_KB:
        return key
    return CANONICAL.get(key, "flood")


def _detect_hazard(text):
    q = (text or "").lower()
    best_key, best_score = None, 0
    for key, words in HAZARD_KEYWORDS:
        score = sum(1 for w in words if w in q)
        if score > best_score:
            best_key, best_score = key, score
    return best_key


def _extract_state(ql):
    """Find a state mention inside the question text itself."""
    for alias, state in STATE_ALIASES.items():
        if " " in alias.strip():
            if alias.strip() in ql:
                return state
        elif re.search(rf"(?<![a-z]){re.escape(alias.strip())}(?![a-z])", ql):
            return state
    return ""


def _mentioned_place(ql):
    """If the question names a known district/city, pin it and its state."""
    try:
        from search import CITY_SPOTS, DISTRICT_SPOTS
    except Exception:
        return None
    for src in (CITY_SPOTS, DISTRICT_SPOTS):
        for name, (state, _lat, _lon) in src.items():
            if name in ql:
                return (name.title(), state)
    return None


def _detect_intent(ql):
    """Which kind of answer does the operator actually want?"""
    best, best_score = "general", 0
    for intent, pats in INTENT_RULES:
        score = sum(1 for p in pats if p in ql)
        if score > best_score:
            best, best_score = intent, score
    return best


def _second_hazard(ql, primary):
    for key, words in HAZARD_KEYWORDS:
        if key == primary:
            continue
        if any(w in ql for w in words):
            return key
    return None


def _overall_counts():
    counts = {}
    for k in HAZARD_KB:
        try:
            feed = get_hazard_events(k)
            counts[k] = len(feed.get("events", []) or [])
        except Exception:
            counts[k] = 0
    return counts


def _posture(state, peak):
    base = RISK_BY_STATE.get(state, "medium")
    sev = peak if peak and _SEV_RANK.get(peak, 0) > _SEV_RANK.get(base, 0) else base
    flag = "CRITICAL — RED, full emergency response" if sev == "critical" \
        else "HIGH — AMBER, elevated response" if sev == "high" \
        else "MEDIUM — YELLOW, monitored posture"
    return sev, flag


def _wcode_text(code):
    try:
        return _WMO.get(int(code), "precipitation")
    except (TypeError, ValueError):
        return None


def _km(lat1, lon1, lat2, lon2):
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def _state_center(state):
    m = STATE_MODEL.get(state)
    return (m["center"][0], m["center"][1]) if m else None


def _ago(iso):
    if not iso:
        return ""
    try:
        t = datetime.fromisoformat(str(iso).replace("Z", "+00:00"))
        secs = int((datetime.now(timezone.utc) - t).total_seconds())
        if secs < 0:
            return ""
        if secs < 60:
            return "just now"
        if secs < 3600:
            return f"{secs // 60} min ago"
        if secs < 86400:
            return f"{secs // 3600} h ago"
        return f"{secs // 86400} d ago"
    except Exception:
        return ""


def _fetch_json(url, timeout=13):
    req = Request(url, headers={"User-Agent": "Aegis-Advisor/5.0 live telemetry", "Accept": "application/json"})
    with urlopen(req, timeout=timeout) as resp:
        data = resp.read()
    return json.loads(data) if data else None


def _live_weather(state):
    if not state:
        return []
    key = f"w:{state}"
    now = time.time()
    hit = _LIVE_CACHE.get(key)
    if hit and (now - hit[0]) < 120:
        return hit[1]

    readings = {}
    try:
        from hazards import _get_weather
        readings = _get_weather()
    except Exception:
        pass

    out = []
    for name, st, _tags, lat, lon in WEATHER_POINTS:
        if st != state:
            continue
        r = readings.get(name)
        if not r:
            continue
        out.append({
            "station": name, "lat": lat, "lon": lon,
            "temp": r.get("temp"), "precip": r.get("precip"),
            "wind": r.get("wind"), "wcode": r.get("wcode"),
            "wtext": _wcode_text(r.get("wcode")),
        })

    if not out:
        center = _state_center(state)
        if center:
            try:
                data = _fetch_json(
                    "https://api.open-meteo.com/v1/forecast?current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=auto&forecast_days=1&latitude={lat}&longitude={lon}"
                    .format(lat=center[0], lon=center[1])
                )
                cur = (data or {}).get("current") or {}
                out.append({
                    "station": f"{state} (state centre)", "lat": center[0], "lon": center[1],
                    "temp": cur.get("temperature_2m"), "precip": cur.get("precipitation"),
                    "wind": cur.get("wind_speed_10m"), "wcode": cur.get("weather_code"),
                    "wtext": _wcode_text(cur.get("weather_code")),
                })
            except Exception:
                pass

    _LIVE_CACHE[key] = (now, out)
    return out


def _live_events(key, state):
    try:
        feed = get_hazard_events(key)
        evts = list(feed.get("events", []) or [])
    except Exception:
        evts = []
    if not state:
        return _sort_live(evts)[:8]
    center = _state_center(state)
    near = [e for e in evts if e.get("state") == state]
    if center:
        for e in evts:
            if e in near:
                continue
            lat, lon = e.get("latitude"), e.get("longitude")
            if lat is not None and lon is not None and _km(center[0], center[1], lat, lon) < 450:
                near.append(e)
    seen, out = set(), []
    for e in _sort_live(near):
        if e.get("id") not in seen:
            seen.add(e.get("id"))
            out.append(e)
    return out[:6]


def _sort_live(evts):
    def prefer(e):
        live = 0 if e.get("status") == "live" else 1
        sev = _SEV_RANK.get(e.get("severity"), 0)
        try:
            ep = datetime.fromisoformat(str(e.get("time") or "").replace("Z", "+00:00")).timestamp()
        except Exception:
            ep = 0
        return (live, -sev, -ep)
    return sorted(evts, key=prefer)


def _live_quakes(state):
    try:
        feed = get_live_feed()
        quakes = list(feed.get("events", []) or [])
    except Exception:
        return []
    if not state:
        return quakes[:3]
    center = _state_center(state)
    if not center:
        return quakes[:3]
    near = [q for q in quakes
            if q.get("latitude") is not None and q.get("longitude") is not None
            and _km(center[0], center[1], q["latitude"], q["longitude"]) < 900]
    return near[:3]


def _live_context(key, state):
    events = _live_events(key, state)
    quakes = _live_quakes(state)
    weather = _live_weather(state)
    peak = None
    if events:
        peak = max((e.get("severity") for e in events), key=lambda s: _SEV_RANK.get(s, 0))
    sources = []
    for e in events + quakes:
        s = e.get("source")
        if s and s not in sources:
            sources.append(s)
    for w in weather:
        wsrc = "Open-Meteo live weather"
        if wsrc not in sources:
            sources.append(wsrc)
    if not sources:
        sources.append("Aegis India Vulnerability Model")
    return {"events": events, "quakes": quakes, "weather": weather,
            "peak_severity": peak, "sources": sources}


def _weather_line(w, brief=False):
    cond = []
    if w.get("wtext"):
        cond.append(w["wtext"])
    t = w.get("temp")
    if t is not None:
        cond.append(f"{t:.0f}°C")
    p = w.get("precip")
    if p is not None and float(p) > 0:
        cond.append(f"{float(p):.1f} mm/h rain")
    ws = w.get("wind")
    if ws is not None and float(ws) >= 25:
        cond.append(f"{float(ws):.0f} km/h wind")
    base = f"{w['station']}: " + ", ".join(cond) if cond else f"{w['station']}: no reading"
    return base[:120] if brief else base


def _situation_items(key, state, ctx):
    items = []
    event_ids = {e.get("id") for e in ctx["events"]}
    for e in ctx["events"][:4]:
        sev = e.get("severity") or ""
        items.append(f"{e.get('title', 'Event')} — {e.get('place', '')} ({sev})")
    for q in ctx["quakes"][:2]:
        if q.get("id") in event_ids:
            continue
        items.append(f"M{q.get('magnitude')} {q.get('place', '')} — {_ago(q.get('time'))}")
    for w in ctx["weather"][:2]:
        items.append(_weather_line(w))
    if not items:
        items.append(f"No active {key} events near {state or 'India'} — posture held from national vulnerability model.")
    return items


def _latest_update(key, state, ctx):
    if ctx["events"]:
        e = ctx["events"][0]
        ago = _ago(e.get("time"))
        return f"{e.get('title', 'Hazard alert')} — {e.get('place', '')} ({ago})".replace("()", "").replace("  ", " ")
    if ctx["quakes"]:
        q = ctx["quakes"][0]
        return f"M{q.get('magnitude')} quake near {q.get('place', '')} — {_ago(q.get('time'))}"
    if ctx["weather"]:
        return _weather_line(ctx["weather"][0], brief=True)
    return f"No active {key} events near {state or 'India'} right now."


def _compose_summary(key, state, ctx, kb):
    state_label = f"**{state}**" if state else "**All India**"
    lines = [kb["summary"], f"AI evaluation for {state_label} applies the live {kb['title'].lower()} response posture."]
    if ctx["events"]:
        lines.append(
            f"Live ground truth: {len(ctx['events'])} active {key} item(s) near {state or 'the country'} "
            f"(peak {ctx['peak_severity'] or 'unknown'} severity) — tactics prioritised to those zones."
        )
    if ctx["quakes"]:
        q = ctx["quakes"][0]
        lines.append(f"Seismic context: M{q.get('magnitude')} near {q.get('place')} recorded {_ago(q.get('time'))}.")
    if ctx["weather"]:
        lines.append("Telemetry: " + " · ".join(_weather_line(w, brief=True) for w in ctx["weather"][:2]))
    return " ".join(lines)


def _llm_config():
    url = os.environ.get("AI_LLM_URL", "").strip().rstrip("/")
    key = os.environ.get("AI_LLM_KEY", "").strip()
    return url, key


def _llm_complete(system, user, timeout=35):
    url, key = _llm_config()
    if not (url and key):
        return None
    endpoint = url if url.endswith("/chat/completions") else url + "/chat/completions"
    body = {
        "model": os.environ.get("AI_LLM_MODEL", "gpt-4o-mini"),
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
        "temperature": 0.3,
        "max_tokens": 1400,
    }
    req = Request(endpoint, data=json.dumps(body).encode(), headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {key}",
        "User-Agent": "Aegis-Advisor/5.0",
    }, method="POST")
    with urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read())
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return None


def _llm_augment_advice(key, state, ctx, base):
    """Merge a real-LLM verdict into the deterministic payload, if configured."""
    kb_summary = HAZARD_KB[key]["summary"]
    system = (
        "You are Aegis ADVISOR, a national hazard-decision system for India. "
        "Return ONLY a JSON object with keys: summary, situation (array of strings), "
        "latest_update (one short string), actions (array of <=6 strings), timeline (one string). "
        "Ground every claim in the live data provided. Be terse and operational."
    )
    user = json.dumps({
        "hazard": key, "state": state or "All India",
        "kb_summary": kb_summary,
        "situation": ctx["events"],
        "quakes": ctx["quakes"],
        "weather": ctx["weather"],
    }, default=str)
    try:
        raw = _llm_complete(system, user)
        if not raw:
            return base
        start, end = raw.find("{"), raw.rfind("}")
        if start < 0 or end < 0:
            return base
        verdict = json.loads(raw[start:end + 1])
        merged = dict(base)
        for k_en, k_py in (("summary", "summary"), ("situation", "situation"),
                           ("latest_update", "latest_update"), ("actions", "actions"),
                           ("timeline", "timeline")):
            v = verdict.get(k_en)
            if v:
                merged[k_py] = v
        merged["llm"] = True
        merged["llm_note"] = "Verdict generated by live LLM inference (fallback fields from decision graph)."
        return merged
    except Exception:
        return base


def get_advice(hazard, state=""):
    key = normalize_hazard(hazard)
    kb = HAZARD_KB[key]
    state = (state or "").strip()
    ctx = _live_context(key, state)

    base_risk = RISK_BY_STATE.get(state, "medium")
    peak = ctx["peak_severity"]
    severity = peak if peak and _SEV_RANK.get(peak, 0) > _SEV_RANK.get(base_risk, 0) else base_risk

    affected = list(kb["affected_states"])
    for e in ctx["events"]:
        s = e.get("state")
        if s and s not in affected:
            affected.append(s)
        if len(affected) >= 6:
            break
    affected = affected[:6]

    live = bool(ctx["events"] or ctx["quakes"] or ctx["weather"])
    confidence = 0.92 if live else (0.9 if key in ("flood", "earthquake") else 0.85)

    base = {
        "hazard": key,
        "title": kb["title"],
        "state": state or "All India",
        "severity": severity,
        "confidence": confidence,
        "summary": _compose_summary(key, state, ctx, kb),
        "affected_states": affected,
        "departments": [{"name": n, "role": r, "priority": p} for n, r, p in kb["departments"]],
        "actions": list(kb["actions"]),
        "timeline": kb["timeline"],
        "situation": _situation_items(key, state, ctx),
        "latest_update": _latest_update(key, state, ctx),
        "sources": list(ctx["sources"]),
        "live": live,
        "llm": False,
        "model": "Aegis ADVISOR v5.0 — live telemetry–fused decision engine",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
    }

    if _llm_config()[0] and _llm_config()[1]:
        base = _llm_augment_advice(key, state, ctx, base)
    return base


def _compose_answer(parsed, ctx, verdict=None):
    key = parsed["key"]
    state = parsed["state"]
    q = parsed["raw"]
    intent = parsed["intent"]
    kb = HAZARD_KB[key]

    if verdict:
        return verdict.strip()

    state_label = state or "All India"
    sev, flag = _posture(state, ctx["peak_severity"])
    lines = [f"Question: \"{q}\""]
    lines.append(f"Scope: **{state_label}** · Focus: **{kb['title']}** · Live posture: {flag}")

    if ctx["events"]:
        lines.append("Today's live ground truth:")
        for e in ctx["events"][:4]:
            lines.append(f"· {e.get('title')} — {e.get('place')} ({e.get('severity')}, {_ago(e.get('time'))})")
    if ctx["quakes"]:
        qq = ctx["quakes"][0]
        lines.append(f"· Seismic: M{qq.get('magnitude')} near {qq.get('place')} {_ago(qq.get('time'))}")

    lines.append("")

    if intent == "statistics":
        counts = _overall_counts()
        active = sum(counts.values())
        lines.append(f"Live India hazard census — {active} active event(s) in this window:")
        for k, n in counts.items():
            lines.append(f"  · {HAZARD_LABEL[k]}: {n}")
        st_map = {}
        for e in ctx["events"]:
            s = e.get("state") or "?"
            st_map[s] = st_map.get(s, 0) + 1
        if st_map:
            top = sorted(st_map.items(), key=lambda x: -x[1])[:4]
            lines.append("Busiest states in focus: " + ", ".join(f"{s} ({n})" for s, n in top))
        lines.append("Counts are recomputed on every refresh cycle, not cached answers.")

    elif intent == "weather":
        if ctx["weather"]:
            lines.append("Current telemetry from Open-Meteo:")
            for w in ctx["weather"][:4]:
                lines.append("  · " + _weather_line(w))
        if ctx["events"]:
            lines.append("Storm/rain-driven alerts: " + "; ".join(
                f"{e.get('place')} ({e.get('severity')})" for e in ctx["events"][:3]))
        lines.append("Track IMD warnings and river-gauge bulletins — the readings above are live.")

    elif intent == "status":
        lines.append("Latest update: " + _latest_update(key, state, ctx))
        lines.append("Detailed situation items:")
        for s in _situation_items(key, state, ctx):
            lines.append("  · " + s)
        if len(ctx["events"]) > 4:
            lines.append(f"...plus {len(ctx['events']) - 4} more active feed item(s).")

    elif intent == "responders":
        lines.append(f"Who responds for {kb['title'].lower()} (priority order):")
        for n, r, p in kb["departments"][:8]:
            lines.append(f"  {p}. {n} — {r}")
        if state:
            lines.append(f"Coordinate first with the {state} SDMA; NDRF battalions activate on the Collector's order.")

    elif intent == "evacuation":
        lines.append("Evacuation posture:")
        if any(e.get("severity") in ("high", "critical") for e in ctx["events"]):
            for e in ctx["events"][:3]:
                if e.get("severity") in ("high", "critical"):
                    lines.append(f"  · Pre-emptive evacuation flagged: {e.get('place')} ({e.get('severity')}) — {_ago(e.get('time'))}.")
        else:
            lines.append("  · No zone currently at high/critical severity — posture held, shelters on standby.")
        lines.append("  · Collector issues evacuation orders within the impact window for high/critical zones.")
        lines.append("  · Open notified shelters; pre-position boats, water, ORS and power.")
        lines.append("  · Verify route status in the Relocation Hubs tab before moving civilians.")
        lines.append("  · De-energise flooded feeders, cordon and guard vacated areas.")

    elif intent == "risk":
        lines.append(f"Risk classification for {state_label}: **{sev.upper()}** — {flag}.")
        lines.append("States on the elevated list: " + ", ".join(kb["affected_states"]))
        lines.append("Highest live severity in focus: " + (ctx["peak_severity"] or "unknown") + ".")

    elif intent == "definition":
        lines.append(kb["summary"])
        lines.append("Susceptible states: " + ", ".join(kb["affected_states"]))
        lines.append("Aegis grades this hazard against the national vulnerability model fused with current telemetry.")

    elif intent == "compare":
        second = _second_hazard(parsed["ql"], key)
        if second:
            kb2 = HAZARD_KB[second]
            c2 = _live_context(second, state)
            lines.append(f"Comparing **{kb['title']}** vs **{kb2['title']}** (live, {state_label}):")
            lines.append(f"  · {HAZARD_LABEL[key]} active item(s): {len(ctx['events'])}; peak {ctx['peak_severity'] or 'n/a'}")
            lines.append(f"  · {HAZARD_LABEL[second]} active item(s): {len(c2['events'])}; peak {c2['peak_severity'] or 'n/a'}")
            lines.append("Priority follows live severity, not the hazard name — task the zone with the highest peak.")
        else:
            lines.append("To compare hazards, phrase it like: 'cyclone vs flood in Odisha'.")

    elif intent == "timeline":
        lines.append("Operational timeline: " + kb["timeline"])
        if ctx["events"]:
            lines.append("Oldest alert in focus updated: " + (_ago(ctx["events"][-1].get("time") or "") or "now"))
        if ctx["weather"]:
            lines.append("Conditions setting the clock: " + " · ".join(_weather_line(w, True) for w in ctx["weather"][:2]))

    elif intent == "location":
        if parsed["place"]:
            lines.append(f"Noted place: **{parsed['place']}** ({state}) — pinned from your question.")
        if ctx["events"]:
            lines.append("Areas surfacing in the live feed:")
            for e in ctx["events"][:5]:
                lines.append(f"  · {e.get('place')} — {e.get('state') or '?'} ({e.get('severity')})")
        else:
            lines.append(f"  No active {key} locations near {state_label} right now.")

    elif intent == "action":
        lines.append("Recommended response (priority order):")
        for a in kb["actions"][:6]:
            lines.append("  · " + a)
        lines.append("Timeline: " + kb["timeline"])
        lines.append("Key responders: " + ", ".join(n.split(" — ")[0] for n, _r, _p in kb["departments"][:5]))

    else:  # general
        lines.append(kb["summary"])
        if ctx["events"]:
            lines.append("Immediate hotspots: " + " | ".join(
                f"{e.get('place')} ({e.get('severity')})" for e in ctx["events"][:3]))
        lines.append("Next-step actions:")
        for a in kb["actions"][:4]:
            lines.append("  · " + a)

    lines.append("")
    lines.append("This answer is recomputed on every call from live telemetry + the decision graph — it changes as the situation does.")
    return "\n".join(lines)


def _parse_history(history):
    """Tolerant parser for the chat transcript sent by the frontend."""
    if not history:
        return []
    try:
        raw = json.loads(history)
    except Exception:
        return []
    if not isinstance(raw, list):
        return []
    prev = []
    for it in raw:
        if isinstance(it, dict):
            role = "assistant" if str(it.get("role", "")).lower() in ("ai", "assistant", "bot") else "user"
            txt = str(it.get("content") or it.get("text") or "")
        elif isinstance(it, (list, tuple)) and len(it) >= 2:
            role = "assistant" if str(it[0]).lower() in ("ai", "assistant", "bot") else "user"
            txt = str(it[1])
        else:
            continue
        if txt.strip():
            prev.append((role, txt.strip()))
    return prev[-8:]


def _context_from_history(prev):
    """Inherit hazard/state from earlier chat turns so follow-ups stay in scope."""
    prev_hazard, prev_state = None, ""
    for _role, txt in reversed(prev):
        if prev_hazard is None:
            h = _detect_hazard(txt.lower())
            if h:
                prev_hazard = h
        if not prev_state:
            s = _extract_state(txt.lower())
            if s:
                prev_state = s
        if prev_hazard and prev_state:
            break
    return prev_hazard, prev_state


def ask(question, state="", history=""):
    q = (question or "").strip()
    state_arg = (state or "").strip()
    ql = q.lower()

    # Dynamic parse: hazard (scored), state & place extracted from the question
    # text itself, and intent (what shape of answer the operator wants).
    hazard = _detect_hazard(ql)
    state_mentions = _extract_state(ql)
    place = _mentioned_place(ql)
    state = state_arg or state_mentions or (place[1] if place else "")
    intent = _detect_intent(ql)

    prev = _parse_history(history)
    prev_hazard, prev_state = _context_from_history(prev)
    if not state:
        state = prev_state

    # No hazard cue → either give the live all-India briefing (fresh thread) or
    # keep following the hazard the operator was already discussing.
    if hazard is None and intent == "general" and not prev_hazard:
        counts = _overall_counts()
        top = max(counts, key=counts.get)
        active = sum(counts.values())
        briefing = (
            f"No specific hazard or state detected, so here is the live all-India briefing.\n"
            f"Active events this window: {active}\n"
            f"  · Floods: {counts['flood']}  · Earthquakes: {counts['earthquake']}  · Cyclones: {counts['cyclone']}\n"
            f"  · Landslides: {counts['landslide']}  · Industrial / Hazmat: {counts['industrial']}  · Heatwave: {counts['heatwave']}\n"
            f"The busiest family right now is **{HAZARD_LABEL[top]}**. "
            "To go deeper, ask things like 'What should we do for floods in Bihar?', "
            "'Who responds to a cyclone in Odisha?', or 'How many events are active today?'"
        )
        key = normalize_hazard(top)
    else:
        if hazard is None:
            hazard = prev_hazard
        if hazard is None:
            try:
                counts = _overall_counts()
                hazard = max(counts, key=counts.get)
            except Exception:
                hazard = "flood"
        key = normalize_hazard(hazard)
        briefing = None

    kb = HAZARD_KB[key]
    ctx = _live_context(key, state)
    parsed = {"raw": q, "ql": ql, "key": key, "state": state, "place": place, "intent": intent}

    verdict = None
    llm = False
    if _llm_config()[0] and _llm_config()[1]:
        system = (
            "You are Aegis ADVISOR for India — live disaster decision support. "
            f"Operator question intent: {intent}; hazard focus: {key}; scope: {state or 'All India'}. "
            "Answer in clear operational English (max two short paragraphs plus a bulleted list). "
            "Shape the answer to the intent: statistics→counts, weather→telemetry, responders→agencies, "
            "action→do's and don'ts, evacuation→posture, compare→side-by-side. "
            "Ground every claim in the live data provided; if live data conflicts with general knowledge, follow the live data. "
            "Name the responding agencies explicitly for this hazard and region."
        )
        payload = {
            "question": q, "intent": intent, "state": state or "All India",
            "hazard_key": key, "kb_departments": [n for n, _r, _p in kb["departments"]],
            "kb_actions": kb["actions"], "live_events": ctx["events"],
            "quakes": ctx["quakes"], "weather": ctx["weather"],
        }
        if prev:
            payload["conversation_context"] = [{"role": r, "content": t} for r, t in prev]
        user = json.dumps(payload, default=str)
        try:
            verdict = _llm_complete(system, user, timeout=45)
        except Exception:
            verdict = None
        llm = bool(verdict and verdict.strip())

    answer = briefing if briefing else _compose_answer(parsed, ctx, verdict)
    sev, _flag = _posture(state, ctx["peak_severity"])
    live = bool(ctx["events"] or ctx["quakes"] or ctx["weather"])

    return {
        "question": q,
        "answer": answer,
        "hazard": key,
        "title": kb["title"],
        "state": state or "All India",
        "intent": intent,
        "severity": sev,
        "departments": [{"name": n, "role": r, "priority": p} for n, r, p in kb["departments"]],
        "actions": list(kb["actions"]),
        "situation": _situation_items(key, state, ctx),
        "latest_update": _latest_update(key, state, ctx),
        "sources": list(ctx["sources"]),
        "live": live,
        "llm": llm,
        "model": "Aegis ADVISOR v5.2 — intent-aware chat + live telemetry–fused decision engine" + (" · live LLM inference" if llm else ""),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "refreshed_at": datetime.now(timezone.utc).isoformat(),
    }