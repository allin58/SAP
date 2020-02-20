@echo off
set currentPath=%cd%
echo Generating VDM classes....
call cds srv/cat-service.cds -2 edmx > %currentPath%/edmx.xml
call java -jar C:\Users\Nikita_Karchahin\Desktop\edmxGen\odata-generator-cli.jar -i %currentPath%/ -o %currentPath%/VDM -b https://some.test.com

echo All done
