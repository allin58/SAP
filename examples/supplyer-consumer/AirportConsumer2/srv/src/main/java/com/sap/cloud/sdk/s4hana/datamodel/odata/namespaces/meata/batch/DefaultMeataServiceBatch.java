/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.batch;

import javax.annotation.Nonnull;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.batch.BatchFluentHelperBasic;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService;


/**
 * Default implementation of the {@link MeataServiceBatch} interface exposed in the {@link com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService MeataService}, allowing you to create multiple changesets and finally execute the batch request.
 * 
 */
public class DefaultMeataServiceBatch
    extends BatchFluentHelperBasic<MeataServiceBatch, MeataServiceBatchChangeSet>
    implements MeataServiceBatch
{

    @Nonnull
    private final MeataService service;

    /**
     * Creates a new instance of this DefaultMeataServiceBatch.
     * 
     * @param service
     *     The service to execute all operations in this changeset on.
     */
    public DefaultMeataServiceBatch(
        @Nonnull
        final MeataService service) {
        this.service = service;
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    protected String getServicePathForBatchRequest() {
        return MeataService.DEFAULT_SERVICE_PATH;
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    protected DefaultMeataServiceBatch getThis() {
        return this;
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet beginChangeSet() {
        return new DefaultMeataServiceBatchChangeSet(this, service);
    }

}
