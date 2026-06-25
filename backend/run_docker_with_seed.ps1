# PowerShell script to run Docker with interest seeding

Write-Host "🚀 Starting Docker containers with interest seeding..." -ForegroundColor Green
Write-Host "📋 This will:" -ForegroundColor Cyan
Write-Host "   1. Start PostgreSQL database" -ForegroundColor White
Write-Host "   2. Build and start Flask backend" -ForegroundColor White
Write-Host "   3. Run database migrations" -ForegroundColor White
Write-Host "   4. Seed interests into the database" -ForegroundColor White
Write-Host "   5. Start the Flask application" -ForegroundColor White
Write-Host ""

# Build and start containers
docker-compose up --build -d

Write-Host ""
Write-Host "✅ Docker containers started!" -ForegroundColor Green
Write-Host "🌐 Backend available at: http://localhost:5001" -ForegroundColor Cyan
Write-Host "📊 Check docker logs with: docker logs flask_backend" -ForegroundColor Yellow
Write-Host "🛑 Stop containers with: docker-compose down" -ForegroundColor Red