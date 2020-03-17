package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.exception.DraftProviderException;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemSizeDraft;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSException;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSQuery;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSSelectQueryResult;
import com.sap.cloud.sdk.hana.connectivity.cds.ConditionBuilder;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.filter.Expression;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

public class IBNItemSizeDraftProvider implements Provider<IBNItemSizeDraft>{

    private static final String ENTITY_NAME = "pptl.odata.ibn.manage.db.InboundDeliveryItemSizesDraft";
    private static final String ENTITY_NAMESPACE = "pptl.odata.ibn.manage.db";
    private static final String ITEM_KEY_NAME = "ITEMID";
    private static final String IBN_KEY_NAME = "IBNID";
    private static final String SIZE_KEY_NAME = "SIZEID";
    private static final int SINGLE_ENTRY_INDEX = 0;
    private static final String COUNT_PROPERTY_NAME = "COUNT(SIZEID)";
    private static final String CDS_EXCEPTION_MESSAGE = "Error executing CDS query";

    @Override
    public IBNItemSizeDraft save(IBNItemSizeDraft header) {
        try {
            return DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeInsert(header, ENTITY_NAME, true);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public void deleteByKey(String key) {
        try {
            Map<String, Object> keys = new HashMap<>();
            keys.put(IBN_KEY_NAME, key);
            DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeDelete(ENTITY_NAME, keys);

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public void update(IBNItemSizeDraft itemSizeDraft) {
        try {
            Map<String, Object> keys = new HashMap<>();
            keys.put(SIZE_KEY_NAME, itemSizeDraft.getSizeId());
            EntityData data = EntityData.createFrom(itemSizeDraft, ENTITY_NAME);

            DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeUpdate(data, keys, true);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Optional<IBNItemSizeDraft> getByKey(String key) {
        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(SIZE_KEY_NAME, key);
            CDSQuery query = CdsQueryBuilder.buildSelectByKeysQuery(ENTITY_NAME, keysMap);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            if (selectResult.getResult().isEmpty()) {
                return Optional.empty();
            }

            return Optional.of(selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList())
                    .get(SINGLE_ENTRY_INDEX));

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Optional<IBNItemSizeDraft> getByKeyFetched(String key) {
        return getByKey(key);
    }

    @Override
    public Integer getInlineCount() {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountQuery(ENTITY_NAME, SIZE_KEY_NAME);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Integer getInlineCountFiltered(Expression filterExpression) {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountFilteredQuery(ENTITY_NAME, SIZE_KEY_NAME, filterExpression);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNItemSizeDraft> getAll(QueryRequest req) {
        try {
            CDSQuery query = CdsQueryBuilder.buildSelectAllQuery(ENTITY_NAME, req);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNItemSizeDraft> getAllFiltered(QueryRequest req) {
        try {
            CDSQuery query = CdsQueryBuilder.buildSelectAllFilteredQuery(ENTITY_NAME, req);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNItemSizeDraft> getAllFetchedByKey(String key) {
        return query(new ConditionBuilder().columnName(ITEM_KEY_NAME).EQ(key));
    }

    @Override
    public List<IBNItemSizeDraft> query(ConditionBuilder.Condition condition) {

        try {
            CDSQuery query = CdsQueryBuilder.buildSelectByConditionQuery(ENTITY_NAME, condition);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    private IBNItemSizeDraft populate(Map<String, Object> entityProperties) {
        IBNItemSizeDraft sizeDraft = new IBNItemSizeDraft();
        sizeDraft.setSizeId(UUID.fromString(entityProperties.get("SIZEID").toString()));
        sizeDraft.setIbnId(UUID.fromString(entityProperties.get("IBNID").toString()));
        sizeDraft.setHanaBoxId(entityProperties.computeIfAbsent("HANABOXID", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setItemId(UUID.fromString(entityProperties.get("ITEMID").toString()));
        sizeDraft.setIBNNumber(entityProperties.computeIfAbsent("IBNNUMBER", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setIBNItemNumber(entityProperties.computeIfAbsent("IBNITEMNUMBER", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setBoxID(entityProperties.computeIfAbsent("BOXID", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setSize(entityProperties.computeIfAbsent("SIZE", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setPrice((BigDecimal) entityProperties.computeIfPresent("PRICE", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        sizeDraft.setCurrency(entityProperties.computeIfAbsent("CURRENCY", key -> Constants.NO_VALUE_STRING).toString());
        sizeDraft.setPlanningQty((BigDecimal) entityProperties.computeIfPresent("QUANTITY", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));

        return sizeDraft;
    }
}
