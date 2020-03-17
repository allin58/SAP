package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.exception.DraftProviderException;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNBoxDraft;
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
import java.util.*;
import java.util.stream.Collectors;

public class IBNBoxDraftProvider implements Provider<IBNBoxDraft> {

    private static final String ENTITY_NAME = "pptl.odata.ibn.manage.db.InboundDeliveryBoxDraft";
    private static final String ENTITY_NAMESPACE = "pptl.odata.ibn.manage.db";
    private static final String HANA_BOX_KEY_NAME = "HANABOXID";
    private static final String IBN_KEY_NAME = "IBNID";
    private static final String COUNT_PROPERTY_NAME = "COUNT(HANABOXID)";
    private static final String CDS_EXCEPTION_MESSAGE = "Error executing CDS query";
    private static final int SINGLE_ENTRY_INDEX = 0;
    private IBNItemDraftProvider itemDraftProvider = new IBNItemDraftProvider();

    @Override
    public IBNBoxDraft save(IBNBoxDraft header) {
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
    public void update(IBNBoxDraft itemDraft) {
        try {
            Map<String, Object> keys = new HashMap<>();
            keys.put(HANA_BOX_KEY_NAME, itemDraft.getHanaBoxId());
            EntityData data = EntityData.createFrom(itemDraft, ENTITY_NAME);

            DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeUpdate(data, keys, true);
        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Optional<IBNBoxDraft> getByKey(String key) {
        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(HANA_BOX_KEY_NAME, key);
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
    public Optional<IBNBoxDraft> getByKeyFetched(String key) {

        try {
            Map<String, Object> keysMap = new HashMap<>();
            keysMap.put(HANA_BOX_KEY_NAME, key);
            CDSQuery query = CdsQueryBuilder.buildSelectByKeysQuery(ENTITY_NAME, keysMap);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            if (selectResult.getResult().isEmpty()) {
                return Optional.empty();
            }

            IBNBoxDraft boxDraft = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList())
                    .get(SINGLE_ENTRY_INDEX);

            String ibnId = boxDraft.getIbnId().toString();
            String hanaBoxId = boxDraft.getHanaBoxId().toString();
            List<IBNItemDraft> itemDrafts = itemDraftProvider.getAllFetchedByKeysForBoxes(ibnId, hanaBoxId);
            boxDraft.setItems(itemDrafts);

            return Optional.of(boxDraft);

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNBoxDraft> query(ConditionBuilder.Condition condition) {
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
            CDSQuery query = CdsQueryBuilder.buildInlineCountQuery(ENTITY_NAME, HANA_BOX_KEY_NAME);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public Integer getInlineCountFiltered(Expression filterExpression) {
        try {
            CDSQuery query = CdsQueryBuilder.buildInlineCountFilteredQuery(ENTITY_NAME, HANA_BOX_KEY_NAME, filterExpression);
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            return Integer.parseInt(selectResult.getResult().get(SINGLE_ENTRY_INDEX).getElementValue(COUNT_PROPERTY_NAME).toString());

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    @Override
    public List<IBNBoxDraft> getAll(QueryRequest req) {
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
    public List<IBNBoxDraft> getAllFiltered(QueryRequest req) {
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
    public List<IBNBoxDraft> getAllFetchedByKey(String ibnId) {
        try {

            CDSQuery query = CdsQueryBuilder.buildSelectByConditionQuery(ENTITY_NAME, new ConditionBuilder().columnName(IBN_KEY_NAME).EQ(ibnId));
            CDSSelectQueryResult selectResult = DataSourceManager.getInstance().getCDSHandler(ENTITY_NAMESPACE).executeQuery(query);

            List<IBNBoxDraft> itemDrafts = selectResult
                    .getResult()
                    .stream()
                    .map(entityData -> populate(entityData.asMap()))
                    .collect(Collectors.toList());

            for (IBNBoxDraft boxDraft : itemDrafts) {
                List<IBNItemDraft> itemSizes = itemDraftProvider.getAllFetchedByKeysForBoxes(boxDraft.getIbnId().toString(), boxDraft.getHanaBoxId().toString());
                boxDraft.setItems(itemSizes);
            }

            return itemDrafts;

        } catch (CDSException e) {
            throw new DraftProviderException(CDS_EXCEPTION_MESSAGE, e);
        }
    }

    private IBNBoxDraft populate(Map<String, Object> entityProperties) {
        IBNBoxDraft boxDraft = new IBNBoxDraft();

        boxDraft.setHanaBoxId(UUID.fromString(entityProperties.get("HANABOXID").toString()));
        boxDraft.setIbnId(UUID.fromString(entityProperties.get("IBNID").toString()));
        boxDraft.setBoxId(entityProperties.computeIfAbsent("BOXID", key -> Constants.NO_VALUE_STRING).toString());
        boxDraft.setIBNNumber(entityProperties.computeIfAbsent("IBNNUMBER", key -> Constants.NO_VALUE_STRING).toString());
        boxDraft.setBoxRef(entityProperties.computeIfAbsent("BOXREF", key -> Constants.NO_VALUE_STRING).toString());
        boxDraft.setVolume((BigDecimal) entityProperties.computeIfPresent("VOLUME", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setGrossWeight((BigDecimal) entityProperties.computeIfPresent("GROSSWEIGHT", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setNetWeight((BigDecimal) entityProperties.computeIfPresent("NETWEIGHT", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setSizeH((BigDecimal) entityProperties.computeIfPresent("SIZEH", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setSizeW((BigDecimal) entityProperties.computeIfPresent("SIZEW", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setSizeL((BigDecimal) entityProperties.computeIfPresent("SIZEL", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setTotals((BigDecimal) entityProperties.computeIfPresent("TOTALS", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));
        boxDraft.setCurrency(entityProperties.computeIfAbsent("CURRENCY", key -> Constants.NO_VALUE_STRING).toString());
        boxDraft.setQuantity((BigDecimal) entityProperties.computeIfPresent("QUANTITY", (k, v) ->  BigDecimal.valueOf(Double.parseDouble(v.toString()))));

        return boxDraft;
    }
}
