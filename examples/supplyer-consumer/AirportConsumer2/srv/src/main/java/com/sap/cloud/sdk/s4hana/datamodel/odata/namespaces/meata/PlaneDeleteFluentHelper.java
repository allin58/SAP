/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata;

import javax.annotation.Nonnull;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.FluentHelperDelete;


/**
 * Fluent helper to delete an existing {@link com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane Plane} entity in the S/4HANA system.<p>
 * To perform execution, call the {@link #execute execute} method on the fluent helper object.
 * 
 */
public class PlaneDeleteFluentHelper
    extends FluentHelperDelete<PlaneDeleteFluentHelper, Plane>
{

    /**
     * {@link com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane Plane} entity object that will be deleted in the S/4HANA system.
     * 
     */
    private final Plane entity;

    /**
     * Creates a fluent helper object that will delete a {@link com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane Plane} entity on the OData endpoint. To perform execution, call the {@link #execute execute} method on the fluent helper object.
     * 
     * @param servicePath
     *     The service path to direct the update requests to.
     * @param entity
     *     The Plane to delete from the endpoint.
     */
    public PlaneDeleteFluentHelper(
        @Nonnull
        final String servicePath,
        @Nonnull
        final Plane entity) {
        super(servicePath);
        this.entity = entity;
    }

    @Override
    @Nonnull
    protected Plane getEntity() {
        return entity;
    }

}
