/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.batch;

import javax.annotation.Nonnull;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.batch.BatchChangeSetFluentHelperBasic;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Pilot;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.Plane_texts;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService;


/**
 * Implementation of the {@link MeataServiceBatchChangeSet} interface, enabling you to combine multiple operations into one changeset. For further information have a look into the {@link com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService MeataService}.
 * 
 */
public class DefaultMeataServiceBatchChangeSet
    extends BatchChangeSetFluentHelperBasic<MeataServiceBatch, MeataServiceBatchChangeSet>
    implements MeataServiceBatchChangeSet
{

    @Nonnull
    private final MeataService service;

    DefaultMeataServiceBatchChangeSet(
        @Nonnull
        final DefaultMeataServiceBatch batchFluentHelper,
        @Nonnull
        final MeataService service) {
        super(batchFluentHelper, batchFluentHelper);
        this.service = service;
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    protected DefaultMeataServiceBatchChangeSet getThis() {
        return this;
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet createPilot(
        @Nonnull
        final Pilot pilot) {
        return addRequestCreate(service::createPilot, pilot);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet updatePilot(
        @Nonnull
        final Pilot pilot) {
        return addRequestUpdate(service::updatePilot, pilot);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet deletePilot(
        @Nonnull
        final Pilot pilot) {
        return addRequestDelete(service::deletePilot, pilot);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet createPlane(
        @Nonnull
        final Plane plane) {
        return addRequestCreate(service::createPlane, plane);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet updatePlane(
        @Nonnull
        final Plane plane) {
        return addRequestUpdate(service::updatePlane, plane);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet deletePlane(
        @Nonnull
        final Plane plane) {
        return addRequestDelete(service::deletePlane, plane);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet createPlane_texts(
        @Nonnull
        final Plane_texts plane_texts) {
        return addRequestCreate(service::createPlane_texts, plane_texts);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet updatePlane_texts(
        @Nonnull
        final Plane_texts plane_texts) {
        return addRequestUpdate(service::updatePlane_texts, plane_texts);
    }

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public MeataServiceBatchChangeSet deletePlane_texts(
        @Nonnull
        final Plane_texts plane_texts) {
        return addRequestDelete(service::deletePlane_texts, plane_texts);
    }

}
