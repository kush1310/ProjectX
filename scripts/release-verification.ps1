# Charusat Needs — Release Readiness Verification Pipeline
# Runs preflight, builds, tests, and validates all deployment gates

$ErrorActionPreference = "Stop"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — RELEASE CANDIDATE VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $root

try {
    # 1. Deployment Preflight Check
    Write-Host "`n>>> [STEP 1/4] Running Deployment Preflight Checks..." -ForegroundColor Cyan
    & "$PSScriptRoot\deployment-check.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Preflight checks failed." }

    # 2. Production Artifact Builds
    Write-Host "`n>>> [STEP 2/4] Building Release Artifacts (Frontend + Backend)..." -ForegroundColor Cyan
    & "$PSScriptRoot\build-release.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Release build failed." }

    # 3. Docker Image Build Validation
    Write-Host "`n>>> [STEP 3/4] Validating Docker Production Images..." -ForegroundColor Cyan
    & "$PSScriptRoot\docker-build.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Docker image build failed." }

    # 4. Security & Business Logic Verification
    Write-Host "`n>>> [STEP 4/4] Validating Application Security Controls..." -ForegroundColor Cyan
    & "$PSScriptRoot\security-regression.ps1"

    Write-Host "`n============================================================" -ForegroundColor Green
    Write-Host "ALL RELEASE GATES PASSED — DEPLOYMENT READY" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} catch {
    Write-Host "`n[FATAL] Release verification aborted: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
