@echo off
setlocal

:: Get the name of the batch file without extension
set "batchFileName=%~nx0"

:: Set the final file name
set "addonFileName=lockedContainers.mcaddon"

:: Set the output zip file name
set "zipFileName=temp.zip"

:: Delete old mcaddon
del "%addonFileName%"

:: Create the tar file with exclusions
@REM tar.exe -cvf "%tarFileName%" "manifest.json"
tar.exe -acf "%zipFileName%" --exclude %zipFileName% --exclude ".git" --exclude %~nx0 --exclude "README.md" *

:: Rename the zip file to lockedContainers.mcaddon
rename "%zipFileName%" "%addonFileName%"

endlocal
