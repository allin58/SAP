/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata;

import javax.annotation.Nonnull;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.FluentHelperRead;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.selectable.PlaneSelectable;


/**
 * Fluent helper to fetch multiple {@link com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane Plane} entities. This fluent helper allows methods which modify the underlying query to be called before executing the query itself. 
 * 
 */
public class PlaneFluentHelper
    extends FluentHelperRead<PlaneFluentHelper, Plane, PlaneSelectable>
{


    /**
     * Creates a fluent helper using the specified service path to send the read requests.
     * 
     * @param servicePath
     *     The service path to direct the read requests to.
     */
    public PlaneFluentHelper(
        @Nonnull
        final String servicePath) {
        super(servicePath);
    }

    @Override
    @Nonnull
    protected Class<Plane> getEntityClass() {
        return Plane.class;
    }

}
