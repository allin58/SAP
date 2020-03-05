md mta_backup
copy .\mta_archives\*.* .\mta_backup
build-mta && cd mta_archives && cf deploy sandbox.odata.po.manage_0.0.1.mtar --skip-ownership-validation && cd ..