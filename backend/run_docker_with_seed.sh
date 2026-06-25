#!/bin/bash

echo "🚀 Starting Docker containers with interest seeding..."
echo "📋 This will:"
echo "   1. Start PostgreSQL database"
echo "   2. Build and start Flask backend"
echo "   3. Run database migrations"
echo "   4. Seed interests into the database"
echo "   5. Start the Flask application"
echo ""

# Build and start containers
docker-compose up --build -d

echo ""
echo "✅ Docker containers started!"
echo "🌐 Backend available at: http://localhost:5001"
echo "📊 Check docker logs with: docker logs flask_backend"
echo "🛑 Stop containers with: docker-compose down"