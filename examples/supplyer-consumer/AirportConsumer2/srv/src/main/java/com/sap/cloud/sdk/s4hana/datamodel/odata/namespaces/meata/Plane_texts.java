/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.google.common.collect.Maps;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.sap.cloud.sdk.s4hana.connectivity.ErpConfigContext;
import com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ODataField;
import com.sap.cloud.sdk.s4hana.datamodel.odata.annotation.Key;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.VdmEntity;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.field.Plane_textsField;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.selectable.Plane_textsSelectable;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService;
import com.sap.cloud.sdk.typeconverter.TypeConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;


/**
 * <p>Original entity name from the Odata EDM: <b>Plane_texts</b></p>
 * 
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(doNotUseGetters = true, callSuper = true)
@EqualsAndHashCode(doNotUseGetters = true, callSuper = true)
@JsonAdapter(com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ODataVdmEntityAdapterFactory.class)
public class Plane_texts
    extends VdmEntity<Plane_texts>
{

    /**
     * Selector for all available fields of Plane_texts.
     * 
     */
    public final static Plane_textsSelectable ALL_FIELDS = new Plane_textsSelectable() {


        @Nonnull
        @Override
        public String getFieldName() {
            return "*";
        }

        @Nonnull
        @Override
        public List<String> getSelections() {
            return Collections.singletonList("*");
        }

    }
    ;
    /**
     * (Key Field) Constraints: Not nullable, Maximum length: 5 <p>Original property name from the Odata EDM: <b>locale</b></p>
     * 
     * @return
     *     The locale contained in this entity.
     */
    @Key
    @SerializedName("locale")
    @JsonProperty("locale")
    @Nullable
    @ODataField(odataName = "locale")
    private String locale;
    /**
     * Use with available fluent helpers to apply the <b>locale</b> field to query operations.
     * 
     */
    public final static Plane_textsField<String> LOCALE = new Plane_textsField<String>("locale");
    /**
     * (Key Field) Constraints: Not nullable<p>Original property name from the Odata EDM: <b>ID</b></p>
     * 
     * @return
     *     The iD contained in this entity.
     */
    @Key
    @SerializedName("ID")
    @JsonProperty("ID")
    @Nullable
    @ODataField(odataName = "ID")
    private Integer iD;
    /**
     * Use with available fluent helpers to apply the <b>ID</b> field to query operations.
     * 
     */
    public final static Plane_textsField<Integer> ID = new Plane_textsField<Integer>("ID");
    /**
     * Constraints: Not nullable, Maximum length: 1111 <p>Original property name from the Odata EDM: <b>descr</b></p>
     * 
     * @return
     *     The descr contained in this entity.
     */
    @SerializedName("descr")
    @JsonProperty("descr")
    @Nullable
    @ODataField(odataName = "descr")
    private String descr;
    /**
     * Use with available fluent helpers to apply the <b>descr</b> field to query operations.
     * 
     */
    public final static Plane_textsField<String> DESCR = new Plane_textsField<String>("descr");

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public Class<Plane_texts> getType() {
        return Plane_texts.class;
    }

    /**
     * (Key Field) Constraints: Not nullable, Maximum length: 5 <p>Original property name from the Odata EDM: <b>locale</b></p>
     * 
     * @param locale
     *     The locale to set.
     */
    public void setLocale(
        @Nullable
        final String locale) {
        rememberChangedField("locale", this.locale);
        this.locale = locale;
    }

    /**
     * (Key Field) Constraints: Not nullable<p>Original property name from the Odata EDM: <b>ID</b></p>
     * 
     * @param iD
     *     The iD to set.
     */
    public void setID(
        @Nullable
        final Integer iD) {
        rememberChangedField("ID", this.iD);
        this.iD = iD;
    }

    /**
     * Constraints: Not nullable, Maximum length: 1111 <p>Original property name from the Odata EDM: <b>descr</b></p>
     * 
     * @param descr
     *     The descr to set.
     */
    public void setDescr(
        @Nullable
        final String descr) {
        rememberChangedField("descr", this.descr);
        this.descr = descr;
    }

    @Override
    protected String getEntityCollection() {
        return "Plane_texts";
    }

    @Nonnull
    @Override
    protected Map<String, Object> getKey() {
        final Map<String, Object> result = Maps.newHashMap();
        result.put("locale", getLocale());
        result.put("ID", getID());
        return result;
    }

    @Nonnull
    @Override
    protected Map<String, Object> toMapOfFields() {
        final Map<String, Object> values = super.toMapOfFields();
        values.put("locale", getLocale());
        values.put("ID", getID());
        values.put("descr", getDescr());
        return values;
    }

    @Override
    protected void fromMap(final Map<String, Object> inputValues) {
        final Map<String, Object> values = Maps.newHashMap(inputValues);
        // simple properties
        {
            if (values.containsKey("locale")) {
                final Object value = values.remove("locale");
                if ((value == null)||(!value.equals(getLocale()))) {
                    setLocale(((String) value));
                }
            }
            if (values.containsKey("ID")) {
                final Object value = values.remove("ID");
                if ((value == null)||(!value.equals(getID()))) {
                    setID(((Integer) value));
                }
            }
            if (values.containsKey("descr")) {
                final Object value = values.remove("descr");
                if ((value == null)||(!value.equals(getDescr()))) {
                    setDescr(((String) value));
                }
            }
        }
        // structured properties
        {
        }
        // navigation properties
        {
        }
        super.fromMap(values);
    }

    /**
     * Use with available fluent helpers to apply an extension field to query operations.
     * 
     * @param fieldName
     *     The name of the extension field as returned by the OData service.
     * @param <T>
     *     The type of the extension field when performing value comparisons.
     * @param fieldType
     *     The Java type to use for the extension field when performing value comparisons.
     * @return
     *     A representation of an extension field from this entity.
     */
    @Nonnull
    public static<T >Plane_textsField<T> field(
        @Nonnull
        final String fieldName,
        @Nonnull
        final Class<T> fieldType) {
        return new Plane_textsField<T>(fieldName);
    }

    /**
     * Use with available fluent helpers to apply an extension field to query operations.
     * 
     * @param typeConverter
     *     A TypeConverter<T, DomainT> instance whose first generic type matches the Java type of the field
     * @param fieldName
     *     The name of the extension field as returned by the OData service.
     * @param <T>
     *     The type of the extension field when performing value comparisons.
     * @param <DomainT>
     *     The type of the extension field as returned by the OData service.
     * @return
     *     A representation of an extension field from this entity, holding a reference to the given TypeConverter.
     */
    @Nonnull
    public static<T,DomainT >Plane_textsField<T> field(
        @Nonnull
        final String fieldName,
        @Nonnull
        final TypeConverter<T, DomainT> typeConverter) {
        return new Plane_textsField<T>(fieldName, typeConverter);
    }

    @Override
    @Nullable
    public ErpConfigContext getErpConfigContext() {
        return super.getErpConfigContext();
    }

    /**
     * 
     * @deprecated
     *     Use {@link #attachToService(String, ErpConfigContext)} instead.
     */
    @Override
    @Deprecated
    public void setErpConfigContext(
        @Nullable
        final ErpConfigContext erpConfigContext) {
        super.setErpConfigContext(erpConfigContext);
    }

    @Override
    protected void setServicePathForFetch(
        @Nullable
        final String servicePathForFetch) {
        super.setServicePathForFetch(servicePathForFetch);
    }

    @Override
    public void attachToService(
        @Nullable
        final String servicePath,
        @Nullable
        final ErpConfigContext configContext) {
        super.attachToService(servicePath, configContext);
    }

    @Override
    protected String getDefaultServicePath() {
        return MeataService.DEFAULT_SERVICE_PATH;
    }

}
