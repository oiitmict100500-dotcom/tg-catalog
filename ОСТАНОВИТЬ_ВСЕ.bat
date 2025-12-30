@echo off
chcp 65001 >nul
cls
echo ========================================
echo    Остановка всех процессов TG Catalog
echo ========================================
echo.

echo Останавливаю все процессы Node.js и CMD связанные с проектом...
echo.

REM Остановка процессов через taskkill
taskkill /FI "WINDOWTITLE eq TG Catalog - Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TG Catalog - Bot*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq TG Catalog - Frontend*" /T /F >nul 2>&1

REM Остановка node процессов в папке проекта
for /f "tokens=2" %%i in ('netstat -ano ^| findstr ":3000 :3001" ^| findstr "LISTENING"') do (
    taskkill /PID %%i /F >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo [OK] Все процессы остановлены
echo.
echo Теперь вы можете запустить проект заново
echo.
pause

