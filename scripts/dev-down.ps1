# Stop local Docker Compose full-stack environment
Write-Host "Stopping Charusat Needs Docker services..." -ForegroundColor Yellow
docker compose down
Write-Host "All containers stopped." -ForegroundColor Green
