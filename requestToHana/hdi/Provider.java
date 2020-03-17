package com.burberry.pptl.odata.ibn.manage.hdi;

import com.sap.cloud.sdk.hana.connectivity.cds.ConditionBuilder;
import com.sap.cloud.sdk.service.prov.api.filter.Expression;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;

import java.util.List;
import java.util.Optional;

public interface Provider<T> {

    T save(T header);
    void deleteByKey(String key);
    void update(T header);
    Optional<T> getByKey(String key);
    Optional<T> getByKeyFetched(String key);
    Integer getInlineCount();
    Integer getInlineCountFiltered(Expression filterExpression);
    List<T> getAll(QueryRequest req);
    List<T> getAllFiltered(QueryRequest req);
    List<T> getAllFetchedByKey(String key);
    List<T> query(ConditionBuilder.Condition condition);
}
