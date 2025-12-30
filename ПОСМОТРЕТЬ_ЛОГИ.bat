@echo off
chcp 65001 >nul
cls
echo ========================================
echo    Просмотр логов
echo ========================================
echo.

cd /d "%~dp0"

if not exist "logs" (
    echo Папка logs не найдена!
    echo Логи появятся после первого запуска проекта.
    pause
    exit /b
)

echo Последние логи:
echo.

if exist "logs\backend*.log" (
    echo [BACKEND LOG]
    echo ========================================
    powershell -Command "Get-ChildItem logs\backend*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50"
    echo.
    echo ========================================
    echo.
)

if exist "logs\bot*.log" (
    echo [BOT LOG]
    echo ========================================
    powershell -Command "Get-ChildItem logs\bot*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50"
    echo.
    echo ========================================
    echo.
)

if exist "logs\frontend*.log" (
    echo [FRONTEND LOG]
    echo ========================================
    powershell -Command "Get-ChildItem logs\frontend*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50"
    echo.
    echo ========================================
    echo.
)

echo.
echo Чтобы открыть папку с логами, нажмите Enter...
pause >nul

explorer logs

