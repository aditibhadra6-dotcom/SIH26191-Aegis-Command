import hashlib

from seed_data import (
    HAZARD_COMPOSITE,
    HAZARD_TREND,
    HUBS,
    INCIDENTS,
    OPERATIONS,
    OPERATORS,
    RED_ZONES,
    TICKER,
)


def _reset(db, collection, docs):
    col = db[collection]
    col.delete_many({})
    if docs:
        col.insert_many(docs)


def _hash_operators(operators):
    hashed = []
    for op in operators:
        op = dict(op)
        code = op.pop("clearance_code", None)
        if code:
            op["clearance_hash"] = hashlib.sha256(code.encode()).hexdigest()
        hashed.append(op)
    return hashed


def seed_all(db):
    _reset(db, "operators", _hash_operators(OPERATORS))
    _reset(db, "operations", OPERATIONS)
    _reset(db, "hubs", HUBS)
    _reset(db, "hazard_trend", HAZARD_TREND)
    _reset(db, "hazard_composite", HAZARD_COMPOSITE)
    _reset(db, "ticker", [{"message": m} for m in TICKER])
    _reset(db, "red_zones", RED_ZONES)
    _reset(db, "incidents", INCIDENTS)
    db["evacuations"].delete_many({})