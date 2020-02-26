@echo off
set currentPath=%cd%
call %cd%/gen/lib/edmToCsn/bin/edmx2csn -i %cd%/metadata.xml -o %cd%/cns.json -f

echo Creating CSN model....


pause




