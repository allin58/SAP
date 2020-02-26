@echo off
set sourceXml=%1
set currentPath=%cd%
set target=%currentPath%\node_modules\@sap\edm-converters\lib\edmToCsn\bin
echo %sourceXml%
echo %currentPath%\node_modules\@sap\edm-converters\lib\edmToCsn\bin
echo Creating CSN model....
echo source : %currentPath%/srv/external/edmx/%sourceXml%.xml
echo target : %currentPath%/srv/external/csn/%sourceXml%.json

rem call %target%/edmx2csn.cmd --help
call %target%/edmx2csn.cmd -i %currentPath%/srv/external/edmx/%sourceXml%.xml -o %currentPath%/srv/external/csn/%sourceXml%.json -f
echo Generating VDM classes....
call java -jar c:/work/tools/odata-generator-cli-2.25.0.jar -i %currentPath%/srv/external/edmx/ -o %currentPath%/srv/src/main/java -p cars.vdm -b https://p2001133712trial-dev-pptl-test-source-srv.cfapps.eu10.hana.ondemand.com/odata/v2/CarService
rem call java -jar c:/work/tools/odata-generator-cli-2.25.0.jar -i %currentPath%/srv/external/edmx/ -o %currentPath%/srv/src/main/java -p %pacakge%
rem cd %currentPath%
rem C:\%HOMEPATH%\AppData\Roaming\npm\node_modules\@sap\edm-converters\lib\edmToCsn\bin