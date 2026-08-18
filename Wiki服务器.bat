@echo off
rem Godifact Wiki server console entry (ASCII only for maximum compatibility)
where pwsh >nul 2>nul
if errorlevel 1 goto use_ps5
pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0WikiServer.ps1" %*
goto done
:use_ps5
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0WikiServer.ps1" %*
:done
if errorlevel 1 (
  echo.
  echo [ERROR] The server script failed. Please copy the messages above and report them.
  echo.
  pause
)
