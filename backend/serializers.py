def _to_camel(key: str) -> str:
    head, *rest = key.split("_")
    return head + "".join(part.capitalize() for part in rest)


def camelize(value):
    if isinstance(value, dict):
        return {_to_camel(k): camelize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [camelize(item) for item in value]
    return value


_PRIVATE_FIELDS = {"_id", "clearance_hash"}


def public(doc):
    return {k: v for k, v in doc.items() if k not in _PRIVATE_FIELDS} if isinstance(doc, dict) else doc