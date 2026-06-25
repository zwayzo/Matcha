#!/bin/sh
set -e

echo "🚀 Starting entrypoint script..."
echo "Current time: $(date)"

echo "⏳ Waiting for Postgres..."
while ! nc -z db 5432; do
  sleep 0.5
done
echo "✅ Postgres is ready!"

export FLASK_APP=main.py
export FLASK_DEBUG=1

echo "🔄 Running database migrations..."
flask db upgrade
echo "✅ Database migrations completed"

# Check if interests exist BEFORE seeding
echo "🔍 Checking interests before seeding..."
python -c "
from website import create_app, db
from website.models import Interest
app = create_app()
with app.app_context():
    count = Interest.query.count()
    print(f'📊 Current interests count: {count}')
"

echo "🌱 Running interests seed script..."
python seed_interests.py
echo "✅ Seed script completed"

# Check if interests exist AFTER seeding
echo "🔍 Checking interests after seeding..."
python -c "
from website import create_app, db
from website.models import Interest
app = create_app()
with app.app_context():
    count = Interest.query.count()
    print(f'📊 Final interests count: {count}')
    if count > 0:
        sample = Interest.query.first()
        print(f'📝 Sample interest: {sample.name} ({sample.category})')
    else:
        print('⚠️  No interests found!')
"

echo "🌐 Starting Flask application..."
exec flask run --host=0.0.0.0 --port=5000 --reload