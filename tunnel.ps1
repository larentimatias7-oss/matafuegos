# Script para iniciar Cloudflare Tunnel para FireControl 365
Write-Host "Iniciando Cloudflare Tunnel para http://localhost:3000..." -ForegroundColor Cyan
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
