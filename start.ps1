# ============================================================
#  BobAthon — Galaxium Travels · Arranque Windows (PowerShell)
#  Equivalente a ./start.sh para Mac/Linux
# ============================================================

$ErrorActionPreference = "Stop"
$ROOT = $PSScriptRoot

function Write-Header($msg) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
}

# ----------------------------------------------------------
# 1. Verificar dependencias
# ----------------------------------------------------------
Write-Header "Verificando dependencias..."

$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { Write-Host "[ERROR] Python no encontrado." -ForegroundColor Red; exit 1 }
Write-Host "[OK] $(python --version)" -ForegroundColor Green

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Write-Host "[ERROR] Node.js no encontrado." -ForegroundColor Red; exit 1 }
Write-Host "[OK] Node $(node --version)" -ForegroundColor Green

# ----------------------------------------------------------
# 2. Backend — python server.py (puerto 8080)
# ----------------------------------------------------------
Write-Header "Arrancando Backend (FastAPI — puerto 8080)..."

$backendDir = Join-Path $ROOT "booking_system_backend"
Push-Location $backendDir

if (-not (Test-Path ".venv")) {
    Write-Host "Creando entorno virtual Python..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "Instalando dependencias Python..." -ForegroundColor Yellow
& ".\.venv\Scripts\python.exe" -m pip install -q -r requirements.txt
Write-Host "[OK] Dependencias backend instaladas" -ForegroundColor Green

Write-Host "Iniciando servidor en http://localhost:8080 ..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & ".\.venv\Scripts\python.exe" server.py 2>&1
} -ArgumentList $backendDir

Write-Host "[OK] Backend iniciado (Job ID: $($backendJob.Id))" -ForegroundColor Green
Pop-Location

# Esperar a que el backend arranque
Write-Host "Esperando que el backend arranque..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# ----------------------------------------------------------
# 3. Frontend — Vite (puerto 5173)
# ----------------------------------------------------------
Write-Header "Arrancando Frontend (Vite — puerto 5173)..."

$frontendDir = Join-Path $ROOT "booking_system_frontend"
Push-Location $frontendDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias Node (npm install)..." -ForegroundColor Yellow
    npm install
    Write-Host "[OK] Dependencias frontend instaladas" -ForegroundColor Green
}

Write-Host "Iniciando Vite en http://localhost:5173 ..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev 2>&1
} -ArgumentList $frontendDir

Write-Host "[OK] Frontend iniciado (Job ID: $($frontendJob.Id))" -ForegroundColor Green
Pop-Location

# ----------------------------------------------------------
# 4. Listo
# ----------------------------------------------------------
Write-Header "Galaxium Travels arrancado"
Write-Host ""
Write-Host "  Backend  -> http://localhost:8080" -ForegroundColor White
Write-Host "  API Docs -> http://localhost:8080/docs" -ForegroundColor White
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Para ver los logs:" -ForegroundColor Yellow
Write-Host "  Receive-Job -Id $($backendJob.Id) -Keep   # backend" -ForegroundColor Gray
Write-Host "  Receive-Job -Id $($frontendJob.Id) -Keep  # frontend" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener todo:" -ForegroundColor Yellow
Write-Host "  Get-Job | Stop-Job ; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host ""
