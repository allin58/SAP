@echo off
set sourceXml=%1
set currentPath=%cd%
set target=%currentPath%\node_modules\@sap\edm-converters\lib\edmToCsn\bin
echo %sourceXml%
echo %currentPath%\node_modules\@sap\edm-converters\lib\edmToCsn\bin
echo Creating CSN model....


call C:\Users\Nikita_Karchahin\Desktop\csnGen\edm-converters\lib\edmToCsn\bin\edmx2csn.cmd --help
call C:/Users/Nikita_Karchahin/Desktop/csnGen/edm-converters/lib/edmToCsn/bin/edmx2csn.cmd -i %currentPath%/srv/metadata.xml -o %currentPath%/srv/external/csn/res.json -f
echo Generating VDM classes....

pause



edmx2csn -i %cd%/metadata.xml -o %cd%/cns.json -f
