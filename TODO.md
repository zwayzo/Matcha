# Fix Interest Table Seeding Error - Docker Flask Backend

## Status: 🚀 In Progress

### ✅ Completed Steps
- [ ]

### ⏳ Steps to Complete

**✅ Step 1 Complete**: `backend/entrypoint.sh` - creates tables before seeding
- Edit `backend/entrypoint.sh`: Add `python -c "from website import create_app, db; app=create_app(); with app.app_context(): db.create_all(); print('✅ Tables created before seeding!')"` before `python seed_interests.py`

**✅ Step 2 Complete**: `backend/seed_interests.py` - defensive `db.create_all()`
- Edit `backend/seed_interests.py`: Add `db.create_all()` inside `with app.app_context():` before `Interest.query.count()`

**✅ Step 3 Complete**: `backend/website/__init__.py` - `db.create_all()` uncommented
- Edit `backend/website/__init__.py`: Remove `#` from `db.create_all()` in `create_database()`

**Step 4: Test & Verify**
```
docker compose down -v
docker compose up --build
```
Expected logs:
```
✅ Tables created before seeding!
🌱 Seeding interests...
✅ Interests seeded successfully!
Database tables created!
```

**Step 5: [FINAL] Verify API**
```
curl http://localhost:5001/api/interests
```
Should return JSON array of interests

## Why This Fixes It
- **Root cause**: entrypoint.sh runs `seed_interests.py` BEFORE `flask run`
- `db.create_all()` was COMMENTED OUT and never reached due to crash
- **Solution**: Explicit table creation before any queries

---

**Current Working Directory**: /Users/zizo/Projects/Linder
**CWD**: backend/
