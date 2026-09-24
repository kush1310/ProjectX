# Start local Docker Compose full-stack environment
Write-Host "Starting Charusat Needs local full-stack Docker services..." -ForegroundColor Cyan
docker compose up -d --build
Write-Host "Services status:" -ForegroundColor Cyan
docker compose ps
