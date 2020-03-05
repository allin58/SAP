@ECHO OFF
set currentPath=%cd%
set arg1=%1
echo %arg1%
mbt build -p=cf -s=%currentPath% --mtar=%arg1%
pause


