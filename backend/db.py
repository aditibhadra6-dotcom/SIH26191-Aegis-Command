import mongomock

_client = None


def get_db():
    global _client
    if _client is None:
        _client = mongomock.MongoClient()
    return _client["aegis"]