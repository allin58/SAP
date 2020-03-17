using { ZGW_PPTL_MMW_SRV as Material } from '../external/csn/pptl-netweight-api';

annotate Material.MaterialWeight with {
    MaterialID @( 
        Common:{
            Label: '{i18n>MATERIAL_ID_LABEL}',
            QuickInfo: '{i18n>MATERIAL_ID_QI}',
            Text: {$value: Description}
        }
    );
    Size @( 
        Common:{
            Label: '{i18n>SIZE_LABEL}',
            QuickInfo: '{i18n>SIZE_QI}'
        }
    );
    Colour @( 
        Common:{
            Label: '{i18n>COLOUR_LABEL}',
            QuickInfo: '{i18n>COLOUR_QI}'
        }
    );
    Status @( 
        Common:{
            Label: '{i18n>STATUS_LABEL}',
            QuickInfo: '{i18n>STATUS_QI}'
        }
    );
    Value @( 
        Common:{
            Label: '{i18n>VALUE_LABEL}',
            QuickInfo: '{i18n>VALUE_QI}',
            Unit: {$value: Unit}
        }
    );  

}
annotate Material.MaterialWeight with @(
    UI: {
        SelectionFields: [
            MaterialID, Status
        ],
    
        LineItem: [
		        {$Type: 'UI.DataField', Value: MaterialID, Importance: #Medium},
                {$Type: 'UI.DataField', Value: Colour, Importance: #Medium},
                {$Type: 'UI.DataField', Value: Status, Importance: #Medium},
                {$Type: 'UI.DataField', Value: Size, Importance: #Medium},
                {$Type: 'UI.DataField', Value: Value, Importance: #Medium}
		    ]
    }
);