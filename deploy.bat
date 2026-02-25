@echo off
setlocal

:: Source (current folder)
set "SOURCE=%cd%"

:: Destination
set "DEST=C:\Users\LENOVO\Desktop\projects\squanGo\public\csp"

echo.
echo Deleting old files in %DEST% ...
if exist "%DEST%" (
    rmdir /s /q "%DEST%"
)

mkdir "%DEST%"

echo.
echo Copying new files...

robocopy "%SOURCE%" "%DEST%" /E ^
    /XD ".git" ^
    /XF ".gitignore" "deploy.bat"

echo.
echo Deployment complete.
pause
