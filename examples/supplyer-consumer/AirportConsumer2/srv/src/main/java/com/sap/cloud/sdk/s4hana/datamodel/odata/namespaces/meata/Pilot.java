/*
 * Copyright (c) 2020 SAP SE or an SAP affiliate company. All rights reserved.
 */

/*
 * Generated by OData VDM code generator of SAP Cloud SDK in version 2.28.0
 */

package com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.google.common.collect.Maps;
import com.google.gson.annotations.JsonAdapter;
import com.google.gson.annotations.SerializedName;
import com.sap.cloud.sdk.s4hana.connectivity.ErpConfigContext;
import com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ODataField;
import com.sap.cloud.sdk.s4hana.datamodel.odata.annotation.Key;
import com.sap.cloud.sdk.s4hana.datamodel.odata.helper.VdmEntity;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.field.PilotField;
import com.sap.cloud.sdk.s4hana.datamodel.odata.namespaces.meata.selectable.PilotSelectable;
import com.sap.cloud.sdk.s4hana.datamodel.odata.services.MeataService;
import com.sap.cloud.sdk.typeconverter.TypeConverter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;


/**
 * <p>Original entity name from the Odata EDM: <b>Pilot</b></p>
 * 
 */
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@ToString(doNotUseGetters = true, callSuper = true)
@EqualsAndHashCode(doNotUseGetters = true, callSuper = true)
@JsonAdapter(com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ODataVdmEntityAdapterFactory.class)
public class Pilot
    extends VdmEntity<Pilot>
{

    /**
     * Selector for all available fields of Pilot.
     * 
     */
    public final static PilotSelectable ALL_FIELDS = new PilotSelectable() {


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
     * Constraints: none<p>Original property name from the Odata EDM: <b>modifiedAt</b></p>
     * 
     * @return
     *     The modifiedAt contained in this entity.
     */
    @SerializedName("modifiedAt")
    @JsonProperty("modifiedAt")
    @Nullable
    @JsonSerialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonZonedDateTimeSerializer.class)
    @JsonDeserialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonZonedDateTimeDeserializer.class)
    @JsonAdapter(com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ZonedDateTimeAdapter.class)
    @ODataField(odataName = "modifiedAt", converter = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ZonedDateTimeCalendarConverter.class)
    private ZonedDateTime modifiedAt;
    /**
     * Use with available fluent helpers to apply the <b>modifiedAt</b> field to query operations.
     * 
     */
    public final static PilotField<ZonedDateTime> MODIFIED_AT = new PilotField<ZonedDateTime>("modifiedAt");
    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>createdAt</b></p>
     * 
     * @return
     *     The createdAt contained in this entity.
     */
    @SerializedName("createdAt")
    @JsonProperty("createdAt")
    @Nullable
    @JsonSerialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonZonedDateTimeSerializer.class)
    @JsonDeserialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonZonedDateTimeDeserializer.class)
    @JsonAdapter(com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ZonedDateTimeAdapter.class)
    @ODataField(odataName = "createdAt", converter = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.ZonedDateTimeCalendarConverter.class)
    private ZonedDateTime createdAt;
    /**
     * Use with available fluent helpers to apply the <b>createdAt</b> field to query operations.
     * 
     */
    public final static PilotField<ZonedDateTime> CREATED_AT = new PilotField<ZonedDateTime>("createdAt");
    /**
     * Constraints: Not nullable, Maximum length: 255 <p>Original property name from the Odata EDM: <b>createdBy</b></p>
     * 
     * @return
     *     The createdBy contained in this entity.
     */
    @SerializedName("createdBy")
    @JsonProperty("createdBy")
    @Nullable
    @ODataField(odataName = "createdBy")
    private String createdBy;
    /**
     * Use with available fluent helpers to apply the <b>createdBy</b> field to query operations.
     * 
     */
    public final static PilotField<String> CREATED_BY = new PilotField<String>("createdBy");
    /**
     * Constraints: Not nullable, Maximum length: 255 <p>Original property name from the Odata EDM: <b>modifiedBy</b></p>
     * 
     * @return
     *     The modifiedBy contained in this entity.
     */
    @SerializedName("modifiedBy")
    @JsonProperty("modifiedBy")
    @Nullable
    @ODataField(odataName = "modifiedBy")
    private String modifiedBy;
    /**
     * Use with available fluent helpers to apply the <b>modifiedBy</b> field to query operations.
     * 
     */
    public final static PilotField<String> MODIFIED_BY = new PilotField<String>("modifiedBy");
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
    public final static PilotField<Integer> ID = new PilotField<Integer>("ID");
    /**
     * Constraints: Not nullable, Maximum length: 111 <p>Original property name from the Odata EDM: <b>name</b></p>
     * 
     * @return
     *     The name contained in this entity.
     */
    @SerializedName("name")
    @JsonProperty("name")
    @Nullable
    @ODataField(odataName = "name")
    private String name;
    /**
     * Use with available fluent helpers to apply the <b>name</b> field to query operations.
     * 
     */
    public final static PilotField<String> NAME = new PilotField<String>("name");
    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>dateOfBirth</b></p>
     * 
     * @return
     *     The dateOfBirth contained in this entity.
     */
    @SerializedName("dateOfBirth")
    @JsonProperty("dateOfBirth")
    @Nullable
    @JsonSerialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonLocalDateTimeSerializer.class)
    @JsonDeserialize(using = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.JacksonLocalDateTimeDeserializer.class)
    @JsonAdapter(com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.LocalDateTimeAdapter.class)
    @ODataField(odataName = "dateOfBirth", converter = com.sap.cloud.sdk.s4hana.datamodel.odata.adapter.LocalDateTimeCalendarConverter.class)
    private LocalDateTime dateOfBirth;
    /**
     * Use with available fluent helpers to apply the <b>dateOfBirth</b> field to query operations.
     * 
     */
    public final static PilotField<LocalDateTime> DATE_OF_BIRTH = new PilotField<LocalDateTime>("dateOfBirth");
    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>placeOfBirth</b></p>
     * 
     * @return
     *     The placeOfBirth contained in this entity.
     */
    @SerializedName("placeOfBirth")
    @JsonProperty("placeOfBirth")
    @Nullable
    @ODataField(odataName = "placeOfBirth")
    private String placeOfBirth;
    /**
     * Use with available fluent helpers to apply the <b>placeOfBirth</b> field to query operations.
     * 
     */
    public final static PilotField<String> PLACE_OF_BIRTH = new PilotField<String>("placeOfBirth");

    /**
     * {@inheritDoc}
     * 
     */
    @Nonnull
    @Override
    public Class<Pilot> getType() {
        return Pilot.class;
    }

    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>modifiedAt</b></p>
     * 
     * @param modifiedAt
     *     The modifiedAt to set.
     */
    public void setModifiedAt(
        @Nullable
        final ZonedDateTime modifiedAt) {
        rememberChangedField("modifiedAt", this.modifiedAt);
        this.modifiedAt = modifiedAt;
    }

    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>createdAt</b></p>
     * 
     * @param createdAt
     *     The createdAt to set.
     */
    public void setCreatedAt(
        @Nullable
        final ZonedDateTime createdAt) {
        rememberChangedField("createdAt", this.createdAt);
        this.createdAt = createdAt;
    }

    /**
     * Constraints: Not nullable, Maximum length: 255 <p>Original property name from the Odata EDM: <b>createdBy</b></p>
     * 
     * @param createdBy
     *     The createdBy to set.
     */
    public void setCreatedBy(
        @Nullable
        final String createdBy) {
        rememberChangedField("createdBy", this.createdBy);
        this.createdBy = createdBy;
    }

    /**
     * Constraints: Not nullable, Maximum length: 255 <p>Original property name from the Odata EDM: <b>modifiedBy</b></p>
     * 
     * @param modifiedBy
     *     The modifiedBy to set.
     */
    public void setModifiedBy(
        @Nullable
        final String modifiedBy) {
        rememberChangedField("modifiedBy", this.modifiedBy);
        this.modifiedBy = modifiedBy;
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
     * Constraints: Not nullable, Maximum length: 111 <p>Original property name from the Odata EDM: <b>name</b></p>
     * 
     * @param name
     *     The name to set.
     */
    public void setName(
        @Nullable
        final String name) {
        rememberChangedField("name", this.name);
        this.name = name;
    }

    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>dateOfBirth</b></p>
     * 
     * @param dateOfBirth
     *     The dateOfBirth to set.
     */
    public void setDateOfBirth(
        @Nullable
        final LocalDateTime dateOfBirth) {
        rememberChangedField("dateOfBirth", this.dateOfBirth);
        this.dateOfBirth = dateOfBirth;
    }

    /**
     * Constraints: none<p>Original property name from the Odata EDM: <b>placeOfBirth</b></p>
     * 
     * @param placeOfBirth
     *     The placeOfBirth to set.
     */
    public void setPlaceOfBirth(
        @Nullable
        final String placeOfBirth) {
        rememberChangedField("placeOfBirth", this.placeOfBirth);
        this.placeOfBirth = placeOfBirth;
    }

    @Override
    protected String getEntityCollection() {
        return "Pilot";
    }

    @Nonnull
    @Override
    protected Map<String, Object> getKey() {
        final Map<String, Object> result = Maps.newHashMap();
        result.put("ID", getID());
        return result;
    }

    @Nonnull
    @Override
    protected Map<String, Object> toMapOfFields() {
        final Map<String, Object> values = super.toMapOfFields();
        values.put("modifiedAt", getModifiedAt());
        values.put("createdAt", getCreatedAt());
        values.put("createdBy", getCreatedBy());
        values.put("modifiedBy", getModifiedBy());
        values.put("ID", getID());
        values.put("name", getName());
        values.put("dateOfBirth", getDateOfBirth());
        values.put("placeOfBirth", getPlaceOfBirth());
        return values;
    }

    @Override
    protected void fromMap(final Map<String, Object> inputValues) {
        final Map<String, Object> values = Maps.newHashMap(inputValues);
        // simple properties
        {
            if (values.containsKey("modifiedAt")) {
                final Object value = values.remove("modifiedAt");
                if ((value == null)||(!value.equals(getModifiedAt()))) {
                    setModifiedAt(((ZonedDateTime) value));
                }
            }
            if (values.containsKey("createdAt")) {
                final Object value = values.remove("createdAt");
                if ((value == null)||(!value.equals(getCreatedAt()))) {
                    setCreatedAt(((ZonedDateTime) value));
                }
            }
            if (values.containsKey("createdBy")) {
                final Object value = values.remove("createdBy");
                if ((value == null)||(!value.equals(getCreatedBy()))) {
                    setCreatedBy(((String) value));
                }
            }
            if (values.containsKey("modifiedBy")) {
                final Object value = values.remove("modifiedBy");
                if ((value == null)||(!value.equals(getModifiedBy()))) {
                    setModifiedBy(((String) value));
                }
            }
            if (values.containsKey("ID")) {
                final Object value = values.remove("ID");
                if ((value == null)||(!value.equals(getID()))) {
                    setID(((Integer) value));
                }
            }
            if (values.containsKey("name")) {
                final Object value = values.remove("name");
                if ((value == null)||(!value.equals(getName()))) {
                    setName(((String) value));
                }
            }
            if (values.containsKey("dateOfBirth")) {
                final Object value = values.remove("dateOfBirth");
                if ((value == null)||(!value.equals(getDateOfBirth()))) {
                    setDateOfBirth(((LocalDateTime) value));
                }
            }
            if (values.containsKey("placeOfBirth")) {
                final Object value = values.remove("placeOfBirth");
                if ((value == null)||(!value.equals(getPlaceOfBirth()))) {
                    setPlaceOfBirth(((String) value));
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
    public static<T >PilotField<T> field(
        @Nonnull
        final String fieldName,
        @Nonnull
        final Class<T> fieldType) {
        return new PilotField<T>(fieldName);
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
    public static<T,DomainT >PilotField<T> field(
        @Nonnull
        final String fieldName,
        @Nonnull
        final TypeConverter<T, DomainT> typeConverter) {
        return new PilotField<T>(fieldName, typeConverter);
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
