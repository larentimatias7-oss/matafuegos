# c:\antigravity\matafuegos\certs\setup-https.ps1
# Script de configuracion HTTPS local para pruebas en celulares (Milicic S.A.)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Milicic S.A. - Configurador de HTTPS Local para Celulares" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Detectar IP LAN
$lanIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.InterfaceAlias -notmatch 'vEthernet|Loopback|WSL|Virtual' -and 
    $_.IPAddress -notlike '169.254.*' -and 
    $_.IPAddress -notlike '127.*'
} | Select-Object -First 1).IPAddress

if (-not $lanIp) {
    $lanIp = "127.0.0.1"
}

$computerName = $env:COMPUTERNAME
$certsDir = $PSScriptRoot

Write-Host "`n[+] IP LAN detectada: " -NoNewline
Write-Host "$lanIp" -ForegroundColor Green
Write-Host "[+] Nombre de equipo: " -NoNewline
Write-Host "$computerName" -ForegroundColor Green
Write-Host "[+] Directorio certs: $certsDir"

# 2. Verificar si mkcert esta instalado
$mkcertCmd = Get-Command mkcert -ErrorAction SilentlyContinue

if (-not $mkcertCmd) {
    Write-Host "`n[!] ALERTA: 'mkcert' no esta instalado en este equipo." -ForegroundColor Yellow
    Write-Host "Para generar certificados SSL locales confiables sin advertencias en el navegador del celular,"
    Write-Host "instala mkcert ejecutando UNO de estos comandos en una terminal con permisos:" -ForegroundColor White
    Write-Host "`n    winget install FiloSottile.mkcert" -ForegroundColor Cyan
    Write-Host "    o bien:" -ForegroundColor White
    Write-Host "    choco install mkcert`n" -ForegroundColor Cyan
    Write-Host "Luego cerra y volve a abrir la terminal y corre nuevamente este script."
    exit 1
}

# 3. Asegurar CA local
Write-Host "`n[+] Verificando/instalando Autoridad Certificadora Local (CA)..." -ForegroundColor White
& mkcert -install

$caRoot = (& mkcert -CAROOT).Trim()
Write-Host "[OK] Directorio de CA Root de mkcert:" -ForegroundColor Green
Write-Host "     $caRoot" -ForegroundColor Cyan
Write-Host "     (El archivo 'rootCA.pem' de esa carpeta es el que se instala en el celular)" -ForegroundColor Gray

# 4. Generar certificados en ./certs
Set-Location $certsDir
$certFile = Join-Path $certsDir "dev-cert.pem"
$keyFile  = Join-Path $certsDir "dev-key.pem"

Write-Host "`n[+] Generando certificado para localhost, 127.0.0.1, $computerName, $lanIp..." -ForegroundColor White
& mkcert -cert-file "$certFile" -key-file "$keyFile" "localhost" "127.0.0.1" "$computerName" "$lanIp"

if (Test-Path $certFile) {
    Write-Host "[OK] Certificados generados exitosamente en ./certs/:" -ForegroundColor Green
    Write-Host "     - dev-cert.pem"
    Write-Host "     - dev-key.pem"
} else {
    Write-Host "[!] Error generando certificados." -ForegroundColor Red
    exit 1
}

# 5. Informacion de Firewall
Write-Host "`n----------------------------------------------------------" -ForegroundColor Yellow
Write-Host " FIREWALL DE WINDOWS (Acceso desde el celular en la LAN):" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
Write-Host "Si el celular no puede conectar, abre una consola de PowerShell como Administrador y corre:" -ForegroundColor White
Write-Host "New-NetFirewallRule -DisplayName `"Milicic Matafuegos Dev`" -Direction Inbound -LocalPort 5173,3000 -Protocol TCP -Action Allow" -ForegroundColor Cyan

# 6. URLs de acceso
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " LISTO! Podes iniciar el servidor con HTTPS:" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "1. En desarrollo (Vite):" -ForegroundColor White
Write-Host "   npm run dev:https" -ForegroundColor Cyan
Write-Host "   -> URL en celular: https://${lanIp}:5173" -ForegroundColor Yellow
Write-Host "`n2. En produccion local (Node + Express compilado):" -ForegroundColor White
Write-Host "   `$env:HTTPS=`"true`"; `$env:SSL_CERT_FILE=`"./certs/dev-cert.pem`"; `$env:SSL_KEY_FILE=`"./certs/dev-key.pem`"; node server/index.js" -ForegroundColor Cyan
Write-Host "   -> URL en celular: https://${lanIp}:3000" -ForegroundColor Yellow
Write-Host "`nNota: Recorda que celular y PC deben estar conectados a la misma red Wi-Fi." -ForegroundColor Gray
