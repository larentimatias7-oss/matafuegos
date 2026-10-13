@echo off
REM ==============================================================================
REM Milicic S.A. - FireControl 365 | Acceso Directo de Encendido
REM Enciende el Servidor Node.js y el Túnel Cloudflare con 1 solo clic.
REM ==============================================================================
chcp 65001 >nul 2>&1
title Milicic FireControl 365 - Encendiendo Servidor y Túnel...

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server-control.ps1" iniciar

echo.
echo ==============================================================================
echo  Presione cualquier tecla para cerrar esta ventana de inicio...
echo ==============================================================================
pause >nul
