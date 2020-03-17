package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.exception.DraftProviderException;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemSizeDraft;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSException;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSQuery;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSSelectQueryResult;
import com.sap.cloud.sdk.hana.connectivity.cds.ConditionBuilder;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.filter.Expression;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

public class IBNItemDraftProvider implements Provider<IBNItemDraft> {

    private static final String ENTITY_NAME = "pptl.odata.ibn.manage.db.InboundDeliveryItemDraft";
    private static final String ENTITY_NAMESPACE = "pptl.odata.ibn.manage.db";
    private static final String ITEM_KEY_NAME = "ITEMID";
    private static final String IBN_KEY_NAME = "IBNID";
    private static final String HANA_BOX_KEY_NAME = "HANABOXID";
    private static final String COUNT_PROPERTY_NAME = "COUNT(ITEMID)";
    private static final String CDS_EXCEPTION_MESSAGE = "Error executing CDS query";
    private static final int SINGLE_ENTRY_INDEX = 0;
    private Provider<IBNItemSizeDraft> itemSizeDraftProvider = new IBNItemSizeDraftProvider();

    @Override
    public IBNItemDraft save(IBNItemDraft header) {
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
    public void update(IBNItemDraft itemDraft) {
        try {
            Map<String, Object> keys = new HashMap<>();
            keys.put(ITEM_KEY_NAME, itemDraft.getItemId());
            EntityData data = EntityData.createFrom(itemDraft, ENTITY_NAME);

            DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeUpdate(data, keys, true);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Optional<IBNItemDraft> getByKey(String key) {
        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(ITEM_KEY_NAME, key);
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
    public Optional<IBNItemDraft> getByKeyFetched(String key) {

        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(ITEM_KEY_NAME, key);
            CDSQuery query = CdsQueryBuilder.buildSelectByKeysQuery(ENTITY_NAME, keysMap);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            if (selectResult.getResult().isEmpty()) {
                return Optional.empty();
            }

            IBNItemDraft itemDraft = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList())
                    .get(SINGLE_ENTRY_INDEX);

            String ibnId = itemDraft.getIbnId().toString();
            String itemId = itemDraft.getItemId().toString();
            List<IBNItemSizeDraft> sizes = itemSizeDraftProvider
                    .query(new ConditionBuilder().columnName(ITEM_KEY_NAME).EQ(itemId)
                            .AND(new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(ibnId)));
            itemDraft.setSizes(sizes);

            return Optional.of(itemDraft);

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNItemDraft> query(ConditionBuilder.Condition condition) {
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

    @Override
    public Integer getInlineCount() {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountQuery(ENTITY_NAME, ITEM_KEY_NAME);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Integer getInlineCountFiltered(Expression filterExpression) {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountFilteredQuery(ENTITY_NAME, ITEM_KEY_NAME, filterExpression);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNItemDraft> getAll(QueryRequest req) {
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
    public List<IBNItemDraft> getAllFiltered(QueryRequest req) {
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
    public List<IBNItemDraft> getAllFetchedByKey(String ibnId) {
        try {

            CDSQuery query = CdsQueryBuilder.buildSelectByConditionQuery(ENTITY_NAME, new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(ibnId));
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            List<IBNItemDraft> itemDrafts = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

            for (IBNItemDraft item : itemDrafts) {
                List<IBNItemSizeDraft> itemSizes = itemSizeDraftProvider.query(
                        new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(item.getIbnId().toString())
                                .AND(new ConditionBuilder().columnName(ITEM_KEY_NAME).EQ(item.getItemId().toString())));
                item.setSizes(itemSizes);
            }

            return itemDrafts;

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    public List<IBNItemDraft> getAllFetchedByKeysForBoxes(String ibnId, String hanaBoxId) {
        try {

            CDSQuery query = CdsQueryBuilder.buildSelectByConditionQuery(ENTITY_NAME,
                    new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(ibnId)
                    .AND(new ConditionBuilder().columnName(HANA_BOX_KEY_NAME).EQ(hanaBoxId)));
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            List<IBNItemDraft> itemDrafts = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

            for (IBNItemDraft item : itemDrafts) {
                List<IBNItemSizeDraft> itemSizes = itemSizeDraftProvider.query(
                        new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(item.getIbnId().toString())
                                .AND(new ConditionBuilder().columnName(ITEM_KEY_NAME).EQ(item.getItemId().toString())));
                item.setSizes(itemSizes);
            }

            return itemDrafts;

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    private IBNItemDraft populate(Map<String, Object> entityProperties) {
        IBNItemDraft itemDraft = new IBNItemDraft();
                itemDraft.setItemId(UUID.fromString(entityProperties.get("ITEMID").toString()));
                itemDraft.setIbnId(UUID.fromString(entityProperties.get("IBNID").toString()));
                itemDraft.setHanaBoxId(entityProperties.computeIfAbsent("HANABOXID", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setIBNNumber(entityProperties.computeIfAbsent("IBNNUMBER", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setBoxId(entityProperties.computeIfAbsent("BOXID", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setMaterialNumber(entityProperties.computeIfAbsent("MATERIALNUMBER", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setDescription(entityProperties.computeIfAbsent("DESCRIPTION", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setColor(entityProperties.computeIfAbsent("COLOR", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setPrice((BigDecimal) entityProperties.computeIfPresent("PRICE", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
                itemDraft.setCountryOfOrigin(entityProperties.computeIfAbsent("COUNTRYOFORIGIN", key ->  Constants.NO_VALUE_STRING).toString());
                itemDraft.setCollectionCountry(entityProperties.computeIfAbsent("COLLECTIONCOUNTRY", key ->  Constants.NO_VALUE_STRING).toString());
                itemDraft.setMethodOfTransportation(entityProperties.computeIfAbsent("METHODOFTRANSPORTATION", key ->  Constants.NO_VALUE_STRING).toString());
                itemDraft.setExFactoryDate((LocalDateTime) entityProperties.computeIfPresent("EXFACTORYDATE", (k, v) -> convertToLocaleDateTime(v)));
                itemDraft.setDeliveryDate((LocalDateTime) entityProperties.computeIfPresent("DELIVERYDATE", (k, v) -> convertToLocaleDateTime(v)));
                itemDraft.setCurrency(entityProperties.computeIfAbsent("CURRENCY", key -> Constants.NO_VALUE_STRING).toString());
                itemDraft.setPlanningQty((BigDecimal) entityProperties.computeIfPresent("QUANTITY", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));

        return itemDraft;
    }

    private LocalDateTime convertToLocaleDateTime(Object date) {
        Timestamp timestamp = (Timestamp) date;
        return timestamp.toLocalDateTime();
    }
}
