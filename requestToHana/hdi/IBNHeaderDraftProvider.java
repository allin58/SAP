package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.exception.DraftProviderException;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.service.helpers.InboundDeliveryStatusEnum;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNHeaderDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemSizeDraft;
import com.sap.cloud.sdk.hana.connectivity.cds.*;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.filter.Expression;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

public class IBNHeaderDraftProvider implements Provider<IBNHeaderDraft> {

    private static final String ENTITY_NAME = "pptl.odata.ibn.manage.db.InboundDeliveryHeaderDraft";
    private static final String ENTITY_NAMESPACE = "pptl.odata.ibn.manage.db";
    private static final String IBN_KEY_NAME = "IBNID";
    private static final String ITEM_KEY_NAME = "ITEMID";
    private static final String COUNT_PROPERTY_NAME = "COUNT(IBNID)";
    private static final String CDS_EXCEPTION_MESSAGE = "Error executing CDS query";
    private static final int SINGLE_ENTRY_INDEX = 0;
    private Provider<IBNItemDraft> itemDraftProvider = new IBNItemDraftProvider();
    private Provider<IBNItemSizeDraft> itemSizeDraftProvider = new IBNItemSizeDraftProvider();

    @Override
    public IBNHeaderDraft save(IBNHeaderDraft header) {
        try {
            setKeys(header);
            header.setStatus(InboundDeliveryStatusEnum.DRAFT.toString());
            header.setCreatedAt(LocalDateTime.now());
            EntityData data = EntityData.createFromMap(header.toMapOfFields(), new ArrayList<>(header.getKey().keySet()), ENTITY_NAME);

            return DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeInsert(data, true).as(IBNHeaderDraft.class);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    private void setKeys(IBNHeaderDraft header) {
        header.setIbnId(UUID.randomUUID());
        if (header.getIBNNumber() == null) {
            header.setIBNNumber(Constants.NO_VALUE_STRING);
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
    public void update(IBNHeaderDraft headerDraft) {
        try {
            Map<String, Object> keys = new HashMap<>();
            keys.put(IBN_KEY_NAME, headerDraft.getIbnId());
            EntityData data = EntityData.createFrom(headerDraft, ENTITY_NAME);

            DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeUpdate(data, keys, true);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Optional<IBNHeaderDraft> getByKey(String key) {
        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(IBN_KEY_NAME, key);
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
    public Optional<IBNHeaderDraft> getByKeyFetched(String key) {
        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(IBN_KEY_NAME, key);
            CDSQuery query = CdsQueryBuilder.buildSelectByKeysQuery(ENTITY_NAME, keysMap);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            if (selectResult.getResult().isEmpty()) {
                return Optional.empty();
            }

            IBNHeaderDraft headerDraft = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList())
                    .get(SINGLE_ENTRY_INDEX);

            List<IBNItemDraft> items = itemDraftProvider.query(new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(key));
            for (IBNItemDraft item : items) {
                List<IBNItemSizeDraft> itemSizes = itemSizeDraftProvider.query(
                        new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(item.getIbnId().toString())
                                .AND(new ConditionBuilder().columnName(ITEM_KEY_NAME).EQ(item.getItemId().toString())));
                item.setSizes(itemSizes);
            }
            headerDraft.setItems(items);

            return Optional.of(headerDraft);

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Integer getInlineCount() {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountQuery(ENTITY_NAME, IBN_KEY_NAME);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Integer getInlineCountFiltered(Expression filterExpression) {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountFilteredQuery(ENTITY_NAME, IBN_KEY_NAME, filterExpression);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNHeaderDraft> getAll(QueryRequest req) {
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
    public List<IBNHeaderDraft> getAllFiltered(QueryRequest req) {
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
    public List<IBNHeaderDraft> getAllFetchedByKey(String key) {
        return null;
    }

    @Override
    public List<IBNHeaderDraft> query(ConditionBuilder.Condition condition) {
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

    private IBNHeaderDraft populate(Map<String, Object> entityProperties) {
        IBNHeaderDraft draft = new IBNHeaderDraft();
        draft.setIbnId(UUID.fromString(entityProperties.get("IBNID").toString()));
        draft.setIBNNumber(entityProperties.computeIfAbsent("IBNNUMBER", key -> Constants.NO_VALUE_STRING).toString());
        draft.setPONumber(entityProperties.computeIfAbsent("PONUMBER", key -> Constants.NO_VALUE_STRING).toString());
        draft.setPackingListNumber(entityProperties.computeIfAbsent("PACKINGLISTNUMBER", key -> Constants.NO_VALUE_STRING).toString());
        draft.setSystem(entityProperties.computeIfAbsent("SYSTEM", key -> Constants.NO_VALUE_STRING).toString());
        draft.setHandoverDate((LocalDateTime) entityProperties.computeIfPresent("HANDOVERDATE", (k, v) -> convertToLocaleDateTime(v)));
        draft.setMethodOfTransportation(entityProperties.computeIfAbsent("METHODOFTRANSPORTATION", key ->  Constants.NO_VALUE_STRING).toString());
        draft.setDateSubmitted((LocalDateTime) entityProperties.computeIfPresent("DATESUBMITTED", (k, v) -> convertToLocaleDateTime(v)));
        draft.setTotalItemQty((BigDecimal) entityProperties.computeIfPresent("TOTALITEMQTY",   (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        draft.setVolume((BigDecimal) entityProperties.computeIfPresent("VOLUME", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        draft.setGrossWeight((BigDecimal) entityProperties.computeIfPresent("GROSSWEIGHT", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        draft.setNetWeight((BigDecimal) entityProperties.computeIfPresent("NETWEIGHT", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        draft.setCountryOfOrigin(entityProperties.computeIfAbsent("COUNTRYOFORIGIN", key ->  Constants.NO_VALUE_STRING).toString());
        draft.setCollectionCountry(entityProperties.computeIfAbsent("COLLECTIONCOUNTRY", key ->  Constants.NO_VALUE_STRING).toString());
        draft.setDestCountryName(entityProperties.computeIfAbsent("DESTCOUNTRYNAME", key ->  Constants.NO_VALUE_STRING).toString());
        draft.setCreatedAt((LocalDateTime)  entityProperties.computeIfPresent("CREATEDAT", (k, v) -> (convertToLocaleDateTime(v))));
        draft.setStatus(entityProperties.computeIfAbsent("STATUS",  key ->  Constants.NO_VALUE_STRING).toString());
        draft.setAWBNumber(entityProperties.computeIfAbsent("AWBNUMBER",  key ->  Constants.NO_VALUE_STRING).toString());

        return draft;
    }

    private LocalDateTime convertToLocaleDateTime(Object date) {
        Timestamp timestamp = (Timestamp) date;
        return timestamp.toLocalDateTime();
    }
}
