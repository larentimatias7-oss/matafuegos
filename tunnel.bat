@echo off
echo Iniciando Cloudflare Tunnel para http://localhost:3000...
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3000
pause
