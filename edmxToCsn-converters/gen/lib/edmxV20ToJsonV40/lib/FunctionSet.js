'use strict';

const TypeConverter = require('./TypeConverter');
const Element = require('./Element');
const Utils = require('./Utils');

const ASYNC = 'ASYNC'; // Namespace used for async processing functions

// Supported XML/OData namespaces
const ATOM = 'http://www.w3.org/2005/Atom';
const EDMX_V2 = 'http://schemas.microsoft.com/ado/2007/06/edmx';
const EDMX_V4 = 'http://docs.oasis-open.org/odata/ns/edmx';
const META = 'http://schemas.microsoft.com/ado/2007/08/dataservices/metadata';
const EDM_2007_05 = 'http://schemas.microsoft.com/ado/2007/05/edm';
const EDM_2008_09 = 'http://schemas.microsoft.com/ado/2008/09/edm'; // Ok
const SAP = 'http://www.sap.com/Protocols/SAPData'; // eslint-disable-line no-internal-info

// Supported vocabulary
const VOC_CORE = {
    alias: 'Core',
    url: 'http://docs.oasis-open.org/odata/odata/v4.0/cs02/vocabularies/Org.OData.Core.V1.xml',
    namespace: 'Org.OData.Core.V1.xml'
};

const VOC_SAP_COMMON = {
    alias: 'Common',
    url: 'com.sap.vocabularies.Common.v1',
    namespace: 'com.sap.vocabularies.Common.v1'
};

const VOC_SAP_COMMON_V2 = {
    alias: 'SapCommonV2',
    url: SAP,
    namespace: 'sap.SAPData'
};

const VOC_CAPABILITY = {
    alias: 'Capability',
    url: 'http://docs.oasis-open.org/odata/odata/v4.0/cs02/vocabularies/Org.OData.Capabilities.V1.xml',
    namespace: 'Org.OData.Capabilities.V1.xml'
};

/*
const VOC_MEASURE = {
    alias: 'Measure',
    url: 'http://docs.oasis-open.org/odata/odata/v4.0/cs02/vocabularies/Org.OData.Measures.V1.xml',
    namespace: 'Org.OData.Measures.V1.xml'
};
*/

const ANNOTATION_TARGETS = {
    ENTITY_TYPE: 0,
    ENTITY_SET: 1
};

const supportedRoleToMultiplicities = Utils.supportedRoleToMultiplicities;

/**
 * Holds a list of functions which convert and OData V2 XML element to and OData V4 JSON object.
 *
 * A converter function is registered per namespace and per operation. A converter function is select by using the
 * XML elements namespace and the XML element name. There are four function types while converting OData V4 XML to OData V4 JSON.
 * - 'enter' Called when entering an XML element (sax like)
 * - 'leave' Called when leaving an XML element (sax like)
 * - 'async' Called if a element is processed asynchronously from the TaskProcessor
 * - 'merge' Called after a element is processed asynchronously on the parent elements recursively.
 *
 * Rules for converter functions:
 * - this. can be used
 * - enter, leave and merge functions are called synchronous with an {@link Element} holding the data to be converted as input parameter
 * - call element.setTarget(...) to pass the converted structure
 * - converter function SHALL only change this own element
 * - async functions are called asynchronous with an {@link Element} holding the data to be converted as input parameter and a callback
 * - async functions must explicitly set an element to finished or requeue it
 * - enter, leave and async functions can call callAgain on the element to queue the element for asynchronous processing by the task
 *   processor and the appropriate converter function will be called later on
 * - on enter and leave ideally all sub elements can be processed and merged into the own target. This allows freeing the XML data and the
 *   sub element early.
 * - XML elements not resulting in exactly one JSON object are just put into the store while parsing. The other XML elements which requires
 *   this may later access them.
 */
class FunctionSet {
    /**
     * Constructor
     * @param {MetadataConverterV2} converter TypeConverter to be used if referenced OData metadata documents need to be parsed
     * @param {string} fileTag Tag used to distinguish the root metadata document form referenced documents. Referenced documents use
     * the referenced namespace as tag. For example aliases are stored per tag. (Since ODataV4s Reference xml element is also supported,
     * aliases can not stored per schema.
     * @param {DataStore} store Store used to collect schemas, aliases and associations and other objects which are required at several
     * locations while parsing. The store holds also the elements list which require asynchronous processing because the referenced metadata is
     * loaded asynchronous.
     * @param {Object} options Options
     * @param {Object} options.logger A logger instance
     * @param {string} options.functionPostfix Postfix added to a name of a function import if the corresponding function is created
     */
    constructor(converter, fileTag, store, options) {
        this._converter = converter;
        this._fileTag = fileTag;
        this._store = store;
        this._logger = options.logger;
        this._utils = new Utils(store);
        this._typeConverter = new TypeConverter();
        this._postfixForGeneratedFunctions = options.functionPostfix || 'ForFunctionImport';

        // Used prefixes
        // _enter
        // _leave
        // _async
        // _merge
        this._xmlEvents = {
            [ASYNC]: {
                asyncNavigationProperty: 'asyncNavigationProperty',
                asyncEntitySet: 'asyncEntitySet',
                asyncAssociationSet: 'asyncAssociationSet',
                asyncFunctionFromFunctionImport: 'asyncFunctionFromFunctionImport',
                asyncProcessXmlContent: 'asyncProcessXmlContent'
            },
            [ATOM]: {
                leavelink: 'leaveAtomLink'
            },
            [EDMX_V4]: {
                enterEdmx: 'enterEdmxV4',
                leaveReference: 'leaveV4Reference',
                leaveInclude: 'leaveV4Include',
                leaveAnnotation: 'leaveV4Annotation'
            },
            [EDMX_V2]: {
                enterEdmx: 'enterEdmx',
                leaveEdmx: 'leaveEdmx',
                mergeEdmx: 'mergeEdmx',
                leaveDataServices: 'leaveDataServices'
            },
            [META]: {},
            [EDM_2007_05]: {
                enterSchema: 'enterSchema',
                leaveSchema: 'leaveSchema',
                mergeSchema: 'mergeSchema',
                leaveUsing: 'leaveUsing',
                leaveEntityType: 'leaveEntityType',
                leaveComplexType: 'leaveComplexType',
                leaveProperty: 'leaveProperty',
                leavePropertyRef: 'leavePropertyRef',
                leaveKey: 'leaveKey',
                leaveNavigationProperty: 'leaveNavigationProperty',
                leaveEnd: 'leaveEnd',
                leavePrincipal: 'leavePrincipal',
                leaveDependent: 'leaveDependent',
                leaveOnDelete: 'leaveOnDelete',
                leaveAssociation: 'leaveAssociation',
                leaveEntitySet: 'leaveEntitySet',
                leaveAssociationSet: 'leaveAssociationSet',
                leaveParameter: 'leaveParameter',
                leaveFunctionImport: 'leaveFunctionImport',
                leaveFunction: 'leaveFunction',
                leaveReturnType: 'leaveReturnType',
                leaveTypeRef: 'leaveTypeRef',
                leaveEntityContainer: 'leaveEntityContainer',
                leaveReferentialConstraint: 'leaveReferentialConstraint',
                leaveDocumentation: 'leaveDocumentation',
                leaveSummary: 'leaveSummary',
                leaveLongDescription: 'leaveLongDescription'

            },
            [EDM_2008_09]: {
                enterSchema: 'enterSchema',
                leaveSchema: 'leaveSchema',
                mergeSchema: 'mergeSchema',
                leaveUsing: 'leaveUsing',
                leaveEntityType: 'leaveEntityType',
                leaveComplexType: 'leaveComplexType',
                leaveProperty: 'leaveProperty',
                leavePropertyRef: 'leavePropertyRef',
                leaveKey: 'leaveKey',
                leaveNavigationProperty: 'leaveNavigationProperty',
                leaveEnd: 'leaveEnd',
                leavePrincipal: 'leavePrincipal',
                leaveDependent: 'leaveDependent',
                leaveOnDelete: 'leaveOnDelete',
                leaveAssociation: 'leaveAssociation',
                leaveEntitySet: 'leaveEntitySet',
                leaveAssociationSet: 'leaveAssociationSet',
                leaveParameter: 'leaveParameter',
                leaveFunctionImport: 'leaveFunctionImport',
                leaveFunction: 'leaveFunction',
                leaveReturnType: 'leaveReturnType',
                leaveTypeRef: 'leaveTypeRef',
                leaveEntityContainer: 'leaveEntityContainer',
                leaveReferentialConstraint: 'leaveReferentialConstraint',
                leaveDocumentation: 'leaveDocumentation',
                leaveSummary: 'leaveSummary',
                leaveLongDescription: 'leaveLongDescription'

            },
            [SAP]: {}
        };

        this._currentEdmx = null;
        this._currentSchema = null;
        this._currentSchemaNameSpace = null;
    }

    /**
     * Returns the function name defined by name and namespace
     * @param {string} ns Namespace
     * @param {string} name Name
     * @returns {?string} Name of the function
     */
    getFunction(ns, name) {
        if (!this._xmlEvents[ns]) return null;
        return this._xmlEvents[ns][name];
    }

    /**
     * Load the file given by an element.
     * @param {Element} element Element whose data is the filename
     * @param {Function} cb Callback to be called after the file has been loaded and parsed
     */
    asyncProcessXmlContent(element, cb) {
        this._converter.processXmlContent(element.getData(), (error) => {
            if (error) return cb(error);
            element.finished();
            return cb();
        });
    }

    /**
     * Process closing Edmx xml start tag
     * @param {XmlElement} element Element to be processed
     */
    enterEdmx(element) {
        this._currentEdmx = element;
    }

    /**
     * Process Edmx xml end tag
     * Sub elements of elem contain
     * - the OData V2 schema
     * - the $references created by xml element using
     * - the OData V4 $references
     * @param {XmlElement} element Element to be processed
     */
    leaveEdmx(element) {
        const root = {};
        element.setTarget(root);
        element.mergeSubTargetsToOwnTargetAttribute('$Reference', EDMX_V4 + '.Reference', {});
        element.mergeSubTargetsToOwnTargetAttribute('$Reference', EDM_2008_09 + '.Using', {});

        this._currentEdmx = null; // left Edmx closing xml end tag, not processing an Edmx anymore
        this.mergeEdmx(element);
    }

    /**
     * Merge sub elements of the Edmx element
     * @param {XmlElement} element Element to be processed
     */
    mergeEdmx(element) {
        const subElements = element.getSubElements();
        if (subElements.size !== 1) {
            // all valid other element are processed synchronous in leaveEdmx
            // only DataServices xml element is allowed here
            throw new Error('Only one edmx:DataServices element supported');
        }

        const firstSubElement = subElements.values().next().value;
        if (!firstSubElement._finished) return;
        if (firstSubElement.getFunctionName() !== 'DataServices') {
            throw new Error('Only one edmx:DataServices element supported');
        }

        // Copy attributes of DataServices into own target
        const target = firstSubElement.getTarget();
        subElements.delete(firstSubElement);


        const root = element.getTarget();
        for (const key of Object.keys(target)) {
            root[key] = target[key];
        }

        // Add referenced vocabularies here in merge step to guarantee that all tasks of
        // sub elements which may add a vocabularies are finished
        const usedVocabularies = this._store.getUsedVocabularies(this._fileTag);
        if (usedVocabularies.size) {
            if (!root.$Reference) root.$Reference = {};

            const ref = root.$Reference;
            for (let vocabulary of usedVocabularies) {
                if (!ref[vocabulary.url]) {
                    ref[vocabulary.url] = {
                        $Include: [{ $Alias: vocabulary.alias, $Namespace: vocabulary.namespace }]
                    };
                }
            }
        }

        element.finished();
    }


    /**
     * Process Edmx V4 xml start tag
     * Used as simple error check if the input file format is V4
     * TODO: maybe removed if V4 annotations are supported
     */
    enterEdmxV4() {
        const message = 'Parsing XML element "Edmx" from V4 namespace ' + EDMX_V4 + ' is not supported';
        this.logError(message);
        throw new Error(message);
    }

    /**
     * Process DataServices xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveDataServices(element) {
        const dsv = element.getNsAttribute(META, 'DataServiceVersion');
        const entityContainer = this._store.getDefaultEntityContainer(this._fileTag);

        let dataService = {};

        if (dsv) dataService.$Version = '4.0';
        if (entityContainer) dataService.$EntityContainer = entityContainer;

        element.setTarget(dataService);
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process Schema xml start tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    enterSchema(element, xmlData) {
        if (!xmlData.attributes.Namespace) throw new Error('Namespace for schema missing. ' + element.getPos());

        // set current schema, will be cleared in leaveSchema
        this._currentSchema = element;
        this._currentSchemaNameSpace = xmlData.attributes.Namespace.value;
        this._store.addSchemaElementAndAlias(element, this._currentSchemaNameSpace,
            xmlData.attributes.Alias, this._fileTag);
    }

    /**
     * Process Schema xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveSchema(element, xmlData) {
        const attributes = xmlData.attributes;

        let schema = { ['@' + VOC_SAP_COMMON.alias + '.OriginalProtocolVersion']: '2.0' };
        this._store.addVocabulary(this._fileTag, VOC_SAP_COMMON);
        if (attributes.alias) schema.$Alias = attributes.alias;

        this._utils.checkSAPAnnotationPassValue(this._fileTag, element, 'schema-version', VOC_CORE,
            'SchemaVersion', schema);

        element.setTarget(schema, attributes.Namespace.value);
        element.mergeSubTargetsToOwnTargetAttribute('@Core.Links', ATOM + '.link', []);
        element.mergeSubElementsTargetsToOwnTarget(Utils.collisionResolverArrayToArray);

        // clean up state
        this._currentSchema = null;
        this._currentSchemaNameSpace = null;
    }

    /**
     * Merge Schema element
     * @param {XmlElement} element Element to be processed
     */
    mergeSchema(element) {
        element.mergeSubTargetsToOwnTargetAttribute('$References', EDM_2008_09 + '.Using');
        element.mergeSubTargetsToOwnTargetAttribute('@Core.Links', ATOM + '.link', []);
        element.mergeSubElementsTargetsToOwnTarget(Utils.collisionResolverArrayToArray);
        element.finishedAsync();
    }

    /**
     * Process Reference xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveV4Reference(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Uri) {
            throw new Error('Missing Uri attribute for OData V4 xml element Reference' + element.getPos());
        }

        let reference = { $Include: [] };

        element.setTarget(reference, attributes.Uri.value);
        element.mergeSubTargetsToOwnTargetAttribute('$Include', EDMX_V4 + '.Include');

        for (let include of reference.$Include) {
            this._store.addRefFromNamespaceToUri(this._fileTag, include.$Namespace, attributes.Uri.value);
        }

        element.detach();
        this._currentEdmx.addSubElement(element);
        element.finished();
    }

    /**
     * Process Annotation xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveV4Annotation(element) {
        if (this._logger) {
            this._logger.warn('OData V4 Annotations not supported yet');
        }
        element.detach();
    }

    /**
     * Process Include xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveV4Include(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Namespace) {
            throw new Error('Missing Namespace attribute for OData V4 xml element Include'
                + element.getPos());
        }

        const schemaRef = { $Namespace: attributes.Namespace.value };

        const alias = attributes.Alias;
        if (alias) {
            schemaRef.$Alias = alias.value;
            this._store.addFileReference(this._fileTag, alias.value, attributes.Namespace.value);
        }

        element.setTarget(schemaRef);
    }

    /**
     * Process xml Using end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveUsing(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Namespace) {
            throw new Error('Missing Namespace attribute for xml element End' + element.getPos());
        }

        let reference = { $Include: [] };
        let schemaRef = { $Namespace: attributes.Namespace.value };

        const alias = attributes.Alias;
        if (alias) {
            schemaRef.$Alias = alias.value;
            this._store.addSchemaByReference(this._currentSchemaNameSpace, alias.value, attributes.Namespace.value);
        } else {
            this._store.addSchemaByReference(this._currentSchemaNameSpace, null, attributes.Namespace.value);
        }

        reference.$Include.push(schemaRef);

        element.setTarget(reference, attributes.Namespace.value); // use namespace as key, because OData V2 hasn't a uri

        // reassign element to Edmx element
        element.move(this._currentEdmx);
        this._currentEdmx.addSubElement(element);
    }

    /**
     * Process xml EntityType end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveEntityType(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Name) throw new Error('Missing Name attribute for xml element PropertyRef');

        let entityType = { $Kind: 'EntityType' };

        if (attributes.BaseType) entityType.$BaseType = attributes.BaseType.value; // namespace qualified or alias qualified name

        // CSDL 6.2 The value of $Abstract is one of the Boolean literals true or false. Absence of the member means false.
        if (attributes.Abstract) entityType.$Abstract = true;
        // CSDL 6.3 The value of $OpenType is one of the Boolean literals true or false. Absence of the member means false.
        if (attributes.Opentype) entityType.$OpenType = true;
        let addInfo = { passThroughAnnotations: [] };

        this._utils.moveStoredSAPAnnotationPath(ANNOTATION_TARGETS.ENTITY_TYPE, addInfo.passThroughAnnotations);

        element.setTarget(entityType, attributes.Name.value);
        element.setAdditionalInfo(addInfo);
        element.mergeSubElementsTargetsToOwnTarget();

        // make available for all elements
        this._store.addEntityType(this._currentSchemaNameSpace, attributes.Name.value, element);
    }

    /**
     * Process xml Key end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveKey(element) {
        const ret = [];
        element.setTarget(ret, '$Key');
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process PropertyRef xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leavePropertyRef(element, xmlData) {
        if (!xmlData.attributes.Name) {
            throw new Error('Missing Name attribute for xml element PropertyRef ' + element.getPos());
        }
        element.setTarget(xmlData.attributes.Name.value);
    }

    /**
     * Process Property xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveProperty(element, xmlData) {
        const attributes = xmlData.attributes;
        let property = {};

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element Property ' + element.getPos());
        if (!attributes.Type) throw new Error('Missing Type attribute for xml element Property ' + element.getPos());

        element.setTarget(property, attributes.Name.value);
        this._typeConverter.convertV2TypeToV4(element, attributes);

        let aCreatable = element.getNsAttribute(SAP, 'creatable');
        let aUpdatable = element.getNsAttribute(SAP, 'updatable');
        if (!aCreatable || aCreatable === '1' || aCreatable === 'true') {
            if (aUpdatable && (aUpdatable === '0' || aUpdatable === 'false')) {
                this._utils.addSAPAnnotation(this._fileTag, VOC_CORE, 'Immutable', property, true);
            }
        } else if (aUpdatable && (aUpdatable === '0' || aUpdatable === 'false')) {
            this._utils.addSAPAnnotation(this._fileTag, VOC_CORE, 'Computed', property, true);
        }

        let aReqInFilter = element.getNsAttribute(SAP, 'required-in-filter');
        if (aReqInFilter && (aReqInFilter === '1' || aReqInFilter === 'true')) {
            this._store.addAnnotation(ANNOTATION_TARGETS.ENTITY_TYPE, VOC_CAPABILITY,
                'FilterRestrictions/RequiredProperties[]', null, attributes.Name.value);
        }

        let aFilterable = element.getNsAttribute(SAP, 'filterable');
        if (aFilterable && (aFilterable === '0' || aFilterable === 'false')) {
            this._store.addAnnotation(ANNOTATION_TARGETS.ENTITY_TYPE, VOC_CAPABILITY,
                'FilterRestrictions/NonFilterableProperties[]', null, attributes.Name.value);
        }

        let aFilterRestriction = element.getNsAttribute(SAP, 'filter-restriction');
        if (aFilterRestriction) {
            const filterExpressionRestriction = {};

            if (aFilterRestriction === 'single-value') {
                Utils.createJsonFromPath('AllowedExpressions', filterExpressionRestriction, 'SingleValue');
            }
            if (aFilterRestriction === 'multi-value') {
                Utils.createJsonFromPath('AllowedExpressions', filterExpressionRestriction, 'MultiValue');
            }
            if (aFilterRestriction === 'interval') {
                Utils.createJsonFromPath('AllowedExpressions', filterExpressionRestriction, 'MultiRange');
            }
            if (filterExpressionRestriction.AllowedExpressions) {
                filterExpressionRestriction.Property = attributes.Name.value;
                this._store.addAnnotation(ANNOTATION_TARGETS.ENTITY_TYPE, VOC_CAPABILITY,
                    'FilterRestrictions/FilterExpressionRestrictions[]', null, filterExpressionRestriction);
            }
        }


        const aSortable = element.getNsAttribute(SAP, 'sortable');
        if (aSortable && (aSortable === '0' || aSortable === 'false')) {
            this._store.addAnnotation(ANNOTATION_TARGETS.ENTITY_TYPE, VOC_CAPABILITY,
                'SortRestrictions/NonSortableProperties[]', null, attributes.Name.value);
        }

        const aDisplayFormat = element.getNsAttribute(SAP, 'display-format');
        if (aDisplayFormat) {
            if (aDisplayFormat === 'NonNegative') {
                this._utils.addSAPAnnotation(this._fileTag, VOC_SAP_COMMON, 'IsDigitSequence', property, 'true');
            } else if (aDisplayFormat === 'UpperCase') {
                this._utils.addSAPAnnotation(this._fileTag, VOC_SAP_COMMON, 'IsUpperCase', property, 'true');
            }
        }

        // ignore a.Collation
        // ignore a.FixedLength
        Utils.checkMaxLength(property, attributes);
        Utils.checkNullable(property, attributes);
        Utils.checkPrecision(property, attributes);
        Utils.checkScale(property, attributes);
        Utils.checkUnicode(property, attributes);
        // check default value
        this._typeConverter.convertV2TypeToV4(element, attributes);

        element.mergeSubElementsTargetsToOwnTarget();

        if (attributes.ConcurrencyMode === 'fixed') {
            property['@Core.OptimisticConcurrency'] = attributes.Name;
        }
    }


    /**
     * Check if the association is loaded and set multiplicity information if yes.
     * If the association is not loaded yet, then call again later
     * @param {XmlElement} element Element containing the association information
     * @param {string} schemaName Namespace of the schema
     * @private
     */
    _processNavigationProperty(element, schemaName) {
        const data = element.getData();
        const attributes = data.attributes;
        const relationship = attributes.Relationship.value;

        // first check if the required associations is loaded, if not --> process by element asynchronous
        const associationElement = this._store.getAssociation(schemaName, relationship);
        if (!associationElement) {
            if (element.getCallCount() > 1) {
                throw new Error('Association ' + relationship + ' not found' + element.getPos());
            }
            element.callAgain(schemaName, this._store);
            return;
        }

        // check if $ReferentialConstraint can be set
        const association = associationElement.getTarget();
        let navigationProperty = element.getTarget();
        if (!association._navPropElem.includes(element)) {
            // fill _navProp which is consumed by the association processors
            association._navPropElem.push(element);
            if (association._navPropElem.length === 2) { // both navigation properties can be linked
                this.addRefConstraintToNavigationProperty(association);
            }
        }

        const toRole = association._roles[attributes.ToRole.value];
        if (!toRole) {
            throw new Error('Role ' + attributes.ToRole.value + ' not defined on Association '
                + relationship + ' ' + element.getPos());
        }
        association._rolesNavFrom[attributes.FromRole.value] = attributes.Name.value;

        // check if $Type and $Collection can be set
        const multiplicityInfo = supportedRoleToMultiplicities[toRole.multiplicity];
        if (!multiplicityInfo) throw new Error('Wrong multiplicity value' + toRole.multiplicity + element.getPos());

        navigationProperty.$Type = toRole.type;
        if (multiplicityInfo.$Collection === true) {
            navigationProperty.$Collection = multiplicityInfo.$Collection;
        }
        if (toRole.OnDelete) navigationProperty.$OnDelete = toRole.OnDelete; // V2 supports only 'Cascade' and 'None'

        element.mergeSubElementsTargetsToOwnTarget();
        element.finished();
    }

    /**
     * Process NavigationProperty xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveNavigationProperty(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) {
            throw new Error('Missing Name attribute for xml element NavigationProperty' + element.getPos());
        }
        if (!attributes.ToRole) {
            throw new Error('Missing ToRole attribute for xml element NavigationProperty' + element.getPos());
        }
        if (!attributes.FromRole) {
            throw new Error('Missing FromRole attribute for xml element NavigationProperty' + element.getPos());
        }

        let navigationProperty = { $Kind: 'NavigationProperty' };
        element.setTarget(navigationProperty, attributes.Name.value);

        let cs = element.getNsAttribute(SAP, 'filterable');
        if (cs && (cs === '0' || cs === 'false')) {
            this._store.addAnnotation(ANNOTATION_TARGETS.ENTITY_TYPE, VOC_CAPABILITY,
                'NavigationRestrictions/RestrictedProperties/FilterRestrictions/NonFilterableProperties[]',
                attributes.Name.value, attributes.Name.value);
        }

        this._processNavigationProperty(element, this._currentSchemaNameSpace);
    }

    /**
     * Process NavigationProperty asynchronously
     * @param {XmlElement} element Element to be processed
     * @param {Function} callback
     */
    asyncNavigationProperty(element, callback) {
        try {
            this._processNavigationProperty(element, element.getNamespace());
            callback();
        } catch (error) {
            callback(error);
        }
    }

    /**
     * Process ComplexType xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveComplexType(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element ComplexType');

        let complexType = { $Kind: 'ComplexType' };

        if (attributes.BaseType) complexType.$BaseType = attributes.BaseType; // namespace qualified or alis qualified name

        // CSDL 6.2 The value of $Abstract is one of the Boolean literals true or false. Absence of the member means false.
        if (attributes.Abstract) complexType.$Abstract = true;
        // CSDL 6.3 The value of $OpenType is one of the Boolean literals true or false. Absence of the member means false.
        if (attributes.OpenType) complexType.$OpenType = true;

        element.setTarget(complexType, attributes.Name.value);
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Add referential constrains to navigation properties
     * @param {Object} association The association linking the wo navigation properties
     */
    addRefConstraintToNavigationProperty(association) {
        const e0 = association._navPropElem[0];
        const e1 = association._navPropElem[1];
        e0.getTarget().$Partner = association._navPropElem[1]._targetKey;
        e1.getTarget().$Partner = association._navPropElem[0]._targetKey;

        const refConst = association._referentialConstraints;

        if (refConst) {
            for (let i = 0; i < 2; i++) {
                const navPropElement = association._navPropElem[i];
                const navPropElemTarget = navPropElement.getTarget();
                navPropElemTarget.$ReferentialConstraint = {};
                const left = refConst[navPropElement.getData().attributes.FromRole.value];
                const right = refConst[navPropElement.getData().attributes.ToRole.value];

                if (left.length !== right.length) {
                    throw new Error('Error references for principal and dependent must be equal'
                        + navPropElement.getPos());
                }

                for (let ii = 0; ii < left.length; ii++) {
                    navPropElemTarget.$ReferentialConstraint[left[ii]] = right[ii];
                }
            }
        }
    }

    /**
     * Process Association xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveAssociation(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element Association' + element.getPos());

        // The V2 association objects have no equivalent in V4, the association element are stored in the store
        // for later usage, e.g. when navigation properties are being processed
        const association = {
            _name: xmlData.attributes.Name,
            _roles: {},
            _rolesNavFrom: {},
            _referentialConstraints: null,
            _navPropElem: [], // used when creating the navigation property to have a path from the association to the navigation property this path is used late to fill the $partner
            _disable$Partner: false
        };

        element.setTarget(association);
        element.mergeSubTargetsToOwnTargetAttribute('_roles', EDM_2008_09 + '.End');
        element.mergeSubTargetsToOwnTargetAttribute('_referentialConstraints', EDM_2008_09 + '.ReferentialConstraint');
        element.mergeSubElementsTargetsToOwnTarget();

        this._store.addAssociation(this._currentSchemaNameSpace, attributes.Name.value, element);
        element.detach();  // remove from element tree, element is just stored for late access
    }


    /**
     * Process EntityContainer xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveEntityContainer(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element EntityContainer');

        const container = { $Kind: 'EntityContainer' };

        const isDefaultEntityContainer = element.getNsAttribute(META, 'IsDefaultEntityContainer');

        this._store.setDefaultEntityContainer(this._fileTag, this._currentSchemaNameSpace + '.'
            + xmlData.attributes.Name.value, isDefaultEntityContainer);


        element.setTarget(container, xmlData.attributes.Name.value);
        element.mergeSubElementsTargetsToOwnTarget();
    }


    /**
     * Process an entity set, if required data is missing the processing will be rescheduled
     * @param {XmlElement} element Element to be processed
     * @param {string} schemaName
     */
    _processEntitySet(element, schemaName) {
        let target = element.getTarget();
        const entityType = target.$Type;

        let entityTypeElem = this._store.getEntityType(schemaName, entityType);
        if (!entityTypeElem) {
            try {
                element.callAgain(schemaName, this._store);
                return;
            } catch (e) {
                throw new Error('Error processing ' + element.getTargetKey() + ': Entitytype '
                    + entityType + ' not found' + element.getPos());
            }
        }

        // check if all required entity types and base entity types are loaded yet
        while (entityTypeElem !== null) {
            const typeTarget = entityTypeElem.getTarget();
            if (typeTarget.$BaseType) {
                entityTypeElem = this._store.getEntityType(schemaName, entityTypeElem.getTarget().$BaseType); // get baseEntityTypeElem

                if (!entityTypeElem) {
                    element.callAgain(schemaName, this._store);
                    return;
                }
            } else {
                entityTypeElem = null;
            }
        }

        // process annotation of entity type and base entity type
        entityTypeElem = this._store.getEntityType(schemaName, entityType);
        while (entityTypeElem !== null) {
            const addInfo = entityTypeElem.getAddInfo();

            this._utils.applyStoredSAPAnnotationPath(this._fileTag, addInfo.passThroughAnnotations, target);

            const typeTarget = entityTypeElem.getTarget();
            if (typeTarget.$BaseType) {
                entityTypeElem = this._store.getEntityType(schemaName, entityTypeElem.getTarget().$BaseType); // get baseEntityTypeElem
            } else {
                entityTypeElem = null;
            }
        }

        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process an entity set asynchronously
     * @param {XmlElement} element Element to be processed
     * @param {Function} callback
     */
    asyncEntitySet(element, callback) {
        try {
            this._processEntitySet(element, element.getNamespace());
            callback();
        } catch (error) {
            callback(error);
        }
    }

    /**
     * Process EntitySet xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveEntitySet(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element EntitySet' + element.getPos());
        if (!attributes.EntityType) {
            throw new Error('Missing EntityType attribute for xml element EntitySet'
                + element.getPos());
        }

        const ret = {
            $Collection: true,
            $Type: attributes.EntityType.value
        };

        let cs = element.getNsAttribute(SAP, 'creatable');
        if (cs && (cs === '0' || cs === 'false')) {
            if (!ret['@Capabilities.InsertRestrictions']) ret['@Capabilities.InsertRestrictions'] = {};
            ret['@Capabilities.InsertRestrictions'].Insertable = false;
            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        cs = element.getNsAttribute(SAP, 'updatable');
        if (cs && (cs === '0' || cs === 'false')) {
            if (!ret['@Capabilities.UpdateRestrictions']) ret['@Capabilities.UpdateRestrictions'] = {};
            ret['@Capabilities.UpdateRestrictions'].Updatable = false;
            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        cs = element.getNsAttribute(SAP, 'deletable');
        if (cs && (cs === '0' || cs === 'false')) {
            if (!ret['@Capabilities.DeleteRestrictions']) ret['@Capabilities.DeleteRestrictions'] = {};
            ret['@Capabilities.DeleteRestrictions'].Deletable = false;
            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        cs = element.getNsAttribute(SAP, 'updatable-path');
        if (cs) {
            this._utils.addSAPAnnotationPath(this._fileTag, VOC_CAPABILITY,
                'UpdateRestrictions/Updatable/Path', ret, cs);
        }

        cs = element.getNsAttribute(SAP, 'deletable-path');
        if (cs) {
            this._utils.addSAPAnnotationPath(this._fileTag, VOC_CAPABILITY,
                'UpdateRestrictions/Deletable/Path', ret, cs);
        }

        cs = element.getNsAttribute(SAP, 'searchable');
        if (cs && (cs === '0' || cs === 'false')) {
            this._utils.addSAPAnnotationPath(this._fileTag, VOC_CAPABILITY,
                'SearchRestrictions/Searchable', ret, false);
        }

        cs = element.getNsAttribute(SAP, 'pageable');
        if (cs && (cs === '0' || cs === 'false')) {
            this._utils.addSAPAnnotation(this._fileTag, VOC_CAPABILITY, 'TopSupported', ret, false);
            this._utils.addSAPAnnotation(this._fileTag, VOC_CAPABILITY, 'SkipSupported', ret, false);
        }

        cs = element.getNsAttribute(SAP, 'topable');
        if (cs && (cs === '0' || cs === 'false')) {
            this._utils.addSAPAnnotation(this._fileTag, VOC_CAPABILITY, 'TopSupported', ret, false);
        }

        cs = element.getNsAttribute(SAP, 'addressable');
        if (cs && (cs === '0' || cs === 'false')) {
            ret.$IncludeInServiceDocument = false;
        }

        cs = element.getNsAttribute(SAP, 'requires-filter');
        if (cs && (cs === '1' || cs === 'true')) {
            this._utils.addSAPAnnotationPath(this._fileTag, VOC_CAPABILITY,
                'FilterRestrictions/RequiresFilter', ret, false);
        }

        element.setTarget(ret, attributes.Name.value);
        this._processEntitySet(element, this._currentSchemaNameSpace);
    }

    /**
     * Process AssociationSet
     * @param {XmlElement} element Element to be processed
     * @param {string} schemaName Schema name space currently processed
     * @returns {undefined}
     */
    _processAssociationSet(element, schemaName) {
        const store = this._store;

        // 1. First resolve the following SPEC information
        // The EntitySet for a particular <AssociationSet> <End>, MUST contain either the same
        // EntityType as the related <End> EntityType on the <Assocation> element, or an EntityType
        // derived from that EntityType.

        const associationSet = element.getTarget();
        const end0 = associationSet.ends[0];
        const end1 = associationSet.ends[1];

        const schemaElem = store.getSchemaElement(schemaName);
        const schema = schemaElem ? schemaElem.getTarget() : null;
        if (!schema) return element.callAgain(schemaName, this._store);

        const container = Utils.getContainer(schema);
        if (!container) return element.callAgain(schemaName, this._store);

        const entitySet0 = container[end0.entitySet];
        const entitySet1 = container[end1.entitySet];
        if (!entitySet0) {
            return element.callAgain(schemaName, this._store, 'Entityset ' + end0.entitySet + ' not found');
        }
        if (!entitySet1) {
            return element.callAgain(schemaName, this._store, 'Entityset ' + end1.entitySet + ' not found');
        }

        const associationName = associationSet.association.value;
        const associationElement = store.getAssociation(schemaName, associationName);
        if (!associationElement) return element.callAgain(schemaName, this._store);

        const association = associationElement.getTarget();

        if ((Object.keys(association._rolesNavFrom).length !== 2)
            && (element.getCallCount() <= 4)) {
            return element.callAgain(schemaName, this._store);
        }


        // check Annotation @Capabilities.InsertRestrictions
        let cs = element.getNsAttribute(SAP, 'creatable');
        if (cs && (cs === '0' || cs === 'false')) {
            for (let end of associationSet.ends) {
                const entitySet = container[end.entitySet];
                const navProperty = association._rolesNavFrom[end.role];
                if (navProperty) {
                    if (!entitySet['@Capabilities.InsertRestrictions']) {
                        entitySet['@Capabilities.InsertRestrictions'] = {};
                    }
                    if (!entitySet['@Capabilities.InsertRestrictions'].NonInsertableNavigationProperties) {
                        entitySet['@Capabilities.InsertRestrictions'].NonInsertableNavigationProperties = [];
                    }
                    entitySet['@Capabilities.InsertRestrictions'].NonInsertableNavigationProperties.push(navProperty);
                } else {
                    // there is no navigation property defined with role (end.role) in the referenced entity set
                }
            }

            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        cs = element.getNsAttribute(SAP, 'updatable');
        if (cs && (cs === '0' || cs === 'false')) {
            for (let end of associationSet.ends) {
                const entitySet = container[end.entitySet];
                const navProperty = association._rolesNavFrom[end.role];
                if (navProperty) {
                    if (!entitySet['@Capabilities.UpdateRestrictions']) {
                        entitySet['@Capabilities.UpdateRestrictions'] = {};
                    }
                    if (!entitySet['@Capabilities.UpdateRestrictions'].NonUpdatableNavigationProperties) {
                        entitySet['@Capabilities.UpdateRestrictions'].NonUpdatableNavigationProperties = [];
                    }
                    entitySet['@Capabilities.UpdateRestrictions'].NonUpdatableNavigationProperties.push(navProperty);
                } else {
                    // there is no navigation property defined with role (end.role) in the referenced entity set
                }
            }

            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        cs = element.getNsAttribute(SAP, 'deletable');
        if (cs && (cs === '0' || cs === 'false')) {
            for (let end of associationSet.ends) {
                const entitySet = container[end.entitySet];
                const navProperty = association._rolesNavFrom[end.role];
                if (navProperty) {
                    if (!entitySet['@Capabilities.DeleteRestrictions']) {
                        entitySet['@Capabilities.DeleteRestrictions'] = {};
                    }
                    if (!entitySet['@Capabilities.DeleteRestrictions'].NonDeletableNavigationProperties) {
                        entitySet['@Capabilities.DeleteRestrictions'].NonDeletableNavigationProperties = [];
                    }
                    entitySet['@Capabilities.DeleteRestrictions'].NonDeletableNavigationProperties.push(navProperty);
                } else {
                    // there is no navigation property defined with role (end.role) in the referenced entity set
                }
            }

            this._store.addVocabulary(this._fileTag, VOC_CAPABILITY);
        }

        if (association._rolesNavFrom[end0.role]) {
            entitySet0.$NavigationPropertyBinding = { [association._rolesNavFrom[end0.role]]: end1.entitySet };
        }
        if (association._rolesNavFrom[end1.role]) {
            entitySet1.$NavigationPropertyBinding = { [association._rolesNavFrom[end1.role]]: end0.entitySet };
        }
        return undefined;
    }

    /**
     * Processes an association set asynchronous
     * @param {XmlElement} element Element to be processed
     * @param {Function} callback Callback
     */
    asyncAssociationSet(element, callback) {
        try {
            this._processAssociationSet(element, element.getNamespace());
            callback();
        } catch (error) {
            callback(error);
        }
    }

    /**
     * Process AssociationSet xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveAssociationSet(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Association) {
            throw new Error('Missing Association attribute for xml element AssociationSet' + element.getPos());
        }

        const associationSetInfo = {
            association: attributes.Association,
            ends: []
        };
        element.setTarget(associationSetInfo);
        element.mergeSubTargetsToOwnTargetAttribute('ends');

        this._processAssociationSet(element, this._currentSchemaNameSpace);

        element.detach();
    }

    /**
     * Process Parameter xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    processFunctionImportParameter(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element Parameter' + element.getPos());
        if (!attributes.Type) throw new Error('Missing Type attribute for xml element Parameter' + element.getPos());

        const parameter = { $Name: attributes.Name.value };
        if (attributes.Type.value !== 'Edm.String') parameter.$Type = attributes.Type.value;

        Utils.checkScale(parameter, attributes);
        Utils.checkPrecision(parameter, attributes);
        Utils.checkMaxLength(parameter, attributes);

        if (attributes.Mode && attributes.Mode.value !== 'In') {
            throw new Error('Out and In/Out parameters are not allowed in OData V4' + element.getPos());
        }

        element.setTarget(parameter);
    }

    /**
     * Process Parameter xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    processFunctionParameter(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Name) throw new Error('Missing Name attribute for xml element Parameter' + element.getPos());

        const parameter = { $Name: attributes.Name.value };

        // Variant 1 ---> <Parameter Name="Age" Type="Edm.Int32"/>
        if (attributes.Type) {
            parameter.$Type = attributes.Type.value;
        }

        element.setTarget(parameter, parameter.$Name);

        // Variant II with sub xml element --> <TypeRef Name="Model.Person" />
        // is realised with mergeSubElementsTargetsToOwnTarget
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process Parameter xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveParameter(element, xmlData) {
        if (element.getParentElement().getFQN() === 'http://schemas.microsoft.com/ado/2008/09/edm.FunctionImport') {
            this.processFunctionImportParameter(element, xmlData);
        } else {
            this.processFunctionParameter(element, xmlData);
        }
    }

    /**
     * Process TypeRef xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveTypeRef(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) throw new Error('Missing Name attribute for xml element Parameter' + element.getPos());

        const typeRef = attributes.Name.value;

        Utils.checkScale(typeRef, attributes);
        Utils.checkPrecision(typeRef, attributes);
        Utils.checkMaxLength(typeRef, attributes);

        if (attributes.Mode && attributes.Mode.value !== 'In') {
            throw new Error('Out and In/Out parameters are not allowed in OData V4' + element.getPos());
        }

        element.setTarget(typeRef, '$Type');
    }


    /**
     * During conversion the V2 function import is split into a V4 function definition and
     * a V4 function import. Here the function import is the target and goes into the
     * V4 entity container and the function definition is temporarily stored and
     * later added to the V4 json EDM_2008_09.
     * @param {XmlElement} element Element containing the association information
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveFunctionImport(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) {
            throw new Error('Missing Name attribute for xml element FunctionImport' + element.getPos());
        }

        let _newGeneratedFunctionData = {
            name: attributes.Name.value + this._postfixForGeneratedFunctions,
            returnType: attributes.ReturnType
        };

        let functionImport = {
            $Function: this._currentSchemaNameSpace + '.' + _newGeneratedFunctionData.name
        };

        // Check for bound action
        const actionFor = element.getNsAttribute(SAP, 'action-for');
        if (actionFor) {
            this._utils.checkSAPAnnotationPassValue(this._fileTag, element, 'action-for', VOC_SAP_COMMON_V2,
                'action-for', functionImport);
        }

        const functionElement = new Element(ASYNC, 'FunctionFromFunctionImport', _newGeneratedFunctionData);
        this._currentSchema.addSubElement(functionElement);
        functionElement.setParentElement(this._currentSchema);

        // Move parameters from V2 function import element to V4 function async elements $Parameters
        element.moveSubElementsToElement(functionElement, EDM_2008_09 + '.Parameter');

        // because functionElement has been created artificially it will not processed in the
        // parse step, hence add it to the async loop.
        functionElement.callAgain(this._currentSchemaNameSpace, this._store);

        element.setTarget(functionImport, attributes.Name.value);
    }

    /**
     * @param {XmlElement} element Element containing the association information
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveReturnType(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Type) {
            throw new Error('Missing Type attribute for xml element Function' + element.getPos());
        }

        const returnType = {
            $Type: attributes.Type.value
        };

        element.setTarget(returnType, '$ReturnType');
    }

    /**
     * @param {XmlElement} element Element containing the association information
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveFunction(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Name) {
            throw new Error('Missing Name attribute for xml element Function' + element.getPos());
        }

        const func = {
            $Kind: 'Function'
        };

        // Variant I --> <Function Name="GetAge" ReturnType="Edm.Int32">
        if (attributes.ReturnType) {
            func.$ReturnType = attributes.ReturnType.value;
        }

        element.setTarget([func], attributes.Name.value);
        element.mergeSubElementsTargetsToTargetAttribute(func, '$Parameter', EDM_2008_09 + '.Parameter', []);

        // Variant II with sub xml element --> <ReturnType Type="Edm.Int32" />
        // is realised with mergeSubElementsTargetsToOwnTarget
        element.mergeSubElementsTargetsTo(func);
    }

    /**
     * Process a Function which is artificially created from a FunctionImport asynchronously
     * @param {XmlElement} element Element to be processed
     * @param {Function} cb Callback
     */
    asyncFunctionFromFunctionImport(element, cb) {
        const data = element.getData();

        if (!data.name) throw new Error('Missing Name attribute for xml generated Function' + element.getPos());

        const func = {
            $Kind: 'Function'
        };

        if (data.returnType) {
            let rt = data.returnType.value;
            func.$ReturnType = {};
            if (rt.startsWith('Collection(')) {
                func.$ReturnType.$Collection = true;
                rt = rt.substring('Collection('.length, rt.length - 1);
            }

            if (rt !== 'Edm.String') func.$ReturnType.$Type = rt;
        }

        element.setTarget([func], data.name);
        element.mergeSubElementsTargetsToTargetAttribute(func, '$Parameter', EDM_2008_09 + '.Parameter', []);
        cb();
    }


    /**
     * Process OnDelete xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveOnDelete(element, xmlData) {
        element.setTarget(xmlData.attributes.Action.value, 'OnDelete');
    }


    /**
     * Process a associations End xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     * @private
     */
    _leaveEndAssociation(element, xmlData) {
        const attributes = xmlData.attributes;
        if (!attributes.Type) throw new Error('Missing Type attribute for xml element End' + element.getPos());

        if (!attributes.Role) throw new Error('Missing Role attribute for xml element End' + element.getPos());

        if (!attributes.Multiplicity) {
            throw new Error('Missing Multiplicity attribute for xml element End' + element.getPos());
        }

        const endInformation = {
            type: attributes.Type.value,
            multiplicity: attributes.Multiplicity.value
        };

        // special handling for on OnDelete sub xml element
        const subElements = element.getSubElements();
        if (subElements.size > 0) {
            for (const n of subElements) {
                if (!n._finished) continue;
                if (n._targetKey === 'OnDelete') {
                    endInformation[n._targetKey] = n._target;
                }
                subElements.delete(n); // delete on orig list
            }
        }
        element.setTarget(endInformation, attributes.Role.value);
    }

    /**
     * Process a associationSet End xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     * @private
     */
    _leaveEndAssociationSet(element, xmlData) {
        const attributes = xmlData.attributes;

        if (!attributes.Role) throw new Error('Missing Role attribute for xml element End' + element.getPos());
        if (!attributes.EntitySet) {
            throw new Error('Missing EntitySet attribute for xml element End' + element.getPos());
        }

        const endInformation = {
            role: attributes.Role.value,
            entitySet: attributes.EntitySet.value
        };
        element.setTarget(endInformation);
    }

    /**
     * Process End xml end tag. A end tag can be either belong to a association or to an association set. This function
     * dispatches accordingly.
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveEnd(element, xmlData) {
        const data1 = element._parentElement.getData();
        if (data1.name === 'AssociationSet') {
            this._leaveEndAssociationSet(element, xmlData);
        } else {
            this._leaveEndAssociation(element, xmlData);
        }
    }

    /**
     * Process Principal xml end tag
     * dispatches accordingly.
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leavePrincipal(element, xmlData) {
        const attributes = xmlData.attributes;
        const _refs = [];

        if (!attributes.Role) throw new Error('Missing Type attribute for xml element Principal' + element.getPos());

        element.setTarget(_refs, attributes.Role.value);
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process Dependent xml end tag
     * @param {XmlElement} element Element to be processed
     * @param {Object} xmlData SAX data of the xml node
     */
    leaveDependent(element, xmlData) {
        const attributes = xmlData.attributes;
        const _refs = [];

        if (!attributes.Role) throw new Error('Missing Type attribute for xml element Dependent' + element.getPos());

        element.setTarget(_refs, attributes.Role.value);
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Process ReferentialConstraint xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveReferentialConstraint(element) {
        const refRoleInformation = {};

        element.setTarget(refRoleInformation);
        element.mergeSubElementsTargetsToOwnTarget();
    }

    /**
     * Converts and atom:link element into
     * <atom:link rel="self" href="https://.../$metadata" xmlns:atom="http://www.w3.org/2005/Atom"/>
     * <atom:link rel="latest-version" href="https://.../$metadata" xmlns:atom="http://www.w3.org/2005/Atom"/>
     * @param {Element} element
     * @param {Object} data
     */
    leaveAtomLink(element, data) {
        const attributes = data.attributes;
        if (!attributes.rel) {
            throw new Error('Missing rel attribute for xml element in atom namespace' + element.getPos());
        }
        if (!attributes.href) {
            throw new Error('Missing href attribute for xml element in atom namespace' + element.getPos());
        }
        const record = {
            rel: attributes.rel.value,
            href: attributes.href.value
        };

        element.setTarget(record);
    }


    /**
     * Process ReferentialConstraint xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveDocumentation(element) {
        const target = {};
        element.setTarget(target);

        // just move annotations upwards
        element.mergeSubElementsTargetViaKeys();

        // (annotation-)keys and values are automatically merged into parent object
        element.setIsAnnotationContainer();


    }

    /**
     * Process LongDescription xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveLongDescription(element) {
        const target = {};

        this._utils.addSAPAnnotation(this._fileTag, VOC_CORE, 'Description', target, element.getXmlContent());
        element.setTarget(target);

    }

    /**
     * Process Summary xml end tag
     * @param {XmlElement} element Element to be processed
     */
    leaveSummary(element) {
        const target = {};

        this._utils.addSAPAnnotation(this._fileTag, VOC_CORE, 'Summary', target, element.getXmlContent());
        element.setTarget(target);
    }

    /**
     * Log error information if logger is available
     * @param {string} info
     */
    logError(info) {
        if (this._logger) {
            this._logger.error(info);
        }
    }
}

module.exports = FunctionSet;
