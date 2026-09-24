# Build production artifacts for Charusat Needs (Frontend Vite bundle + Backend JAR)
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "BUILDING PRODUCTION RELEASE ARTIFACTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Frontend
Write-Host "`n[1/2] Building Frontend SPA with Vite..." -ForegroundColor Yellow
Push-Location "Frontend"
npm run build
Pop-Location

# 2. Backend
Write-Host "`n[2/2] Packaging Backend Spring Boot JAR..." -ForegroundColor Yellow
Push-Location "Backend"
mvn clean package -DskipTests
Pop-Location

$gitSha = git rev-parse --short HEAD
Write-Host "`nRelease build complete! Git SHA: $gitSha" -ForegroundColor Green
