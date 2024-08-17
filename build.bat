@echo off
setlocal

:: Set the final file name
set "packFileName=lockedContainers.mcpack"

:: Set the output zip file name
set "zipFileName=temp.zip"

:: Delete old mcpack
del "%packFileName%"

:: Create the tar file with exclusions
@REM tar.exe -cvf "%tarFileName%" "manifest.json"
tar.exe -acf "%zipFileName%" --exclude %zipFileName% --exclude ".git" --exclude %~nx0 --exclude "README.md" *

:: Rename the zip file to lockedContainers.mcpack
rename "%zipFileName%" "%packFileName%"

endlocal
