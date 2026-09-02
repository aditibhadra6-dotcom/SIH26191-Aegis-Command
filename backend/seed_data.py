OPERATORS = [
    {
        "operator_id": "OP-7734-X",
        "name": "Col. A. Sharma",
        "role": "State Disaster Management Authority (SDMA)",
        "clearance_level": 4,
        "clearance_code": "SDMA-ALPHA-7734",
    },
    {
        "operator_id": "OP-8891-Q",
        "name": "Maj. R. Iyer",
        "role": "NDRF Field Commander",
        "clearance_level": 3,
        "clearance_code": "NDRF-BRAVO-8891",
    },
]

OPERATIONS = [
    {
        "at_risk_sub": "+12% this hour",
        "ndrf_teams_active": 7,
        "ndrf_teams_sub": "4 deployed · 3 standby",
        "evacuation_routes_total": 12,
        "evacuation_routes_sub": "9 clear · 3 partial",
    }
]

HUBS = [
    {"name": "Camp Alpha\nKanchipuram", "capacity": 1200, "current": 850, "projected": 1100},
    {"name": "Hub Beta\nErnakulam", "capacity": 800, "current": 790, "projected": 950},
    {"name": "Base Gamma\nBhubaneswar", "capacity": 2000, "current": 600, "projected": 750},
    {"name": "Site Delta\nPatna", "capacity": 1500, "current": 1450, "projected": 1800},
    {"name": "Zone Epsilon\nSilchar", "capacity": 900, "current": 300, "projected": 350},
]

HAZARD_TREND = [
    {"time": "00:00", "floods": 2, "landslides": 1, "coastal": 0},
    {"time": "04:00", "floods": 3, "landslides": 1, "coastal": 1},
    {"time": "08:00", "floods": 5, "landslides": 2, "coastal": 1},
    {"time": "12:00", "floods": 4, "landslides": 3, "coastal": 2},
    {"time": "16:00", "floods": 7, "landslides": 4, "coastal": 2},
    {"time": "20:00", "floods": 6, "landslides": 3, "coastal": 3},
    {"time": "Now", "floods": 8, "landslides": 5, "coastal": 3},
]

HAZARD_COMPOSITE = [
    {"metric": "Flood Risk", "value": 82},
    {"metric": "Landslide", "value": 67},
    {"metric": "Coastal", "value": 45},
    {"metric": "Seismic", "value": 38},
    {"metric": "Cloudburst", "value": 71},
    {"metric": "Drought", "value": 29},
]

TICKER = [
    "⚠ ALERT: Flash flood warning issued for Brahmaputra basin — 6 districts affected",
    "📡 Landslide probability elevated in Chamoli district — monitoring active",
    "🚁 NDRF Battalion 4 deployed to Silchar — ETA 35 min",
    "✅ Evacuation of Kendrapara Zone-B complete — 1,240 persons relocated",
    "🌊 Cyclone BIPARJOY track updated — coastal Karnataka on high watch",
    "📊 Carrying capacity of Hub Beta at 98% — overflow routing to Base Gamma",
]

RED_ZONES = [
    {
        "id": 1,
        "zone": "Delta-9",
        "district": "Silchar, Assam",
        "hazard": "Flash Flood",
        "severity": "critical",
        "population": 340,
        "households": 78,
        "time_to_impact": "2h 15m",
        "nearest_hub": "Hub Beta — 12 km",
        "route_status": "Clear",
        "latitude": 24.82,
        "longitude": 92.80,
    },
    {
        "id": 2,
        "zone": "Echo-4",
        "district": "Wayanad, Kerala",
        "hazard": "Landslide",
        "severity": "high",
        "population": 125,
        "households": 31,
        "time_to_impact": "4h 30m",
        "nearest_hub": "Camp Alpha — 8 km",
        "route_status": "Partial",
        "latitude": 11.62,
        "longitude": 76.08,
    },
    {
        "id": 3,
        "zone": "Bravo-1",
        "district": "Kendrapara, Odisha",
        "hazard": "Cyclonic Surge",
        "severity": "medium",
        "population": 890,
        "households": 214,
        "time_to_impact": "12h 00m",
        "nearest_hub": "Base Gamma — 22 km",
        "route_status": "Clear",
        "latitude": 20.45,
        "longitude": 86.42,
    },
]

INCIDENTS = [
    {
        "incident_id": "INC-2026-041",
        "title": "Flash flood warning — Brahmaputra basin",
        "region": "6 districts, Assam",
        "status": "active",
        "alert_level": "severe",
        "reported_at": "2026-08-27 06:40 IST",
    },
    {
        "incident_id": "INC-2026-042",
        "title": "Landslide probability elevated — Chamoli district",
        "region": "Uttarakhand",
        "status": "monitoring",
        "alert_level": "high",
        "reported_at": "2026-08-27 05:15 IST",
    },
    {
        "incident_id": "INC-2026-043",
        "title": "NDRF Battalion 4 en route to Silchar",
        "region": "Cachar, Assam",
        "status": "in_transit",
        "alert_level": "severe",
        "reported_at": "2026-08-27 04:58 IST",
    },
    {
        "incident_id": "INC-2026-044",
        "title": "Evacuation of Kendrapara Zone-B complete",
        "region": "Kendrapara, Odisha",
        "status": "complete",
        "alert_level": "info",
        "reported_at": "2026-08-27 03:30 IST",
    },
    {
        "incident_id": "INC-2026-045",
        "title": "Cyclone BIPARJOY track updated",
        "region": "Coastal Karnataka",
        "status": "monitoring",
        "alert_level": "high",
        "reported_at": "2026-08-27 02:10 IST",
    },
    {
        "incident_id": "INC-2026-046",
        "title": "Hub Beta at 98% capacity — overflow routing to Base Gamma",
        "region": "Ernakulam, Kerala",
        "status": "action",
        "alert_level": "medium",
        "reported_at": "2026-08-27 01:05 IST",
    },
]