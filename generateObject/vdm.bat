@echo off
set package=%1
set currentPath=%cd%
echo Generating VDM classes....
call java -jar c:/sapcloud/tools/odata-generator-cli-2.25.0.jar -i %currentPath%/srv/external/edmx/ -o %currentPath%/srv/src/main/java -p %packageSuffix%.vdm -b https://some.test.com
echo All done