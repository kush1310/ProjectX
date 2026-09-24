# Execute full-stack smoke test suite against running target
param(
    [string]$TargetUrl = "http://localhost:8000"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — SMOKE TEST SUITE ($TargetUrl)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

node scratch/verify_seeded_database.js
