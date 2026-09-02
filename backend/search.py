import json
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search?format=json&limit=8&accept-language=en&countrycodes=in&q="

STATE_CENTERS = {
    "Assam": (26.2, 92.9), "Kerala": (10.5, 76.3), "Odisha": (20.9, 85.1),
    "Bihar": (25.9, 85.1), "Uttarakhand": (30.3, 78.0), "Himachal Pradesh": (31.1, 77.2),
    "West Bengal": (22.9, 87.9), "Andhra Pradesh": (15.9, 79.7), "Tamil Nadu": (11.1, 78.7),
    "Manipur": (24.8, 93.9), "Nagaland": (26.2, 94.6), "Sikkim": (27.5, 88.5),
    "Maharashtra": (19.7, 75.7), "Gujarat": (22.3, 72.6), "Rajasthan": (27.0, 74.2),
    "Meghalaya": (25.5, 91.4), "Arunachal Pradesh": (28.2, 94.7), "Mizoram": (23.2, 92.9),
    "Tripura": (23.9, 91.5), "Jammu & Kashmir": (33.7, 76.9), "Uttar Pradesh": (26.8, 80.9),
    "Madhya Pradesh": (23.5, 77.5), "Chhattisgarh": (21.3, 81.9), "Jharkhand": (23.6, 85.3),
    "Punjab": (31.1, 75.3), "Haryana": (29.1, 76.1), "Karnataka": (15.3, 75.7),
    "Telangana": (17.9, 79.3), "Goa": (15.3, 74.0),
}

# Major India cities for instant, offline suggestion matching while the user types.
CITY_SPOTS = {
    "ahmedabad": ("Gujarat", 23.02, 72.57), "surat": ("Gujarat", 21.17, 72.83),
    "vadodara": ("Gujarat", 22.31, 73.19), "rajkot": ("Gujarat", 22.30, 70.80),
    "gandhinagar": ("Gujarat", 23.22, 72.65), "bhuj": ("Gujarat", 23.25, 69.67),
    "pune": ("Maharashtra", 18.52, 73.86), "thane": ("Maharashtra", 19.22, 72.98),
    "nashik": ("Maharashtra", 19.99, 73.79), "solapur": ("Maharashtra", 17.66, 75.91),
    "lucknow": ("Uttar Pradesh", 26.85, 80.95), "agra": ("Uttar Pradesh", 27.18, 78.01),
    "meerut": ("Uttar Pradesh", 28.98, 77.71), "gorakhpur": ("Uttar Pradesh", 26.76, 83.37),
    "jodhpur": ("Rajasthan", 26.30, 73.02), "udaipur": ("Rajasthan", 24.58, 73.71),
    "kota": ("Rajasthan", 25.21, 75.86), "ludhiana": ("Punjab", 30.90, 75.86),
    "amritsar": ("Punjab", 31.63, 74.87), "jalandhar": ("Punjab", 31.33, 75.58),
    "chandigarh": ("Chandigarh", 30.73, 76.78), "gurugram": ("Haryana", 28.46, 77.03),
    "faridabad": ("Haryana", 28.41, 77.31), "panipat": ("Haryana", 29.39, 76.97),
    "rohtak": ("Haryana", 28.89, 76.61), "indore": ("Madhya Pradesh", 22.72, 75.86),
    "gwalior": ("Madhya Pradesh", 26.22, 78.18), "ujjain": ("Madhya Pradesh", 23.18, 75.78),
    "jabalpur": ("Madhya Pradesh", 23.18, 79.99), "raipur": ("Chhattisgarh", 21.25, 81.63),
    "bhilai": ("Chhattisgarh", 21.19, 81.35), "ranchi": ("Jharkhand", 23.36, 85.33),
    "jamshedpur": ("Jharkhand", 22.80, 86.18), "bokaro": ("Jharkhand", 23.67, 86.15),
    "dhanbad": ("Jharkhand", 23.80, 86.43), "bhubaneswar": ("Odisha", 20.29, 85.82),
    "cuttack": ("Odisha", 20.46, 85.88), "rourkela": ("Odisha", 22.26, 84.85),
    "sambalpur": ("Odisha", 21.47, 83.97), "durgapur": ("West Bengal", 23.52, 87.32),
    "asansol": ("West Bengal", 23.68, 86.99), "coimbatore": ("Tamil Nadu", 11.02, 76.96),
    "madurai": ("Tamil Nadu", 9.93, 78.12), "tiruchirappalli": ("Tamil Nadu", 10.79, 78.70),
    "salem": ("Tamil Nadu", 11.66, 78.15), "thiruvananthapuram": ("Kerala", 8.52, 76.94),
    "kozhikode": ("Kerala", 11.26, 75.78), "kollam": ("Kerala", 8.89, 76.60),
    "mysuru": ("Karnataka", 12.30, 76.64), "hubballi": ("Karnataka", 15.36, 75.12),
    "mangaluru": ("Karnataka", 12.91, 74.86), "belagavi": ("Karnataka", 15.85, 74.50),
    "tirupati": ("Andhra Pradesh", 13.63, 79.42), "nellore": ("Andhra Pradesh", 14.45, 79.99),
    "kakinada": ("Andhra Pradesh", 16.99, 82.25), "rajahmundry": ("Andhra Pradesh", 17.00, 81.80),
    "warangal": ("Telangana", 17.97, 79.60), "nizamabad": ("Telangana", 18.67, 78.10),
    "karimnagar": ("Telangana", 18.44, 79.12), "dibrugarh": ("Assam", 27.47, 94.91),
    "jorhat": ("Assam", 26.75, 94.15), "tezpur": ("Assam", 26.63, 92.79),
    "nagaon": ("Assam", 26.35, 92.68), "shimla": ("Himachal Pradesh", 31.10, 77.17),
    "manali": ("Himachal Pradesh", 32.24, 77.19), "panaji": ("Goa", 15.49, 73.83),
    "margao": ("Goa", 15.27, 73.96), "aizawl": ("Mizoram", 23.73, 92.72),
    "kohima": ("Nagaland", 25.67, 94.11), "agartala": ("Tripura", 23.83, 91.28),
    "itanagar": ("Arunachal Pradesh", 27.08, 93.61), "dispur": ("Assam", 26.14, 91.79),
}

# Well-known disaster district hotspots to geo-locate searches precisely.
DISTRICT_SPOTS = {
    "silchar": ("Assam", 24.82, 92.80), "kamrup": ("Assam", 26.18, 91.75),
    "guwahati": ("Assam", 26.14, 91.74), "wayanad": ("Kerala", 11.60, 76.08),
    "kerala": ("Kerala", 10.50, 76.30), "chamoli": ("Uttarakhand", 30.20, 79.55),
    "kedarnath": ("Uttarakhand", 30.76, 79.07), "udham singh nagar": ("Uttarakhand", 28.95, 79.40),
    "kendrapara": ("Odisha", 20.50, 86.42), "paradip": ("Odisha", 20.30, 86.60),
    "puri": ("Odisha", 19.81, 85.83), "darjeeling": ("West Bengal", 27.04, 88.26),
    "chennai": ("Tamil Nadu", 13.08, 80.27), "vijayawada": ("Andhra Pradesh", 16.51, 80.64),
    "guntur": ("Andhra Pradesh", 16.30, 80.44), "kutch": ("Gujarat", 23.66, 69.86),
    "jamnagar": ("Gujarat", 22.47, 70.06), "bhopal": ("Madhya Pradesh", 23.26, 77.41),
    "visakhapatnam": ("Andhra Pradesh", 17.73, 83.31), "darbhanga": ("Bihar", 26.15, 85.90),
    "patna": ("Bihar", 25.60, 85.12), "morigaon": ("Assam", 26.25, 92.35),
    "dhubri": ("Assam", 26.03, 89.96), "imphal": ("Manipur", 24.81, 93.94),
    "shillong": ("Meghalaya", 25.58, 91.89), "gangtok": ("Sikkim", 27.33, 88.61),
    "dharamshala": ("Himachal Pradesh", 32.22, 76.32), "mandi": ("Himachal Pradesh", 31.71, 76.93),
    "mumbai": ("Maharashtra", 19.08, 72.88), "nagpur": ("Maharashtra", 21.15, 79.09),
    "aurangabad": ("Maharashtra", 19.88, 75.34), "jaypur": ("Rajasthan", 26.92, 75.79),
    "jaipur": ("Rajasthan", 26.92, 75.79), "delhi": ("Delhi", 28.70, 77.10),
    "srinagar": ("Jammu & Kashmir", 34.08, 74.80), "leh": ("Jammu & Kashmir", 34.16, 77.58),
    "dehradun": ("Uttarakhand", 30.32, 78.03), "prayagraj": ("Uttar Pradesh", 25.44, 81.85),
    "kanpur": ("Uttar Pradesh", 26.45, 80.33), "varanasi": ("Uttar Pradesh", 25.32, 83.01),
    "hyderabad": ("Telangana", 17.39, 78.49), "bangalore": ("Karnataka", 12.97, 77.59),
    "bengaluru": ("Karnataka", 12.97, 77.59), "kochi": ("Kerala", 9.93, 76.27),
    "cochin": ("Kerala", 9.93, 76.27), "kolkata": ("West Bengal", 22.57, 88.36),
}

_CACHE = {"updated_at": 0.0, "payload": None}


def _fetch_json(url, timeout=10):
    req = Request(url, headers={"User-Agent": "Aegis-Command/4.2 geocoding service", "Accept": "application/json"})
    with urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _match_score(name, term):
    """Return a rank for a suggestion (0 = best) or None if it does not match."""
    name_l = name.strip().lower()
    term_l = term.strip().lower()
    if not term_l or not name_l:
        return None
    if name_l.startswith(term_l):
        return 0  # clearest prefix match: "west" -> West Bengal
    if term_l in name_l:
        return 1  # substring: "guja" -> Gujarat
    if term_l.startswith(name_l):
        return 2  # full name submitted: "bengaluru" -> Bengaluru
    if name_l in term_l:
        return 3
    return None


def _state_results(query):
    lowered = query.strip().lower()
    ranked = []
    for source, kind in ((DISTRICT_SPOTS, "district"), (CITY_SPOTS, "city")):
        for name, (state, lat, lon) in source.items():
            score = _match_score(name, lowered)
            if score is None:
                continue
            ranked.append(
                {
                    "sort": (score, len(name)),
                    "id": f"{kind}-{name}",
                    "label": f"{state} · {name.title()}",
                    "type": kind,
                    "state": state,
                    "latitude": lat,
                    "longitude": lon,
                }
            )
    for name in STATE_CENTERS:
        score = _match_score(name, lowered)
        if score is None:
            continue
        lat, lon = STATE_CENTERS[name]
        ranked.append(
            {
                "sort": (score, len(name)),
                "id": f"state-{name}",
                "label": name,
                "type": "state",
                "state": name,
                "latitude": lat,
                "longitude": lon,
            }
        )
    ranked.sort(key=lambda r: r["sort"])
    for item in ranked:
        item.pop("sort", None)
    return ranked[:12]


def _nominatim_results(query):
    try:
        data = _fetch_json(NOMINATIM_URL + quote(f"{query}, India"))
    except Exception:
        return []
    results = []
    for place in data:
        display = place.get("display_name") or place.get("name") or ""
        state = None
        for name in STATE_CENTERS:
            if name.lower() in display.lower():
                state = name
                break
        if state is None:
            for token in DISTRICT_SPOTS.values():
                if token[0].lower() in display.lower():
                    state = token[0]
                    break
        results.append(
            {
                "id": f"geo-{place.get('place_id')}",
                "label": display,
                "type": "place",
                "state": state,
                "latitude": float(place.get("lat", 0) or 0),
                "longitude": float(place.get("lon", 0) or 0),
            }
        )
    return results


def search_places(query):
    query = (query or "").strip()
    results = _state_results(query)
    geo = _nominatim_results(query)
    seen = set()
    for item in geo:
        key = (round(item["latitude"], 2), round(item["longitude"], 2))
        if key in seen:
            continue
        seen.add(key)
        results.append(item)
        if len(results) >= 10:
            break
    return {
        "query": query,
        "count": len(results),
        "results": results,
        "source": "Aegis Gazetteer + OpenStreetMap Nominatim",
    }