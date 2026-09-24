# Seed database with the full canteen menu items (630 items across 7 canteens)
Write-Host "Seeding Charusat Needs database..." -ForegroundColor Cyan
python scratch/seed_with_psycopg2.py
Write-Host "Seeding complete." -ForegroundColor Green
