@echo off
echo ================================================
echo   Beam ERP Desktop App - Build Script
echo ================================================
echo.

REM Step 1: Build React frontend
echo [1/3] Building React frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (echo [ERROR] Frontend build failed! & exit /b 1)
cd ..
echo [OK] Frontend built successfully.
echo.

REM Step 2: Bundle Python backend with PyInstaller
echo [2/3] Bundling Python backend...
cd backend
call ..\\.venv\\Scripts\\activate.bat 2>nul || call venv\\Scripts\\activate.bat 2>nul
pip install pyinstaller --quiet
pyinstaller beam_erp.spec --noconfirm
if %errorlevel% neq 0 (echo [ERROR] PyInstaller build failed! & cd .. & exit /b 1)
cd ..
echo [OK] Backend bundled successfully.
echo.

REM Step 3: Package Electron app
echo [3/3] Packaging Electron desktop app...
cd electron
call npm install --quiet
call npm run build
if %errorlevel% neq 0 (echo [ERROR] Electron build failed! & cd .. & exit /b 1)
cd ..
echo.
echo ================================================
echo   BUILD COMPLETE!
echo   Installer is in: electron\dist\
echo ================================================
