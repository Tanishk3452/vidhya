import os
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "neurolearn"

_client = None
_db = None
mongodb_available = False

def init_mongo():
    global _client, _db, mongodb_available
    try:
        print(f"  ⏳ Connecting to MongoDB at {MONGO_URI}...")
        # Timeout of 1000ms ensures the app boots fast even if Mongo is dead
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1000)
        _client.server_info()  # Triggers connection
        _db = _client[DB_NAME]
        mongodb_available = True
        print("  ✅ MongoDB Connected Successfully!")
    except ServerSelectionTimeoutError:
        print("  ⚠️  MongoDB connection failed! Gracefully falling back to IN-MEMORY MOCK DATABASE.")
        mongodb_available = False
    except Exception as e:
        print(f"  ⚠️  MongoDB error: {e}")
        mongodb_available = False

def get_db():
    return _db

init_mongo()
