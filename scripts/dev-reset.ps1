# Reset Docker Compose environment and wipe persistent volumes
Write-Host "Resetting Charusat Needs Docker environment and removing volumes..." -ForegroundColor Red
docker compose down -v --remove-orphans
Write-Host "Environment clean." -ForegroundColor Green
