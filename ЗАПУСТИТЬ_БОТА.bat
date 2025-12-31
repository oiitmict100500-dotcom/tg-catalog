@echo off
chcp 65001 >nul
cls
echo ========================================
echo    TG Catalog - Запуск Telegram бота
echo ========================================
echo.

cd /d "%~dp0"

REM Переход в папку бота
if not exist "telegram-bot" (
    echo ОШИБКА: Папка telegram-bot не найдена!
    pause
    exit /b 1
)

cd telegram-bot

REM Проверка наличия .env файла
if not exist ".env" (
    echo [1/3] Создание файла настроек...
    (
        echo BOT_TOKEN=your-telegram-bot-token
        echo API_URL=http://localhost:3000/api
        echo MODERATORS_CHAT_ID=
        echo DAILY_SUBMISSION_LIMIT=3
    ) > .env
    echo.
    echo ⚠️  ВНИМАНИЕ: Файл .env создан с настройками по умолчанию!
    echo ⚠️  ВАЖНО: Откройте telegram-bot\.env и укажите ваш BOT_TOKEN!
    echo.
    pause
)

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo [2/3] Установка зависимостей...
    call npm install
    if errorlevel 1 (
        echo ОШИБКА установки зависимостей!
        pause
        exit /b 1
    )
    echo.
)

REM Запуск бота
echo [3/3] Запуск Telegram бота...
echo.
echo ========================================
echo    Бот запускается...
echo ========================================
echo.
echo Для остановки нажмите Ctrl+C
echo.

REM Проверяем, есть ли скрипт start:dev или start
if exist "package.json" (
    findstr /C:"start:dev" package.json >nul 2>&1
    if errorlevel 1 (
        npm start
    ) else (
        npm run start:dev
    )
) else (
    echo ОШИБКА: package.json не найден!
    pause
    exit /b 1
)

pause




