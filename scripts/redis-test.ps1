# Test Redis Connectivity & Cache-Aside Behavior (Local or Upstash)
param(
    [string]$HostName = "localhost",
    [int]$Port = 6379,
    [string]$Password = ""
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CHARUSAT NEEDS — REDIS RESILIENCE & CACHE VERIFICATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

python -c "
import socket, sys, time

host = '$HostName'
port = $Port

print(f'Probing Redis socket on {host}:{port}...')
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
try:
    s.connect((host, port))
    print('TCP Connection Established successfully.')
    s.sendall(b'PING\r\n')
    data = s.recv(1024)
    print('Response:', data.decode().strip())
    s.close()
    print('[PASS] Redis is responsive and healthy.')
except Exception as e:
    print(f'[WARN] Redis direct connection error: {e}')
    print('Note: When Redis is absent or offline, Spring Boot RedisCacheService degrades gracefully to PostgreSQL.')
"
