@echo off
REM ==============================================================================
REM Milicic S.A. - FireControl 365 | Panel de Control de Servidor y Túnel
REM Doble clic para abrir el panel interactivo o ejecutar con argumentos:
REM   CONTROL_SERVIDOR.bat iniciar
REM   CONTROL_SERVIDOR.bat apagar
REM   CONTROL_SERVIDOR.bat reiniciar
REM   CONTROL_SERVIDOR.bat estado
REM ==============================================================================
chcp 65001 >nul 2>&1
title Milicic FireControl 365 - Control de Servidor

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server-control.ps1" %*
