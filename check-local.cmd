@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\local\Check-Local.ps1" %*
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" echo Local checks failed. See the message above.
if "%~1"=="" pause
exit /b %RESULT%
