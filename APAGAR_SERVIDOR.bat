@echo off
REM ==============================================================================
REM Milicic S.A. - FireControl 365 | Acceso Directo de Apagado
REM Apaga el Servidor Node.js y el Túnel Cloudflare con 1 solo clic.
REM ==============================================================================
chcp 65001 >nul 2>&1
title Milicic FireControl 365 - Apagando Servidor y Túnel...

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server-control.ps1" apagar

echo.
echo ==============================================================================
echo  Presione cualquier tecla para cerrar esta ventana...
echo ==============================================================================
pause >nul
