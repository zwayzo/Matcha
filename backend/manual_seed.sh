#!/bin/bash

echo "🌱 Manual Interest Seeding Script"
echo "================================="
echo ""

# Check if we're in a Docker environment
if [ -f "/.dockerenv" ]; then
    echo "🐳 Running in Docker container"
    python seed_interests.py
else
    echo "💻 Running locally"
    echo "Make sure your local database is running and .env file is configured"
    echo ""
    read -p "Continue? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        python seed_interests.py
    else
        echo "Cancelled by user"
        exit 1
    fi
fi