@echo off
chcp 65001 >nul
echo ========================================
echo   Загрузка проекта на GitHub
echo ========================================
echo.

REM Проверка, что мы в правильной папке
if not exist "backend" (
    echo ❌ Ошибка: Запустите этот файл из корневой папки проекта!
    pause
    exit /b 1
)

echo 📋 Шаг 1: Проверка git статуса...
git status --short
echo.

echo 📋 Шаг 2: Проверка коммитов...
git log --oneline -1
echo.

echo ========================================
echo   Инструкция:
echo ========================================
echo.
echo 1. Откройте https://github.com в браузере
echo 2. Войдите в свой аккаунт
echo 3. Нажмите "+" в правом верхнем углу
echo 4. Выберите "New repository"
echo 5. Заполните:
echo    - Repository name: tg-catalog (или другое имя)
echo    - Description: Каталог Telegram-ресурсов
echo    - Visibility: Public или Private
echo    - ❌ НЕ ставьте галочки на README, .gitignore, license
echo 6. Нажмите "Create repository"
echo.
echo ========================================
echo.

set /p GITHUB_USERNAME="Введите ваш GitHub username: "
set /p REPO_NAME="Введите имя репозитория (например: tg-catalog): "

if "%GITHUB_USERNAME%"=="" (
    echo ❌ Username не может быть пустым!
    pause
    exit /b 1
)

if "%REPO_NAME%"=="" (
    echo ❌ Имя репозитория не может быть пустым!
    pause
    exit /b 1
)

echo.
echo 📤 Настройка remote репозитория...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/%REPO_NAME%.git

if errorlevel 1 (
    echo ❌ Ошибка при добавлении remote репозитория
    pause
    exit /b 1
)

echo ✅ Remote репозиторий настроен
echo.

echo 📤 Переименование ветки в main...
git branch -M main

echo 📤 Загрузка кода на GitHub...
echo.
echo ⚠️  ВНИМАНИЕ: Вам нужно будет ввести:
echo    - GitHub username (если запросит)
echo    - Personal Access Token (вместо пароля)
echo.
echo 💡 Как получить Personal Access Token:
echo    1. GitHub → Settings → Developer settings
echo    2. Personal access tokens → Tokens (classic)
echo    3. Generate new token (classic)
echo    4. Выберите scope: repo
echo    5. Скопируйте токен
echo.
pause

git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ Ошибка при загрузке на GitHub
    echo.
    echo 💡 Возможные решения:
    echo    1. Проверьте, что репозиторий создан на GitHub
    echo    2. Используйте Personal Access Token вместо пароля
    echo    3. Проверьте правильность username и имени репозитория
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Успешно загружено на GitHub!
echo ========================================
echo.
echo 🌐 Репозиторий доступен по адресу:
echo    https://github.com/%GITHUB_USERNAME%/%REPO_NAME%
echo.
pause

