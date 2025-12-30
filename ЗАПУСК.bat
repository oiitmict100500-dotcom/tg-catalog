@echo off
chcp 65001 >nul
cls
echo ========================================
echo    TG Catalog - Запуск проекта
echo ========================================
echo.

cd /d "%~dp0"

REM Создание папки для логов
if not exist "logs" mkdir logs

REM Создание .env файлов
if not exist "backend\.env" (
    echo [1/4] Создание файлов настроек...
    (
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_USERNAME=postgres
        echo DB_PASSWORD=postgres
        echo DB_DATABASE=tg_catalog
        echo JWT_SECRET=secret
        echo JWT_EXPIRES_IN=7d
        echo PORT=3000
        echo NODE_ENV=development
        echo API_PREFIX=api
        echo TELEGRAM_BOT_TOKEN=your-telegram-bot-token
        echo TELEGRAM_API_URL=https://api.telegram.org/bot
        echo CHANNEL_CHANNELS_ID=@tgcatalog_channels
        echo CHANNEL_GROUPS_ID=@tgcatalog_groups
        echo CHANNEL_BOTS_ID=@tgcatalog_bots
        echo CHANNEL_STICKERS_ID=@tgcatalog_stickers
        echo CHANNEL_EMOJI_ID=@tgcatalog_emoji
        echo FRONTEND_URL=http://localhost:3001
        echo SITE_URL=http://localhost:3000
    ) > "backend\.env"
)

if not exist "telegram-bot\.env" (
    (
        echo BOT_TOKEN=your-telegram-bot-token
        echo API_URL=http://localhost:3000/api
        echo MODERATORS_CHAT_ID=
        echo DAILY_SUBMISSION_LIMIT=3
    ) > "telegram-bot\.env"
)

REM Установка зависимостей
echo [2/4] Проверка зависимостей...

if not exist "backend\node_modules" (
    echo Установка Backend...
    cd backend
    call npm install >..\logs\backend-install.log 2>&1
    cd ..
)

if not exist "telegram-bot\node_modules" (
    echo Установка Telegram Bot...
    cd telegram-bot
    call npm install >..\logs\bot-install.log 2>&1
    cd ..
)

if not exist "frontend\node_modules" (
    echo Установка Frontend...
    cd frontend
    call npm install >..\logs\frontend-install.log 2>&1
    cd ..
)

REM Создание простых логов
set BACKEND_LOG=%~dp0logs\backend.log
set BOT_LOG=%~dp0logs\bot.log
set FRONTEND_LOG=%~dp0logs\frontend.log

REM Создание файлов (закрываем сразу)
echo. > "%BACKEND_LOG%"
echo Запуск Backend: %date% %time% >> "%BACKEND_LOG%"
echo. >> "%BACKEND_LOG%"

echo. > "%BOT_LOG%"
echo Запуск Bot: %date% %time% >> "%BOT_LOG%"
echo. >> "%BOT_LOG%"

echo. > "%FRONTEND_LOG%"
echo Запуск Frontend: %date% %time% >> "%FRONTEND_LOG%"
echo. >> "%FRONTEND_LOG%"

REM Запуск компонентов (БЕЗ логирования в файл, чтобы избежать конфликтов)
echo [3/4] Запуск компонентов...
echo.

echo Запуск Backend (порт 3000)...
echo Логи будут в консоли, файл: logs\backend.log
start "TG Catalog - Backend" cmd /k "cd /d %~dp0backend && echo Backend starting on port 3000... && npm run start:dev"

timeout /t 8 /nobreak >nul

echo Запуск Telegram Bot...
echo Логи будут в консоли, файл: logs\bot.log
start "TG Catalog - Bot" cmd /k "cd /d %~dp0telegram-bot && echo Bot starting... && npm run start:dev"

timeout /t 3 /nobreak >nul

echo Запуск Frontend (порт 3001)...
echo Логи будут в консоли, файл: logs\frontend.log
start "TG Catalog - Frontend" cmd /k "cd /d %~dp0frontend && echo Frontend starting on port 3001... && npm run dev"

timeout /t 8 /nobreak >nul

echo [4/4] Проверка и открытие сайта...
echo.

REM Проверка портов
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [ОШИБКА] Backend не запущен на порту 3000!
    echo Проверьте окно "TG Catalog - Backend"
) else (
    echo [OK] Backend работает на порту 3000
)

netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo [ОШИБКА] Frontend не запущен на порту 3001!
    echo Проверьте окно "TG Catalog - Frontend"
) else (
    echo [OK] Frontend работает на порту 3001
)

echo.
echo ========================================
echo    Все запущено!
echo ========================================
echo.
echo САЙТ: http://localhost:3001
echo API:  http://localhost:3000/api/health
echo.
echo ЛОГИ (в консоли каждого окна):
echo   Backend:  окно "TG Catalog - Backend"
echo   Bot:      окно "TG Catalog - Bot"
echo   Frontend: окно "TG Catalog - Frontend"
echo.
echo Открываю сайт в браузере...
timeout /t 2 /nobreak >nul
start http://localhost:3001

echo.
echo ========================================
echo.
echo Важно:
echo   1. Установите токен бота в файлах .env
echo   2. Запустите PostgreSQL и создайте БД tg_catalog
echo   3. Если что-то не работает - проверьте окна PowerShell
echo   4. Запустите ПРОВЕРИТЬ_СТАТУС.bat для диагностики
echo.
pause
