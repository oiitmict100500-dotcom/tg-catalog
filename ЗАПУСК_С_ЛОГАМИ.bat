@echo off
chcp 65001 >nul
cls
echo ========================================
echo    TG Catalog - Запуск с логированием
echo ========================================
echo.

cd /d "%~dp0"

REM Создание папки для логов
if not exist "logs" mkdir logs

REM Очистка старых логов (оставляем только последние 5 файлов каждого типа)
echo Очистка старых логов (оставляем последние 5 файлов каждого типа)...
powershell -Command "Get-ChildItem -Path '%~dp0logs\backend_*.log' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item -Force -ErrorAction SilentlyContinue"
powershell -Command "Get-ChildItem -Path '%~dp0logs\bot_*.log' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item -Force -ErrorAction SilentlyContinue"
powershell -Command "Get-ChildItem -Path '%~dp0logs\frontend_*.log' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 5 | Remove-Item -Force -ErrorAction SilentlyContinue"

REM Создание .env файлов
if not exist "backend\.env" (
    echo [1/5] Создание файлов настроек...
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
echo [2/5] Проверка зависимостей...

if not exist "backend\node_modules" (
    echo Установка Backend...
    cd backend
    call npm install >..\logs\backend-install.log 2>&1
    if errorlevel 1 (
        echo ОШИБКА установки Backend! Смотрите logs\backend-install.log
    ) else (
        echo Backend установлен успешно
    )
    cd ..
)

if not exist "telegram-bot\node_modules" (
    echo Установка Telegram Bot...
    cd telegram-bot
    call npm install >..\logs\bot-install.log 2>&1
    if errorlevel 1 (
        echo ОШИБКА установки Bot! Смотрите logs\bot-install.log
    ) else (
        echo Bot установлен успешно
    )
    cd ..
)

if not exist "frontend\node_modules" (
    echo Установка Frontend...
    cd frontend
    call npm install >..\logs\frontend-install.log 2>&1
    if errorlevel 1 (
        echo ОШИБКА установки Frontend! Смотрите logs\frontend-install.log
    ) else (
        echo Frontend установлен успешно
    )
    cd ..
)

REM Создание логов с временной меткой
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set logtime=%datetime:~0,8%_%datetime:~8,6%

set BACKEND_LOG=%~dp0logs\backend_%logtime%.log
set BOT_LOG=%~dp0logs\bot_%logtime%.log
set FRONTEND_LOG=%~dp0logs\frontend_%logtime%.log

REM Запуск компонентов БЕЗ перенаправления в файл (логи будут видны в консоли)
echo [3/5] Запуск компонентов...
echo.

echo Запуск Backend (порт 3000)...
echo Логи будут в консоли и файле: logs\backend_%logtime%.log
start "TG Catalog - Backend" powershell -NoExit -Command "cd '%CD%\backend'; npm run start:dev *>&1 | Tee-Object -FilePath '%BACKEND_LOG%'"

timeout /t 8 /nobreak >nul

echo Запуск Telegram Bot...
echo Логи будут в консоли и файле: logs\bot_%logtime%.log
start "TG Catalog - Bot" powershell -NoExit -Command "cd '%CD%\telegram-bot'; npm run start:dev *>&1 | Tee-Object -FilePath '%BOT_LOG%'"

timeout /t 3 /nobreak >nul

echo Запуск Frontend (порт 3001)...
echo Логи будут в консоли и файле: logs\frontend_%logtime%.log
start "TG Catalog - Frontend" powershell -NoExit -Command "cd '%CD%\frontend'; npm run dev *>&1 | Tee-Object -FilePath '%FRONTEND_LOG%'"

timeout /t 8 /nobreak >nul

echo [4/5] Проверка и открытие сайта...
echo.

REM Проверка портов
netstat -ano | findstr ":3000" >nul
if errorlevel 1 (
    echo [ОШИБКА] Backend не запущен на порту 3000!
    echo Проверьте окно "TG Catalog - Backend" и логи: %BACKEND_LOG%
) else (
    echo [OK] Backend работает на порту 3000
)

netstat -ano | findstr ":3001" >nul
if errorlevel 1 (
    echo [ОШИБКА] Frontend не запущен на порту 3001!
    echo Проверьте окно "TG Catalog - Frontend" и логи: %FRONTEND_LOG%
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
echo ========================================
echo    ЛОГИ (все ошибки и предупреждения):
echo ========================================
echo   Backend:  %BACKEND_LOG%
echo   Bot:      %BOT_LOG%
echo   Frontend: %FRONTEND_LOG%
echo.
echo Логи также видны в окнах PowerShell
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
echo   3. Если что-то не работает - проверьте логи в logs\
echo   4. Запустите ПРОВЕРИТЬ_СТАТУС.bat для диагностики
echo.
pause
