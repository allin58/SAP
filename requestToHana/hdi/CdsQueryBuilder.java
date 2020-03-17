package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.service.helpers.ExpressionParser;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSQuery;
import com.sap.cloud.sdk.hana.connectivity.cds.CDSSelectQueryBuilder;
import com.sap.cloud.sdk.hana.connectivity.cds.ConditionBuilder;
import com.sap.cloud.sdk.service.prov.api.filter.Expression;
import com.sap.cloud.sdk.service.prov.api.request.OrderByExpression;
import com.sap.cloud.sdk.service.prov.api.request.QueryRequest;

import java.util.List;
import java.util.Map;

public class CdsQueryBuilder {

    public static CDSQuery buildSelectByKeysQuery(String entityName, Map<String, Object> keys) {
        return new CDSSelectQueryBuilder(entityName)
                .selectColumns("*")
                .where(ExpressionParser.buildCondition(keys))
                .build();
    }

    public static CDSQuery buildSelectAllQuery(String entityName, QueryRequest req) {

        int skip = req.getSkipOptionValue() <= 0 ? Constants.DEFAULT_SKIP : req.getSkipOptionValue();
        int top = req.getTopOptionValue() <=0 ? Constants.DEFAULT_TOP : req.getTopOptionValue();

        if (req.getOrderByProperties().isEmpty()) {
            return new CDSSelectQueryBuilder(entityName)
                    .top(top)
                    .skip(skip)
                    .selectColumns("*")
                    .build();
        }

        return handleOrderBy(new CDSSelectQueryBuilder(entityName)
                        .top(top)
                        .skip(skip)
                        .selectColumns("*"), req.getOrderByProperties())
                .build();
    }

    public static CDSQuery buildSelectByConditionQuery(String entityName, ConditionBuilder.Condition condition) {
        return new CDSSelectQueryBuilder(entityName)
                .selectColumns("*")
                .where(condition)
                .build();
    }

    public static CDSQuery buildSelectAllFilteredQuery(String entityName, QueryRequest req) {

        int skip = req.getSkipOptionValue() <= 0 ? Constants.DEFAULT_SKIP : req.getSkipOptionValue();
        int top = req.getTopOptionValue() <=0 ? Constants.DEFAULT_TOP : req.getTopOptionValue();

        if (req.getOrderByProperties().isEmpty()) {
            return new CDSSelectQueryBuilder(entityName)
                    .top(top)
                    .skip(skip)
                    .selectColumns("*")
                    .where(ExpressionParser.parseAsCondition(req.getQueryExpression()))
                    .build();
        }

        return handleOrderByFiltered(
                new CDSSelectQueryBuilder(entityName)
                        .top(top)
                        .skip(skip)
                        .selectColumns("*")
                        .where(ExpressionParser.parseAsCondition(req.getQueryExpression())), req.getOrderByProperties())
                .build();
    }

    public static CDSQuery buildInlineCountQuery(String entityName, String keyName) {
        return new CDSSelectQueryBuilder(entityName)
                .count(keyName)
                .build();
    }

    public static CDSQuery buildInlineCountFilteredQuery(String entityName, String keyName, Expression filterExpression) {
        return new CDSSelectQueryBuilder(entityName)
                .count(keyName)
                .where(ExpressionParser.parseAsCondition(filterExpression))
                .build();
    }

    private static CDSSelectQueryBuilder.OrderByBuilder handleOrderByFiltered(CDSSelectQueryBuilder.WhereBuilder whereBuilder, List<OrderByExpression> orderByExpressions) {
        OrderByExpression firstExpression = orderByExpressions.get(0);
        orderByExpressions.remove(0);

        CDSSelectQueryBuilder.OrderByBuilder result = whereBuilder.orderBy(firstExpression.getOrderByProperty(), firstExpression.isDescending());

        for (OrderByExpression orderByExpression : orderByExpressions) {
            result = result.orderBy(orderByExpression.getOrderByProperty(), orderByExpression.isDescending());
        }

        return result;
    }

    private static CDSSelectQueryBuilder.OrderByBuilder handleOrderBy(CDSSelectQueryBuilder.SelectColumnBuilder selectColumnBuilder, List<OrderByExpression> orderByExpressions) {
        OrderByExpression firstExpression = orderByExpressions.get(0);
        orderByExpressions.remove(0);

        CDSSelectQueryBuilder.OrderByBuilder result = selectColumnBuilder.orderBy(firstExpression.getOrderByProperty(), firstExpression.isDescending());

        for (OrderByExpression orderByExpression : orderByExpressions) {
            result = result.orderBy(orderByExpression.getOrderByProperty(), orderByExpression.isDescending());
        }

        return result;
    }
}
