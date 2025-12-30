@echo off
chcp 65001 >nul
cls
echo ========================================
echo    Проверка статуса сервисов
echo ========================================
echo.

echo Проверяю порты...
echo.

netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [X] Backend (порт 3000) - НЕ РАБОТАЕТ
) else (
    echo [V] Backend (порт 3000) - работает
    netstat -ano | findstr ":3000"
)

echo.

netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo [X] Frontend (порт 3001) - НЕ РАБОТАЕТ
) else (
    echo [V] Frontend (порт 3001) - работает
    netstat -ano | findstr ":3001"
)

echo.
echo ========================================
echo.

if not exist "logs" (
    echo Папка logs не найдена
    goto end
)

echo Последние ошибки в логах:
echo.

if exist "logs\backend*.log" (
    echo --- BACKEND LOG ---
    powershell -Command "Get-ChildItem logs\backend*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 10"
    echo.
)

if exist "logs\frontend*.log" (
    echo --- FRONTEND LOG ---
    powershell -Command "Get-ChildItem logs\frontend*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 10"
    echo.
)

:end
echo.
pause

