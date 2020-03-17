package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.exception.DraftProviderException;
import com.sap.cloud.sdk.hana.connectivity.handler.DataSourceHandlerFactory;
import com.sap.cloud.sdk.service.prov.rt.cds.CDSHandler;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;
import java.sql.SQLException;

public class DataSourceManager {

    private CDSHandler dataSourceHandler;

    public static DataSourceManager getInstance() {
        return InstanceHolder.INSTANCE;
    }

    private DataSourceManager() {
    }

    private static class InstanceHolder {
        private static final DataSourceManager INSTANCE = new DataSourceManager();
    }

    public CDSHandler getCDSHandler(String namespace) {
        if (dataSourceHandler == null) {
            try {
                Context ctx = new InitialContext();
                DataSource dataSource = ((DataSource) ctx.lookup("java:comp/env/jdbc/java-hdi-container"));
                dataSourceHandler = DataSourceHandlerFactory.getInstance().getCDSHandler(dataSource.getConnection(), namespace);
                return dataSourceHandler;

            } catch (SQLException | NamingException e) {
                throw new DraftProviderException("Error initializing HDI container connection", e);
            }
        }
        return dataSourceHandler;
    }
}
