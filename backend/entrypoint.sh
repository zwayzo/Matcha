#!/bin/sh
set -e

echo "Waiting for Postgres..."
while ! nc -z db 5432; do
  sleep 0.5
done
echo "Postgres is ready!"

export FLASK_APP=main.py
export FLASK_DEBUG=1

# Create database tables before seeding
echo "🔨 Creating database tables..."
python -c "
from website import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
print('✅ Tables created before seeding!')
"

echo "🌱 Seeding database..."
python seed.py


# Seed interests into the database
echo "🌱 Running interests seed script..."
python seed_interests_fixed.py || echo "⚠️  Seeding skipped - continuing..."

exec flask run --host=0.0.0.0 --port=5001 --reload
