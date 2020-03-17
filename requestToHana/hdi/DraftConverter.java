package com.burberry.pptl.odata.ibn.manage.hdi;

import com.burberry.pptl.odata.ibn.manage.service.extension.ibnbox.InboundDeliveryBoxExtension;
import com.burberry.pptl.odata.ibn.manage.service.extension.ibnheader.InboundDeliveryHeadExtension;
import com.burberry.pptl.odata.ibn.manage.service.extension.ibnitem.InboundDeliveryItemExtension;
import com.burberry.pptl.odata.ibn.manage.service.extension.ibnitemsize.InboundDeliveryItemSizeExtension;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Constants;
import com.burberry.pptl.odata.ibn.manage.service.helpers.Dictionary;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNBoxDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNHeaderDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemDraft;
import com.burberry.pptl.odata.ibn.manage.vdm.namespaces.pptldraft.IBNItemSizeDraft;

import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class DraftConverter {

    public static InboundDeliveryHeadExtension deepConvertFromIBNHeaderDraft(IBNHeaderDraft headerDraft) {
        InboundDeliveryHeadExtension extension = new InboundDeliveryHeadExtension();
        extension.populateBaseFields(headerDraft.toMapOfFields());
        extension.setCountryOfOriginID(Dictionary.getInstance().getCountryId(extension.getCountryOfOrigin()));
        extension.setCollectionCountryID(Dictionary.getInstance().getCountryId(extension.getCollectionCountry()));
        extension.setDestCountryID(Dictionary.getInstance().getCountryId(extension.getDestCountryName()));
        extension.setMethodOfTransportationID(Dictionary.getInstance().getMethodOfTransportationId(extension.getMethodOfTransportation()));
        extension.setStatus(headerDraft.getStatus());
        extension.setCreatedAt(headerDraft.getCreatedAt().atZone(ZoneOffset.UTC).toInstant().toEpochMilli());
        extension.setAWBNumber(headerDraft.getAWBNumber());
        extension.setHasBoxes(headerDraft.getBoxesIfPresent().isPresent());
        extension.setIsDraft(true);
        extension.setIBNBoxExtensions(convertAllIBNBoxDrafts(headerDraft.getBoxesIfPresent().orElse(Collections.emptyList())));
        extension.setIBNItemExtensions(convertAllIBNItemDrafts(headerDraft.getItemsIfPresent().orElse(Collections.emptyList())));

        return extension;
    }

    public static InboundDeliveryHeadExtension convertFromIBNHeaderDraft(IBNHeaderDraft headerDraft) {
        InboundDeliveryHeadExtension extension = new InboundDeliveryHeadExtension();
        extension.populateBaseFields(headerDraft.toMapOfFields());
        extension.setIbnId(headerDraft.getIbnId());
        extension.setCountryOfOriginID(Dictionary.getInstance().getCountryId(extension.getCountryOfOrigin()));
        extension.setCollectionCountryID(Dictionary.getInstance().getCountryId(extension.getCollectionCountry()));
        extension.setDestCountryID(Dictionary.getInstance().getCountryId(extension.getDestCountryName()));
        extension.setMethodOfTransportationID(Dictionary.getInstance().getMethodOfTransportationId(extension.getMethodOfTransportation()));
        extension.setStatus(headerDraft.getStatus());
        extension.setCreatedAt(headerDraft.getCreatedAt().atZone(ZoneOffset.UTC).toInstant().toEpochMilli());
        extension.setAWBNumber(headerDraft.getAWBNumber());
        extension.setHasBoxes(headerDraft.getBoxesIfPresent().isPresent());
        extension.setIsDraft(true);

        return extension;
    }

    public static List<InboundDeliveryHeadExtension> convertAllIBNHeaderDrafts(List<IBNHeaderDraft> headerDrafts) {
        return headerDrafts
                .stream()
                .map(DraftConverter::convertFromIBNHeaderDraft)
                .collect(Collectors.toList());
    }




    public static InboundDeliveryBoxExtension convertFromIBNBoxDraft(IBNBoxDraft ibnBoxDraft) {
        InboundDeliveryBoxExtension extension = new InboundDeliveryBoxExtension();
        extension.populateBaseFields(ibnBoxDraft.toMapOfFields());
        extension.setDraftBoxId(ibnBoxDraft.getHanaBoxId());
        extension.setIbnId(ibnBoxDraft.getIbnId());
        extension.setIsDraft(true);

        return extension;
    }

    public static InboundDeliveryBoxExtension deepConvertFromIBNBoxDraft(IBNBoxDraft ibnBoxDraft) {
        InboundDeliveryBoxExtension extension = new InboundDeliveryBoxExtension();
        extension.populateBaseFields(ibnBoxDraft.toMapOfFields());
        extension.setDraftBoxId(ibnBoxDraft.getHanaBoxId());
        extension.setIbnId(ibnBoxDraft.getIbnId());
        extension.setIsDraft(true);
        extension.setIBNItemExtensions(convertAllIBNItemDrafts(ibnBoxDraft.getItemsIfPresent().orElse(Collections.emptyList())));

        return extension;
    }

    public static List<InboundDeliveryBoxExtension> convertAllIBNBoxDrafts(List<IBNBoxDraft> headerDrafts) {
        return headerDrafts
                .stream()
                .map(DraftConverter::convertFromIBNBoxDraft)
                .collect(Collectors.toList());
    }

    public static InboundDeliveryItemExtension convertFromIBNItemDraft(IBNItemDraft ibnItemDraft) {
        InboundDeliveryItemExtension extension = new InboundDeliveryItemExtension();
        extension.populateBaseFields(ibnItemDraft.toMapOfFields());
        extension.setId(ibnItemDraft.getItemId().toString());
        extension.setPONumber(Constants.NO_VALUE_STRING);
        extension.setPOItemNumber(Constants.NO_VALUE_STRING);
        extension.setIBNItemNumber(Constants.NO_VALUE_STRING);
        extension.setItemId(ibnItemDraft.getItemId());
        extension.setHasSizes(ibnItemDraft.getSizesIfPresent().isPresent());
        extension.setIsDraft(true);

        return extension;
    }

    public static InboundDeliveryItemExtension deepConvertFromIBNItemDraft(IBNItemDraft itemDraft) {
        InboundDeliveryItemExtension extension = new InboundDeliveryItemExtension();
        extension.populateBaseFields(itemDraft.toMapOfFields());
        extension.setPONumber(Constants.NO_VALUE_STRING);
        extension.setPOItemNumber(Constants.NO_VALUE_STRING);
        extension.setIBNItemNumber(Constants.NO_VALUE_STRING);
        extension.setItemId(itemDraft.getItemId());
        extension.setHasSizes(itemDraft.getSizesIfPresent().isPresent());
        extension.setIsDraft(true);
        extension.setIBNItemSizeExtensions(convertAllIBNItemSizeDrafts(itemDraft.getSizesIfPresent().orElse(Collections.emptyList())));

        return extension;
    }

    public static List<InboundDeliveryItemExtension> convertAllIBNItemDrafts(List<IBNItemDraft> itemDrafts) {
        return itemDrafts
                .stream()
                .map(DraftConverter::convertFromIBNItemDraft)
                .collect(Collectors.toList());
    }

    public static InboundDeliveryItemSizeExtension convertFromIBNItemSizeDraft(IBNItemSizeDraft ibnItemSizeDraft) {
        InboundDeliveryItemSizeExtension extension = new InboundDeliveryItemSizeExtension();
        extension.fromMap(ibnItemSizeDraft.toMapOfFields());
        extension.setIsDraft(true);

        return extension;
    }

    public static List<InboundDeliveryItemSizeExtension> convertAllIBNItemSizeDrafts(List<IBNItemSizeDraft> itemSizeDrafts) {
        return itemSizeDrafts
                .stream()
                .map(DraftConverter::convertFromIBNItemSizeDraft)
                .collect(Collectors.toList());
    }
}
