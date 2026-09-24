# Charusat Needs — Logical Database Export / Backup
# Creates a timestamped PostgreSQL SQL dump for disaster recovery

param (
    [string]$OutputDir = (Join-Path $PSScriptRoot "..\backups"),
    [string]$ContainerName = "charusat-postgres",
    [string]$DbName = "charusatneeds",
    [string]$DbUser = "postgres"
)

$ErrorActionPreference = "Stop"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — DATABASE LOGICAL EXPORT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$exportFile = Join-Path $OutputDir "charusatneeds_backup_$timestamp.sql"

Write-Host "Export destination: $exportFile" -ForegroundColor Yellow

# Attempt container-based pg_dump if container is running
$dockerRunning = $false
try {
    $containerStatus = docker inspect --format="{{.State.Running}}" $ContainerName 2>$null
    if ($containerStatus -eq "true") {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "Exporting from running Docker container [$ContainerName]..." -ForegroundColor Cyan
    docker exec $ContainerName pg_dump -U $DbUser --clean --if-exists $DbName > $exportFile
    if ($LASTEXITCODE -eq 0) {
        $fileSize = (Get-Item $exportFile).Length
        Write-Host "Export completed successfully. Size: $fileSize bytes." -ForegroundColor Green
    } else {
        Write-Host "pg_dump failed inside container." -ForegroundColor Red
        exit 1
    }
} else {
    # Check if local pg_dump command exists on PATH
    if (Get-Command pg_dump -ErrorAction SilentlyContinue) {
        Write-Host "Exporting via host pg_dump client..." -ForegroundColor Cyan
        & pg_dump -h localhost -p 5432 -U $DbUser --clean --if-exists $DbName -f $exportFile
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $exportFile).Length
            Write-Host "Export completed successfully. Size: $fileSize bytes." -ForegroundColor Green
        } else {
            Write-Host "pg_dump command failed." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Neither Docker container [$ContainerName] is running nor is pg_dump on host PATH." -ForegroundColor Yellow
        Write-Host "To export cloud Neon database, run:" -ForegroundColor Cyan
        Write-Host "pg_dump `"<NEON_DATABASE_URL>`" > $exportFile" -ForegroundColor White
    }
}
