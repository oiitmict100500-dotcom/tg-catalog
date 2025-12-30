@echo off
chcp 65001 >nul
cls
echo ========================================
echo    Проверка Telegram бота
echo ========================================
echo.

cd /d "%~dp0"

echo Проверяю файл настроек...
if not exist "telegram-bot\.env" (
    echo [X] Файл telegram-bot\.env не найден!
    echo.
    echo Создайте файл с содержимым:
    echo BOT_TOKEN=ваш_токен_здесь
    echo API_URL=http://localhost:3000/api
    pause
    exit /b 1
)

echo [V] Файл .env найден
echo.

echo Содержимое telegram-bot\.env:
echo ----------------------------------------
type "telegram-bot\.env"
echo ----------------------------------------
echo.

echo Проверяю токен...
findstr /C:"BOT_TOKEN=" "telegram-bot\.env" | findstr /V /C:"your-telegram-bot-token" >nul
if errorlevel 1 (
    echo [X] Токен не установлен или использует значение по умолчанию!
    echo.
    echo Откройте telegram-bot\.env и установите правильный токен бота.
    echo Получить токен: @BotFather в Telegram
    pause
    exit /b 1
) else (
    echo [V] Токен установлен
)

echo.
echo Проверяю логи бота...
if exist "logs\bot*.log" (
    echo Последние строки лога:
    echo ----------------------------------------
    powershell -Command "Get-ChildItem logs\bot*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 20"
    echo ----------------------------------------
) else (
    echo [X] Логи бота не найдены
)

echo.
echo Проверяю процессы...
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [X] Backend не запущен на порту 3000
    echo Бот не сможет работать без Backend!
) else (
    echo [V] Backend запущен
)

echo.
echo ========================================
echo.
echo Если бот не работает:
echo 1. Проверьте окно "TG Catalog - Bot"
echo 2. Посмотрите логи в logs\bot*.log
echo 3. Убедитесь, что токен правильный
echo.
pause

