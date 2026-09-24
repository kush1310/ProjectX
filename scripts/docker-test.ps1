# Charusat Needs — Docker Services Health Verification
# Verifies container states, ports, and HTTP health probes

$ErrorActionPreference = "Continue"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — DOCKER CONTAINER HEALTH CHECK" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$services = @(
    @{ Name = "PostgreSQL"; Port = 5432; Host = "localhost"; Type = "TCP" },
    @{ Name = "Redis"; Port = 6379; Host = "localhost"; Type = "TCP" },
    @{ Name = "Backend Spring Boot"; Port = 8000; Host = "localhost"; Url = "http://localhost:8000/api/public/health"; Type = "HTTP" },
    @{ Name = "Frontend Nginx"; Port = 80; Host = "localhost"; Url = "http://localhost/"; Type = "HTTP" },
    @{ Name = "pgAdmin"; Port = 5050; Host = "localhost"; Url = "http://localhost:5050/"; Type = "HTTP" },
    @{ Name = "MinIO Console"; Port = 9001; Host = "localhost"; Url = "http://localhost:9001/"; Type = "HTTP" },
    @{ Name = "Mailpit Web UI"; Port = 8025; Host = "localhost"; Url = "http://localhost:8025/"; Type = "HTTP" }
)

Write-Host "Checking running docker containers..." -ForegroundColor Cyan
docker compose ps

foreach ($svc in $services) {
    Write-Host "Testing $($svc.Name)..." -NoNewline
    if ($svc.Type -eq "TCP") {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $connect = $tcp.BeginConnect($svc.Host, $svc.Port, $null, $null)
            $wait = $connect.AsyncWaitHandle.WaitOne(2000, $false)
            if ($wait -and $tcp.Connected) {
                $tcp.EndConnect($connect)
                $tcp.Close()
                Write-Host " [PASS] Port $($svc.Port) reachable" -ForegroundColor Green
            } else {
                $tcp.Close()
                Write-Host " [FAIL] Port $($svc.Port) not responding" -ForegroundColor Red
            }
        } catch {
            Write-Host " [FAIL] $_" -ForegroundColor Red
        }
    } elseif ($svc.Type -eq "HTTP") {
        try {
            $response = Invoke-WebRequest -Uri $svc.Url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                Write-Host " [PASS] HTTP $($response.StatusCode) on $($svc.Url)" -ForegroundColor Green
            } else {
                Write-Host " [WARN] HTTP $($response.StatusCode) on $($svc.Url)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host " [FAIL] Cannot connect to $($svc.Url)" -ForegroundColor Red
        }
    }
}
Write-Host "============================================================" -ForegroundColor Cyan
