@echo off
title Galaxium Travels
echo.
echo ==========================================
echo   Galaxium Travels - Arranque Windows
echo ==========================================
echo.

:: Backend
echo [1/2] Arrancando Backend (puerto 8080)...
start "Galaxium BACKEND" cmd /k "cd /d C:\Users\j.casado\galaxium-travels\booking_system_backend && .venv\Scripts\activate && python server.py"

:: Esperar 4 segundos a que arranque el backend
timeout /t 4 /nobreak >nul

:: Frontend
echo [2/2] Arrancando Frontend (puerto 5173)...
start "Galaxium FRONTEND" cmd /k "cd /d C:\Users\j.casado\galaxium-travels\booking_system_frontend && set PATH=C:\Program Files\nodejs;%PATH% && npm run dev"

:: Esperar a que Vite arranque
timeout /t 6 /nobreak >nul

:: Abrir navegador
echo.
echo Abriendo navegador...
start http://localhost:5173

echo.
echo ==========================================
echo   TODO ARRANCADO
echo   Backend  : http://localhost:8080
echo   Frontend : http://localhost:5173
echo   API Docs : http://localhost:8080/docs
echo ==========================================
echo.
echo Puedes cerrar esta ventana.
echo Para parar los servidores cierra las ventanas BACKEND y FRONTEND.
echo.
