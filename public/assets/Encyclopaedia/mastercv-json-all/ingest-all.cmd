@echo off
setlocal enabledelayedexpansion

:: ================================
:: Configuration
:: ================================
set API_URL=https://app.joffad.workers.dev/api/ingest
set JSON_DIR=.

echo.
echo ============================================
echo   STARTING BULK INGEST OF MASTER CV FILES
echo ============================================
echo.

for %%F in ("%JSON_DIR%\*.json") do (
    echo Ingesting: %%~nxF
    curl -s -o NUL -w "HTTP STATUS: %%{http_code}\n" ^
        -X POST "%API_URL%" ^
        -H "Content-Type: application/json" ^
        --data-binary "@%%F"
    
    if errorlevel 1 (
        echo ERROR: Failed to ingest %%~nxF
        echo Halting script.
        exit /b 1
    )
    
    echo --------------------------------------------
)

echo.
echo ============================================
echo   ALL FILES INGESTED SUCCESSFULLY
echo ============================================
echo.

endlocal
pause
