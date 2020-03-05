@ECHO OFF
call cf ssh  AirportConsumer-srv -c "app/META-INF/.sap_java_buildpack/sapjvm/bin/jvmmon"
start debugging
pause


