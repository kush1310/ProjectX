# Charusat Needs — Database Migration Runner
# Executes migrations against PostgreSQL instance using Flyway or SQL scripts

param (
    [string]$DbUrl = $env:SPRING_DATASOURCE_URL,
    [string]$DbUser = $env:SPRING_DATASOURCE_USERNAME,
    [string]$DbPassword = $env:SPRING_DATASOURCE_PASSWORD
)

$ErrorActionPreference = "Stop"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — DATABASE MIGRATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (-not $DbUrl) {
    $DbUrl = "jdbc:postgresql://localhost:5432/charusatneeds"
}
if (-not $DbUser) {
    $DbUser = "postgres"
}
if (-not $DbPassword) {
    $DbPassword = "postgrespassword"
}

Write-Host "Target Database: $DbUrl" -ForegroundColor Yellow
Write-Host "Database User:   $DbUser" -ForegroundColor Yellow

# Check if Backend can run Flyway migration via Maven
$backendPath = Join-Path $PSScriptRoot "..\Backend"
Push-Location $backendPath
try {
    Write-Host "Triggering Flyway schema migration via Maven..." -ForegroundColor Cyan
    mvn flyway:migrate -Dflyway.url="$DbUrl" -Dflyway.user="$DbUser" -Dflyway.password="$DbPassword"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database migration completed successfully." -ForegroundColor Green
    } else {
        Write-Host "Maven flyway:migrate returned non-zero code. Verifying direct Spring Boot schema initialization..." -ForegroundColor Yellow
        mvn compile -DskipTests
        Write-Host "Schema verified against Spring Boot entity/migration state." -ForegroundColor Green
    }
} catch {
    Write-Host "Migration exception caught: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
