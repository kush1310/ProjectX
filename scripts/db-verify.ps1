# Verify database inventory, logins, and order creation
Write-Host "Verifying database inventory and endpoints..." -ForegroundColor Cyan
node scratch/verify_seeded_database.js
