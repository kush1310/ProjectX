# Build Docker images with immutable Git SHA tags
$ErrorActionPreference = "Stop"

$gitSha = git rev-parse --short HEAD
if (-not $gitSha) { $gitSha = "release" }

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "BUILDING DOCKER IMAGES (TAG: charusatneeds-backend:$gitSha)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Backend Docker Build
Write-Host "`nBuilding Backend Docker image..." -ForegroundColor Yellow
docker build -t "charusatneeds-backend:$gitSha" -t "charusatneeds-backend:latest" -f Backend/Dockerfile Backend/

# Frontend Docker Build
Write-Host "`nBuilding Frontend Docker image..." -ForegroundColor Yellow
docker build -t "charusatneeds-frontend:$gitSha" -t "charusatneeds-frontend:latest" -f Frontend/Dockerfile Frontend/

Write-Host "`nDocker images built successfully with tag :$gitSha and :latest" -ForegroundColor Green
docker images | Select-String "charusatneeds"
