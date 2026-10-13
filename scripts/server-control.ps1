# ==============================================================================
# Milicic S.A. - FireControl 365 | Control Integral de Servidor y Túnel
# Permite encender, apagar, reiniciar y consultar estado del servidor Express
# y del túnel seguro de Cloudflare para acceso remoto y pruebas de campo.
# ==============================================================================

param(
    [string]$Action = "menu"
)

# Forzar codificación UTF-8 en consola
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $RepoRoot "logs"
$ServerLog = Join-Path $LogDir "server.log"
$ServerErrLog = Join-Path $LogDir "server_error.log"
$TunnelLog = Join-Path $LogDir "cloudflared.log"
$TunnelOutLog = Join-Path $LogDir "cloudflared_out.log"
$TunnelUrlFile = Join-Path $LogDir "tunnel-url.txt"

# Crear carpeta de logs si no existe
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

function Find-CloudflaredExe {
    $candidates = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe",
        (Join-Path $env:LOCALAPPDATA "cloudflared\cloudflared.exe")
    )
    foreach ($cand in $candidates) {
        if (Test-Path $cand) { return $cand }
    }
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    return $null
}

function Get-ServerStatus {
    $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
        $healthy = $false
        try {
            $res = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($res -and $res.status -eq "healthy") { $healthy = $true }
        } catch {
            # El puerto está abierto aunque el endpoint demore
        }
        return [PSCustomObject]@{
            IsRunning = $true
            Pid       = $conn.OwningProcess
            Port      = 3000
            Healthy   = $healthy
        }
    }
    return [PSCustomObject]@{
        IsRunning = $false
        Pid       = $null
        Port      = 3000
        Healthy   = $false
    }
}

function Get-TunnelStatus {
    $proc = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Select-Object -First 1
    $url = $null

    if (Test-Path $TunnelUrlFile) {
        $candidateUrl = (Get-Content $TunnelUrlFile -Raw -ErrorAction SilentlyContinue).Trim()
        if ($candidateUrl -match "^https://[a-zA-Z0-9-]+\.trycloudflare\.com") {
            $url = $candidateUrl
        }
    }

    if (-not $url -and (Test-Path $TunnelLog)) {
        $content = Get-Content $TunnelLog -Tail 100 -ErrorAction SilentlyContinue | Out-String
        if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $url = $matches[1]
            Set-Content -Path $TunnelUrlFile -Value $url -Force -ErrorAction SilentlyContinue
        }
    }

    # Si aún no tenemos URL y hay logs previos en el sistema, revisar
    if (-not $url) {
        $taskLogs = Get-ChildItem -Path "$env:USERPROFILE\.gemini\antigravity-ide\brain" -Filter "task-*.log" -Recurse -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 5
        foreach ($tLog in $taskLogs) {
            $c = Get-Content $tLog.FullName -Tail 50 -ErrorAction SilentlyContinue | Out-String
            if ($c -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                $url = $matches[1]
                Set-Content -Path $TunnelUrlFile -Value $url -Force -ErrorAction SilentlyContinue
                break
            }
        }
    }

    if ($proc) {
        return [PSCustomObject]@{
            IsRunning = $true
            Pid       = $proc.Id
            Url       = $url
        }
    }
    return [PSCustomObject]@{
        IsRunning = $false
        Pid       = $null
        Url       = $url
    }
}

function Show-Header {
    Clear-Host
    Write-Host "================================================================================" -ForegroundColor DarkGray
    Write-Host "   MILICIC S.A. | SISTEMA DE CONTROL DE EXTINTORES (IRAM 3517-2)" -ForegroundColor Cyan
    Write-Host "                 FireControl 365 - Control de Servidor" -ForegroundColor Yellow
    Write-Host "================================================================================" -ForegroundColor DarkGray
}

function Show-StatusBlock {
    $server = Get-ServerStatus
    $tunnel = Get-TunnelStatus

    Write-Host "`n [ESTADO ACTUAL DEL SISTEMA]" -ForegroundColor White

    # Servidor Node
    Write-Host "  * Servidor Express Node.js : " -NoNewline
    if ($server.IsRunning) {
        Write-Host "[ ACTIVO ]" -ForegroundColor Green -NoNewline
        Write-Host " (PID: $($server.Pid), Puerto: $($server.Port))" -ForegroundColor Gray
    } else {
        Write-Host "[ DETENIDO ]" -ForegroundColor Red
    }

    # Tunel Cloudflare
    Write-Host "  * Tunel Cloudflare         : " -NoNewline
    if ($tunnel.IsRunning) {
        Write-Host "[ ACTIVO ]" -ForegroundColor Green -NoNewline
        Write-Host " (PID: $($tunnel.Pid))" -ForegroundColor Gray
    } else {
        Write-Host "[ DETENIDO ]" -ForegroundColor Red
    }

    # URLs
    Write-Host "`n [ENLACES DE ACCESO]" -ForegroundColor White
    if ($server.IsRunning) {
        Write-Host "  -> Enlace Local (Intranet / PC) : " -NoNewline
        Write-Host "http://localhost:3000" -ForegroundColor Cyan
    } else {
        Write-Host "  -> Enlace Local (Intranet / PC) : Servidor apagado" -ForegroundColor DarkGray
    }

    if ($tunnel.IsRunning -and $tunnel.Url) {
        Write-Host "  -> Enlace Cloudflare (Celular)  : " -NoNewline
        Write-Host "$($tunnel.Url)" -ForegroundColor Green
    } elseif ($tunnel.IsRunning) {
        Write-Host "  -> Enlace Cloudflare (Celular)  : " -NoNewline
        Write-Host "Conectando... (obteniendo URL publica)" -ForegroundColor Yellow
    } else {
        Write-Host "  -> Enlace Cloudflare (Celular)  : Tunel apagado" -ForegroundColor DarkGray
    }
    Write-Host ""
}

function Start-Services {
    Write-Host "`n[*] Iniciando servicios de FireControl 365..." -ForegroundColor Cyan

    # 1. Iniciar Servidor Node si no está corriendo
    $server = Get-ServerStatus
    if ($server.IsRunning) {
        Write-Host " [i] El servidor Node.js ya se encuentra activo en el puerto 3000 (PID: $($server.Pid))." -ForegroundColor Yellow
    } else {
        Write-Host " [+] Encendiendo servidor Express en http://localhost:3000..." -ForegroundColor White
        
        $nodeProc = Start-Process -FilePath "node" `
            -ArgumentList "server/index.js" `
            -WorkingDirectory $RepoRoot `
            -WindowStyle Hidden `
            -RedirectStandardOutput $ServerLog `
            -RedirectStandardError $ServerErrLog `
            -PassThru

        # Esperar hasta 15 segundos a que responda el healthcheck
        $started = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Milliseconds 500
            try {
                $res = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 1 -ErrorAction SilentlyContinue
                if ($res -and $res.status -eq "healthy") {
                    $started = $true
                    break
                }
            } catch {}
        }

        if ($started) {
            Write-Host " [OK] Servidor iniciado correctamente en puerto 3000." -ForegroundColor Green
        } else {
            Write-Host " [!] El servidor tardó en responder. Verifique logs en $ServerErrLog" -ForegroundColor Yellow
        }
    }

    # 2. Iniciar Túnel Cloudflare si no está corriendo
    $tunnel = Get-TunnelStatus
    if ($tunnel.IsRunning) {
        Write-Host " [i] El túnel Cloudflare ya está activo (PID: $($tunnel.Pid))." -ForegroundColor Yellow
        if ($tunnel.Url) {
            Write-Host "     URL: $($tunnel.Url)" -ForegroundColor Green
        }
    } else {
        $cfExe = Find-CloudflaredExe
        if (-not $cfExe) {
            Write-Host " [X] No se encontró el ejecutable de Cloudflare (cloudflared.exe)." -ForegroundColor Red
            Write-Host "     Instálelo o colóquelo en 'C:\Program Files (x86)\cloudflared\cloudflared.exe'" -ForegroundColor DarkGray
            return
        }

        Write-Host " [+] Iniciando túnel Cloudflare para exponer puerto 3000..." -ForegroundColor White
        
        # Limpiar log anterior para capturar nueva URL limpia
        if (Test-Path $TunnelLog) { Remove-Item $TunnelLog -Force -ErrorAction SilentlyContinue }
        if (Test-Path $TunnelUrlFile) { Remove-Item $TunnelUrlFile -Force -ErrorAction SilentlyContinue }

        $cfProc = Start-Process -FilePath $cfExe `
            -ArgumentList "tunnel --url http://localhost:3000" `
            -WorkingDirectory $RepoRoot `
            -WindowStyle Hidden `
            -RedirectStandardError $TunnelLog `
            -RedirectStandardOutput $TunnelOutLog `
            -PassThru

        Write-Host "     Negociando túnel público..." -NoNewline

        # Esperar hasta 20 segundos a que aparezca la URL en el log
        $foundUrl = $null
        for ($i = 0; $i -lt 40; $i++) {
            Start-Sleep -Milliseconds 500
            Write-Host "." -NoNewline -ForegroundColor DarkGray
            if (Test-Path $TunnelLog) {
                $c = Get-Content $TunnelLog -ErrorAction SilentlyContinue | Out-String
                if ($c -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                    $foundUrl = $matches[1]
                    Set-Content -Path $TunnelUrlFile -Value $foundUrl -Force -ErrorAction SilentlyContinue
                    break
                }
            }
        }
        Write-Host ""

        if ($foundUrl) {
            Write-Host " [OK] Túnel Cloudflare establecido con éxito!" -ForegroundColor Green
            Write-Host "`n================================================================================" -ForegroundColor DarkGray
            Write-Host " 🌐 ENLACE PÚBLICO CLOUDFLARE PARA COMPARTIR / ACCEDER EN CELULAR:" -ForegroundColor Cyan
            Write-Host "    $foundUrl" -ForegroundColor Green
            Write-Host "================================================================================" -ForegroundColor DarkGray
            
            # Copiar URL al portapapeles de Windows
            try {
                Set-Clipboard -Value $foundUrl -ErrorAction SilentlyContinue
                Write-Host " (Enlace copiado automáticamente al portapapeles de Windows)" -ForegroundColor DarkGray
            } catch {}
        } else {
            Write-Host " [!] El túnel inició pero aún no reportó la URL. Verifique $TunnelLog" -ForegroundColor Yellow
        }
    }
}

function Stop-Services {
    Write-Host "`n[*] Apagando servicios de FireControl 365..." -ForegroundColor Yellow

    # 1. Detener Túnel Cloudflare
    $cfProcs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    if ($cfProcs) {
        Write-Host " [-] Deteniendo Túnel Cloudflare ($($cfProcs.Count) proceso/s)..." -ForegroundColor White
        $cfProcs | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host " [OK] Túnel Cloudflare apagado." -ForegroundColor Green
    } else {
        Write-Host " [i] El túnel Cloudflare no estaba en ejecución." -ForegroundColor DarkGray
    }
    if (Test-Path $TunnelUrlFile) { Remove-Item $TunnelUrlFile -Force -ErrorAction SilentlyContinue }

    # 2. Detener Servidor Node (liberar puerto 3000)
    $conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    $pidsToKill = @()
    if ($conns) {
        foreach ($c in $conns) {
            if ($c.OwningProcess -and -not ($pidsToKill -contains $c.OwningProcess)) {
                $pidsToKill += $c.OwningProcess
            }
        }
    }

    # También buscar procesos node que ejecuten server/index.js
    try {
        $nodeProcs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
            Where-Object { $_.CommandLine -like "*server/index.js*" }
        foreach ($np in $nodeProcs) {
            if (-not ($pidsToKill -contains $np.ProcessId)) {
                $pidsToKill += $np.ProcessId
            }
        }
    } catch {}

    if ($pidsToKill.Count -gt 0) {
        Write-Host " [-] Deteniendo servidor Node.js en puerto 3000 (PID: $($pidsToKill -join ', '))..." -ForegroundColor White
        foreach ($p in $pidsToKill) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Milliseconds 800
        Write-Host " [OK] Servidor Node.js apagado correctamente." -ForegroundColor Green
    } else {
        Write-Host " [i] El servidor Node.js en el puerto 3000 no estaba en ejecución." -ForegroundColor DarkGray
    }

    Write-Host "`n [OK] Sistema FireControl 365 completamente apagado." -ForegroundColor Green
}

function Restart-Services {
    Write-Host "`n[*] Reiniciando sistema completo..." -ForegroundColor Cyan
    Stop-Services
    Start-Sleep -Seconds 1
    Start-Services
}

function Open-BrowserApp {
    $tunnel = Get-TunnelStatus
    $server = Get-ServerStatus

    if ($tunnel.IsRunning -and $tunnel.Url) {
        Write-Host "`n[*] Abriendo enlace Cloudflare en el navegador predeterminado..." -ForegroundColor Cyan
        Start-Process $tunnel.Url
    } elseif ($server.IsRunning) {
        Write-Host "`n[*] Abriendo enlace local en el navegador predeterminado..." -ForegroundColor Cyan
        Start-Process "http://localhost:3000"
    } else {
        Write-Host "`n[!] El servidor está apagado. Inícielo primero antes de abrir el navegador." -ForegroundColor Yellow
    }
}

function Show-LogsSummary {
    Write-Host "`n--- REGISTROS RECIENTES DEL SERVIDOR (server_error.log / server.log) ---" -ForegroundColor DarkCyan
    if (Test-Path $ServerErrLog) {
        Get-Content $ServerErrLog -Tail 15 -ErrorAction SilentlyContinue
    } elseif (Test-Path $ServerLog) {
        Get-Content $ServerLog -Tail 15 -ErrorAction SilentlyContinue
    } else {
        Write-Host "Sin registros recientes de servidor." -ForegroundColor DarkGray
    }

    Write-Host "`n--- REGISTROS RECIENTES DE CLOUDFLARE (cloudflared.log) ---" -ForegroundColor DarkCyan
    if (Test-Path $TunnelLog) {
        Get-Content $TunnelLog -Tail 15 -ErrorAction SilentlyContinue
    } else {
        Write-Host "Sin registros recientes de Cloudflare." -ForegroundColor DarkGray
    }
}

# --- CONTROL DE FLUJO PRINCIPAL ---

switch ($Action.ToLower()) {
    { $_ -in "start", "iniciar", "prender", "on" } {
        Show-Header
        Start-Services
        Show-StatusBlock
        exit 0
    }
    { $_ -in "stop", "detener", "apagar", "off" } {
        Show-Header
        Stop-Services
        Show-StatusBlock
        exit 0
    }
    { $_ -in "restart", "reiniciar" } {
        Show-Header
        Restart-Services
        Show-StatusBlock
        exit 0
    }
    { $_ -in "status", "estado" } {
        Show-Header
        Show-StatusBlock
        exit 0
    }
    { $_ -in "open", "abrir" } {
        Open-BrowserApp
        exit 0
    }
    { $_ -in "logs" } {
        Show-Header
        Show-LogsSummary
        exit 0
    }
    default {
        # Menú interactivo en bucle
        while ($true) {
            Show-Header
            Show-StatusBlock

            Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray
            Write-Host " ACCIONES DISPONIBLES:" -ForegroundColor White
            Write-Host "   [1] " -NoNewline -ForegroundColor Yellow
            Write-Host "Encender Sistema Completo (Servidor + Túnel Cloudflare)" -ForegroundColor White
            Write-Host "   [2] " -NoNewline -ForegroundColor Yellow
            Write-Host "Apagar Sistema Completo (Detener todo)" -ForegroundColor White
            Write-Host "   [3] " -NoNewline -ForegroundColor Yellow
            Write-Host "Reiniciar Sistema Completo" -ForegroundColor White
            Write-Host "   [4] " -NoNewline -ForegroundColor Yellow
            Write-Host "Actualizar Estado y Enlaces" -ForegroundColor White
            Write-Host "   [5] " -NoNewline -ForegroundColor Yellow
            Write-Host "Abrir en el Navegador Web" -ForegroundColor White
            Write-Host "   [6] " -NoNewline -ForegroundColor Yellow
            Write-Host "Ver Registros / Diagnóstico (Logs)" -ForegroundColor White
            Write-Host "   [0] " -NoNewline -ForegroundColor Yellow
            Write-Host "Salir" -ForegroundColor Gray
            Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkGray

            $choice = Read-Host " Seleccione una opción [0-6]"
            switch ($choice.Trim()) {
                "1" { Start-Services; Write-Host "`nPresione ENTER para continuar..."; [void][System.Console]::ReadLine() }
                "2" { Stop-Services;  Write-Host "`nPresione ENTER para continuar..."; [void][System.Console]::ReadLine() }
                "3" { Restart-Services; Write-Host "`nPresione ENTER para continuar..."; [void][System.Console]::ReadLine() }
                "4" { # Sólo refresca en la siguiente iteración
                }
                "5" { Open-BrowserApp; Start-Sleep -Seconds 1 }
                "6" { Show-LogsSummary; Write-Host "`nPresione ENTER para continuar..."; [void][System.Console]::ReadLine() }
                "0" { Write-Host "`nHasta luego.`n" -ForegroundColor Cyan; exit 0 }
                default { Write-Host "`nOpción no válida." -ForegroundColor Red; Start-Sleep -Milliseconds 700 }
            }
        }
    }
}
