from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import ml_model
from ai import ask, get_advice
from db import get_db
from gis import get_live_feed
from hazards import get_hazard_events
from models import EvacuateRequest
from search import search_places
from serializers import camelize, public

router = APIRouter(tags=["api"])

SEVERITY_SCORE = {"critical": 1.0, "high": 0.7, "medium": 0.4}
TIMELINE = {"critical": "Immediate relocation (1–3 months)", "high": "Short-term relocation (3–12 months)", "medium": "Medium-term relocation (12–36 months)"}


@router.get("/health")
def health():
    return {"status": "ok", "service": "aegis-command-api", "version": "4.2.1", "db": "connected", "time": datetime.now(timezone.utc).isoformat()}


@router.get("/dashboard/overview")
def overview():
    db = get_db()
    zones = list(db["red_zones"].find({}))
    hubs = list(db["hubs"].find({}))
    ops = db["operations"].find_one({}) or {}

    at_risk = sum(z.get("population", 0) for z in zones)
    safe_capacity = sum(h.get("capacity", 0) - h.get("current", 0) for h in hubs)
    zone_names = " · ".join(z["zone"] for z in zones)

    return camelize(
        {
            "at_risk_population": at_risk,
            "at_risk_sub": ops.get("at_risk_sub", "+12% this hour"),
            "active_red_zones": len(zones),
            "red_zone_names": zone_names,
            "safe_capacity": safe_capacity,
            "safe_capacity_across": f"across {len(hubs)} relocation hubs",
            "ndrf_teams_active": ops.get("ndrf_teams_active", 0),
            "ndrf_teams_sub": ops.get("ndrf_teams_sub", ""),
            "evacuation_routes_total": ops.get("evacuation_routes_total", 0),
            "evacuation_routes_sub": ops.get("evacuation_routes_sub", ""),
            "hub_count": len(hubs),
        }
    )


@router.get("/alerts/ticker")
def ticker():
    db = get_db()
    items = [t["message"] for t in db["ticker"].find({})]
    return {"items": items, "count": len(items)}


@router.get("/carrying-capacity")
def carrying_capacity():
    db = get_db()
    hubs = [public(h) for h in db["hubs"].find({})]
    overhead = sum(h["current"] for h in hubs) / sum(h["capacity"] for h in hubs)
    return {"hubs": camelize(hubs), "overall_occupancy": round(overhead * 100), "hub_count": len(hubs)}


@router.get("/hazards/trend")
def hazard_trend():
    db = get_db()
    return {"points": camelize([public(t) for t in db["hazard_trend"].find({})])}


@router.get("/hazards/composite")
def composite():
    db = get_db()
    metrics = [public(m) for m in db["hazard_composite"].find({})]
    overall = round(sum(m["value"] for m in metrics) / len(metrics)) if metrics else 0
    return {
        "metrics": camelize(metrics),
        "overall_index": overall,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/gis/live")
def gis_live():
    return get_live_feed()


@router.get("/gis/events")
def gis_events(category: str = "all"):
    return camelize(get_hazard_events(category or "all"))


@router.get("/gis/search")
def gis_search(q: str):
    if not (q or "").strip():
        raise HTTPException(status_code=422, detail="Search query 'q' is required")
    return camelize(search_places(q))


@router.get("/ai/advice")
def ai_advice(hazard: str = "flood", state: str = ""):
    return camelize(get_advice(hazard, state))


@router.get("/ai/ask")
def ai_ask(q: str, state: str = "", history: str = ""):
    if not (q or "").strip():
        raise HTTPException(status_code=422, detail="Question 'q' is required")
    return camelize(ask(q, state, history))


@router.get("/red-zones")
def red_zones():
    db = get_db()
    return {"zones": camelize([public(z) for z in db["red_zones"].find({})]), "count": db["red_zones"].count_documents({})}


@router.get("/red-zones/{zone_id}")
def red_zone(zone_id: int):
    db = get_db()
    zone = db["red_zones"].find_one({"id": zone_id})
    if not zone:
        raise HTTPException(status_code=404, detail="Red zone not found")
    return camelize(public(zone))


@router.get("/relocations")
def relocations():
    db = get_db()
    zones = list(db["red_zones"].find({}))
    zones.sort(key=lambda z: {"critical": 0, "high": 1, "medium": 2}.get(z["severity"], 3))
    return {"alerts": camelize([public(z) for z in zones]), "count": len(zones)}


@router.get("/relocations/{zone_id}")
def relocation(zone_id: int):
    db = get_db()
    zone = db["red_zones"].find_one({"id": zone_id})
    if not zone:
        raise HTTPException(status_code=404, detail="Red zone not found")
    return camelize(public(zone))


@router.post("/relocations/{zone_id}/evacuate")
def evacuate(zone_id: int, req: EvacuateRequest):
    db = get_db()
    zone = db["red_zones"].find_one({"id": zone_id})
    if not zone:
        raise HTTPException(status_code=404, detail="Red zone not found")
    record = {
        "zone": zone["zone"],
        "district": zone["district"],
        "operator_id": req.operator_id,
        "note": req.note,
        "initiated_at": datetime.now(timezone.utc).isoformat(),
    }
    db["evacuations"].insert_one(dict(record))
    return {"ok": True, "message": f"Evacuation protocol initiated for {zone['zone']}", "record": camelize(record)}


@router.get("/incidents")
def incidents():
    db = get_db()
    records = [public(i) for i in db["incidents"].find({})]
    order = {"active": 0, "in_transit": 1, "action": 2, "monitoring": 3, "complete": 4}
    records.sort(key=lambda i: order.get(i["status"], 9))
    return {"incidents": camelize(records), "count": len(records)}


@router.get("/analysis/priorities")
def priorities():
    db = get_db()
    zones = list(db["red_zones"].find({}))
    if not zones:
        return {"priorities": [], "generated_at": None}

    max_pop = max(z["population"] for z in zones) or 1
    max_hh = max(z["households"] for z in zones) or 1

    scored = []
    for z in zones:
        sev = SEVERITY_SCORE.get(z["severity"], 0.4)
        pop_n = z["population"] / max_pop
        hh_n = z["households"] / max_hh
        score = 10 * (0.4 * sev + 0.4 * pop_n + 0.2 * hh_n)
        scored.append(
            {
                "id": z["id"],
                "zone": z["zone"],
                "district": z["district"],
                "hazard": z["hazard"],
                "severity": z["severity"],
                "population": z["population"],
                "households": z["households"],
                "priority_score": round(score, 2),
                "timeline": TIMELINE.get(z["severity"], "Review"),
            }
        )

    scored.sort(key=lambda s: s["priority_score"], reverse=True)
    return {"priorities": camelize(scored), "generated_at": datetime.now(timezone.utc).isoformat()}


# --- ML model: trained relocation-urgency scorer (see ml_model.py / README_MODEL.md) ---

@router.get("/ml/district-urgency")
def ml_district_urgency(limit: int = 20, state: str | None = None):
    """Real districts, real 2011 Census + government hazard-zone data, real
    trained RandomForestRegressor prediction — see model_metadata for the
    held-out test score and methodology."""
    return camelize(
        {
            "districts": ml_model.top_districts(limit=limit, state=state),
            "metadata": ml_model.METADATA,
        }
    )


class UrgencyProbeRequest(BaseModel):
    literacyRate: float = 0.7
    scStShare: float = 0.15
    dilapidatedHousingRate: float = 0.05
    noLatrineRate: float = 0.1
    noBathingFacilityRate: float = 0.1
    lowIncomeHouseholdRate: float = 0.4
    ruralHouseholdShare: float = 0.6
    seismicExposure: float = 0.3
    landslideExposure: float = 0.1
    floodExposure: float = 0.2
    cycloneExposure: float = 0.0


@router.post("/ml/probe")
def ml_probe(req: UrgencyProbeRequest):
    """Score a custom, user-adjustable feature vector live through the
    trained model — lets a judge (or you, live) tweak inputs and watch the
    model actually respond, instead of taking training results on faith."""
    features = {
        "literacy_rate": req.literacyRate,
        "sc_st_share": req.scStShare,
        "dilapidated_housing_rate": req.dilapidatedHousingRate,
        "no_latrine_rate": req.noLatrineRate,
        "no_bathing_facility_rate": req.noBathingFacilityRate,
        "low_income_household_rate": req.lowIncomeHouseholdRate,
        "rural_household_share": req.ruralHouseholdShare,
        "seismic_exposure": req.seismicExposure,
        "landslide_exposure": req.landslideExposure,
        "flood_exposure": req.floodExposure,
        "cyclone_exposure": req.cycloneExposure,
    }
    return camelize({"urgencyScore": ml_model.predict_custom(features)})