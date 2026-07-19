@echo off
setlocal EnableExtensions

rem start.bat - Levanta todo el stack de DePaso en Windows
rem Uso: start.bat
rem Abre la DB en Docker, seedea, y lanza backend + app + web en ventanas separadas.

set "ROOT_DIR=%~dp0"
set "ROOT_DIR=%ROOT_DIR:~0,-1%"
set "BACKEND_DIR=%ROOT_DIR%\depaso_rest"
set "FRONTEND_DIR=%ROOT_DIR%\depaso_app"
set "WEB_DIR=%ROOT_DIR%\depaso_web"
set "VENV=%BACKEND_DIR%\.venv"

call :log "Verificando Docker Desktop..."
docker info >nul 2>nul
if errorlevel 1 (
    call :warn "Docker no esta corriendo. Abriendo Docker Desktop..."
    if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
        start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    ) else (
        call :warn "No encontre Docker Desktop en la ruta default."
        call :warn "Abrilo manualmente y espera a que termine de iniciar."
    )
    call :wait_for_docker
)

call :log "Levantando contenedor depaso_db..."
cd /d "%ROOT_DIR%" || exit /b 1
docker compose up -d

call :wait_for_db
call :log "Base de datos lista en localhost:5432"

if not exist "%VENV%\Scripts\python.exe" (
    call :warn "Venv no encontrado en depaso_rest\.venv"
    call :warn "Ejecuta primero: cd depaso_rest && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt"
    goto fail
)

call :log "Ejecutando seed de base de datos..."
cd /d "%BACKEND_DIR%" || exit /b 1
"%VENV%\Scripts\python.exe" scripts\seed_db.py
if errorlevel 1 goto fail

call :log "Abriendo backend en nueva ventana..."
start "DePaso Backend" /D "%BACKEND_DIR%" cmd /k ".venv\Scripts\python.exe -m uvicorn src.app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 2 /nobreak >nul

call :log "Abriendo frontend en nueva ventana..."
start "DePaso Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run start"

call :log "Abriendo panel web en nueva ventana..."
start "DePaso Web" /D "%WEB_DIR%" cmd /k "npm run dev"

echo.
echo ==================================================
echo   DePaso stack levantado
echo ==================================================
echo.
echo   DB:       postgresql://depaso:***@localhost:5432/depaso_dev
echo   Backend:  http://localhost:8000/api/v1/docs
echo   Frontend: Expo (presiona 'i' para iOS, 'a' para Android)
echo   Web:      http://localhost:5173
echo.
echo   Credenciales de prueba:
echo     Cliente:   cliente@depaso.com  / password123
echo     Carrier:   lucia@depaso.com    / password123
echo     Pyme:      pyme@depaso.com     / password123  (panel web, org merchant)
echo     Fletero:   fletero@depaso.com  / password123  (panel web, org fleet)
echo     Local:     local@depaso.com    / password123  (panel web, org merchant)
echo.

exit /b 0

:log
echo [depaso] %~1
exit /b 0

:warn
echo [depaso] %~1
exit /b 0

:wait_for_docker
<nul set /p "=  Esperando que Docker inicie"
:wait_for_docker_loop
docker info >nul 2>nul
if errorlevel 1 (
    <nul set /p "=."
    timeout /t 2 /nobreak >nul
    goto wait_for_docker_loop
)
echo.
call :log "Docker listo."
exit /b 0

:wait_for_db
<nul set /p "=  Esperando que la DB este healthy"
:wait_for_db_loop
docker compose exec -T db pg_isready -U depaso -d depaso_dev >nul 2>nul
if errorlevel 1 (
    <nul set /p "=."
    timeout /t 2 /nobreak >nul
    goto wait_for_db_loop
)
echo.
exit /b 0

:fail
echo [depaso] Abortando.
exit /b 1
