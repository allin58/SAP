'use strict';
/* eslint-disable global-require */
const vocabulariesMap = new Map([
    ['org.odata.core.v1', () => require('../../common/vocabularies/Org.OData.Core.V1.json')],
    ['org.odata.aggregation.v1', () => require('../../common/vocabularies/Org.OData.Aggregation.V1.json')],
    ['org.odata.authorization.v1', () => require('../../common/vocabularies/Org.OData.Authorization.V1.json')],
    ['org.odata.capabilities.v1', () => require('../../common/vocabularies/Org.OData.Capabilities.V1.json')],
    ['org.odata.measures.v1', () => require('../../common/vocabularies/Org.OData.Measures.V1.json')],
    ['org.odata.temporal.v1', () => require('../../common/vocabularies/Org.OData.Temporal.V1.json')],
    ['org.odata.validation.v1', () => require('../../common/vocabularies/Org.OData.Validation.V1.json')]
]);

const createCast = (value, type) => {
    return { $Cast: value, $Type: type };
};


/**
 * The MetadataConverter is responsible for executing provided Strategies. It handles occuring errors
 * also.
 *
 * @class MetadataConverter
 */
class MetadataConverter {
    /**
     * Creates an instance of MetadataConverter.
     * @param {Object} options the options object
     * @memberof MetadataConverter
     */
    constructor(options = { omit$TypeOnEdmString: true }) {
        this._options = options;
        if (options.omit$TypeOnEdmString === undefined) {
            // eslint-disable-next-line no-param-reassign
            options.omit$TypeOnEdmString = true;
        }

        this._conversion = {};
    }

    /**
     * Adds new conversion strategies. The conversion strategy is an array of {@link Strategy} which
     * will be executed by this {@link MetadataConverter}.
     *
     * @param {Array<MetadataConverter#Strategy>} strategy The chain of strategies to use
     * @returns {MetadataConverter} This instance of MetadataConverter
     * @memberof MetadataConverter
     */
    addConversion(strategy) {
        this._conversion = { strategy };
        return this;
    }

    /**
    * Filter out a property found by filter parameter
    *
    * @param {Object} input The input to start
    * @param {Function} filter The filter function. Should return false to filter a certain property
    * @returns {Object} The result without the filtered properties
    * @memberof MetadataConverter
    * @private
    */
    _filterProperties(input, filter) {
        const target = {};
        Object
            .keys(input)
            .filter(key => filter(key, input))
            .forEach((key) => {
                const value = input[key];

                if (typeof value === 'object' && !Array.isArray(value) && value != null) {
                    target[key] = this._filterProperties(value, filter);
                } else if (Array.isArray(value)) {
                    target[key] = value.map((item) => {
                        if (typeof item === 'object') {
                            return this._filterProperties(item, filter);
                        }
                        return item;
                    });
                } else {
                    target[key] = value;
                }

            });

        return target;
    }

    getOptions() {
        return this._options;
    }

    /**
     * This callback is displayed as part of the MetadataConverter class.
     * This callback is called when the metadata converter finishes the conversion or if any
     * error occurs.
     *
     * @callback MetadataConverter~executeCallback
     * @param {Error} error If an error occurs else null
     * @param {Object} result The result of the conversion
     */

    /**
     * This method executes a provided chain of {@link Strategy}s (provided through
     * {@link MetadataConverter#addConversion}) and injects the input into the first Strategy.
     * To execute a chain of Strategies the same name as used in {@link MetadataConverter#addConversion})
     * method must be used. The callback will be called on finish or on error.
     *
     * @param {any} input The input to provide into the first Strategy
     * @param {MetadataConverter~executeCallback} callback This callback will be called on finish or on error
     * @param {number} [index=0] A private variable to select the strategy
     * @returns {undefined} nothing
     * @memberof MetadataConverter
     */
    execute(input, callback, index = 0) {
        let lastResult = null;
        const strategy = this._conversion.strategy[index];
        if (strategy == null) {
            let result = input;
            if (this._options.omit$TypeOnEdmString === true) {
                result = this._filterProperties(
                    input,
                    (key, inputNode) => {
                        return !(key === '$Type' && inputNode[key] === 'Edm.String' && inputNode.$Cast === undefined);
                    }
                );
            }
            return callback(null, result, []);
        }

        try {
            strategy.execute(
                input,
                (error, result, ...args) => {
                    lastResult = result;
                    if (error) {
                        return callback(error, result, ...args);
                    }
                    return this.execute(result, callback, index + 1);
                },
                this
            );

            return undefined;
        } catch (error) {
            return callback(error, lastResult);
        }
    }

}
const ODATA_NAMESPACES = {
    v4: [
        'http://docs.oasis-open.org/odata/ns/edm',
        'http://docs.oasis-open.org/odata/ns/edmx'
    ]
};
MetadataConverter.ODATA_NAMESPACES = ODATA_NAMESPACES;
MetadataConverter.TARGETS = {
    LIBRARY: 'CS01'
};

class Emitter {
    constructor() { this._listeners = new Map(); }

    _on(listeners, name, callback) {
        if (listeners.has(name) === false) {
            listeners.set(name, []);
        }
        listeners.get(name).push(callback);
        return this;
    }

    on(name, callback) {
        return this._on(this._listeners, name, callback);
    }


    emit(name, ...args) {
        const listeners = (this._listeners.get('pre ' + name) || [])
            .concat(this._listeners.get(name) || [])
            .concat(this._listeners.get('post ' + name) || []);

        this._emit(listeners, 0, null, name === 'error', ...args);
        return this;
    }

    _emit(list, index, error, isErrorEmitting, ...args) {
        if (error != null) {
            return this.emit('error', error);
        }
        let _index = index;
        const callback = list[_index];
        if (callback != null) {
            if (isErrorEmitting === true) {
                callback(...args);
            } else {
                try {
                    callback((innerError) => {
                        this._emit(list, _index + 1, innerError, isErrorEmitting, ...args);
                    }, ...args);
                } catch (innerError) {
                    this.emit('error', innerError);
                }
            }
        }
        return this;
    }
}
MetadataConverter.Emitter = Emitter;

class Strategy extends Emitter {
    constructor(strategy, options = {}) {
        super();
        this._options = options;
        this._strategy = strategy;
        this._logger = options.logger;
    }

    setLogger(logger) { this._logger = logger; return this; }
    getLogger() { return this._logger; }

    execute(input, callback) { // callback(error, result) -> result = conversion result
        return this._strategy(input, callback);
    }
}
MetadataConverter.Strategy = Strategy;

class Expression {
    constructor(element, parentExpression, context) {
        this._element = element;
        this._parentExpression = parentExpression;
        this._stack = [];
        this._target = {};
        this._type = this.constructor.name;
        this._context = context;
        this._availableExpressions = new Map();

        if (element.attributes && element.attributes.Alias && element.attributes.Namespace) {
            context.setAlias(element.attributes.Alias, element.attributes.Namespace);
        }

        context.getLogger().debug(`Creating Expression '${this.constructor.name}'`);
    }

    static convertDefaultValue(type, value) {
        if (type === 'Edm.Boolean') return value === 'true';
        if (type === 'Edm.Binary' || type === 'Edm.String') return value;
        if (type === 'Edm.Int16' || type === 'Edm.Int32' || type === 'Edm.Byte' || type === 'Edm.SByte') {
            return parseInt(value, 10);
        }
        if (type === 'Edm.Float' || type === 'Edm.Decimal' || type === 'Edm.Single') return parseFloat(value);
        if (type === 'EnumType') {
            return value.split(' ').map((elem) => {
                const split = elem.split('/');
                if (split.length === 1) {
                    return split[0];
                }
                return split[1];
            }).join(',');
        }
        return value;
    }

    createExpressionFromAttributes(element) {
        const target = this.getContext().getConverterOptions().target;
        const isLibTarget = target === MetadataConverter.TARGETS.LIBRARY;

        const attr = element.attributes;

        if (attr.String) return attr.String;
        if (attr.Bool) return attr.Bool === 'true';

        if (attr.Binary) return createCast(attr.Binary, 'Edm.Binary');
        if (attr.Date) return createCast(attr.Date, 'Edm.Date');
        if (attr.DateTimeOffset) return createCast(attr.DateTimeOffset, 'Edm.DateTimeOffset');
        if (attr.Decimal) return createCast(attr.Decimal, 'Edm.Decimal');
        if (attr.Duration) return createCast(attr.Duration, 'Edm.Duration');
        if (attr.Float) return parseFloat(attr.Float);
        if (attr.Double) return parseFloat(attr.Double);
        if (attr.Guid) return createCast(attr.Guid, 'Edm.Guid');
        if (attr.Int) return createCast(attr.Int, 'Edm.Int64');
        if (attr.TimeOfDay) return createCast(attr.TimeOfDay, 'Edm.TimeOfDay');

        if (isLibTarget === true) {
            if (attr.AnnotationPath) {
                return { $AnnotationPath: this.resolveNamespace(attr.AnnotationPath, true) };
            }
            if (attr.PropertyPath) return { $PropertyPath: attr.PropertyPath };
            if (attr.ModelElementPath) return { $ModelElementPath: attr.ModelElementPath };
            if (attr.NavigationPropertyPath) {
                return { $NavigationPropertyPath: attr.NavigationPropertyPath };
            }
            if (attr.EnumMember) {
                return this.convertEnumMemberExpression(attr.EnumMember);
            }
        } else {
            if (attr.AnnotationPath) {
                return this.resolveNamespace(attr.AnnotationPath, true);
            }
            if (attr.PropertyPath) return attr.PropertyPath;
            if (attr.ModelElementPath) return attr.ModelElementPath;
            if (attr.NavigationPropertyPath) return attr.NavigationPropertyPath;
            if (attr.EnumMember) {
                return this.convertEnumMemberExpression(attr.EnumMember);
            }
        }


        if (attr.Path) return { $Path: attr.Path };
        if (attr.UrlRef) return { $UrlRef: attr.UrlRef };

        return null;
    }

    convertEnumMemberExpression(enumMemberStr, typeFqn) {
        let type = typeFqn;

        const result = {
            $EnumMember: enumMemberStr.split(' ').map((member) => {
                const split = member.split('/');
                if (split.length === 1) {
                    type = typeFqn;
                    return split[0];
                }

                if (type === typeFqn) {
                    type = split[0];
                }
                return split[1];

            }).join(','),
            '$EnumMember@odata.type': `#${type}`
        };

        const target = this.getContext().getConverterOptions().target;
        const isLibTarget = target === MetadataConverter.TARGETS.LIBRARY;

        if (isLibTarget === true) {
            return result;
        }
        return result.$EnumMember;
    }

    getType() { return this._type; }
    getElement() { return this._element; }
    getParentExpression() { return this._parentExpression; }
    getTarget() { return this._target; }
    setTarget(target) { this._target = target; return this; }
    getStack() { return this._stack; }
    getTargetPropertyName() { return this._targetPropertyName; }
    setTargetPropertyName(name) { this._targetPropertyName = name; return this; }
    getContext() { return this._context; }
    interpret() {
        const target = this.getTarget();
        return Object.assign(target, ...this.getStack().map(expression => expression.interpret()));
    }

    static lookupXmlNamespace(element, parentExpression, prefix, logger) {
        let currentXmlns;
        let attr = element.attributes;
        if (element.name != null) {
            if (attr) {
                if (logger) {
                    logger.debug(`Lookup namespace for element '${element.name}' with prefix '${prefix || ''}'`);
                }
                currentXmlns = prefix == null ? attr.xmlns : attr[`xmlns:${prefix}`];
                if (currentXmlns != null) {
                    return currentXmlns;
                }
            }
        }

        if (parentExpression != null) {
            return Expression.lookupXmlNamespace(
                parentExpression.getElement(), parentExpression.getParentExpression(), prefix, logger
            );
        }

        return null;
    }

    annotate(prefix = '', target, annotationExpressionResult) {
        let _target = target;
        for (const key of Object.keys(annotationExpressionResult)) {
            _target[prefix + key] = annotationExpressionResult[key];
        }
        return target;
    }

    resolveAlias(name) {
        return this.getContext().resolveAlias(name);
    }

    resolveNamespace(namespacedType, forceReplace) {
        return this.getContext().resolveNamespace(namespacedType, forceReplace);
    }

    buildTypeCollectionAndFacets(...args) {
        const target = this.getTarget();
        const element = this.getElement();
        const attribs = element.attributes;

        if (attribs == null) return;
        let realType = attribs.Type || attribs.EntityType || attribs.UnderlyingType;
        const propertyName = attribs.UnderlyingType == null ? '$Type' : '$UnderlyingType';
        if ((args.includes('$Type') || args.includes('$UnderlyingType')) && realType) {
            const omit$Type = propertyName === '$Type' && realType.indexOf('Edm.String') > -1 &&
                target.$Cast === undefined;
            if (realType.startsWith('Collection(')) {
                realType = realType.substring(11, realType.length - 1);
                target.$Collection = true;
            }

            if (omit$Type === true) {
                let current = this;
                const stack = [];
                do {
                    stack.push(current);
                    current = current.getParentExpression();
                } while (current != null);
            }
            target[propertyName] = realType;
        }

        /*
            HasStream Spec odata v 4.0:
            XML:    If no value is provided for the HasStream attribute, and no BaseType
                    attribute is specified, the value of the HasStream attribute is set to false.
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | undefined
        */
        if (args.includes('$HasStream') && attribs.HasStream === 'true') target.$HasStream = true;

        /*
            IsFlags Spec odata v 4.0:
            XML:    If no value is specified for this attribute, its value defaults to false.
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | undefined
        */
        if (args.includes('$IsFlags') && attribs.IsFlags === 'true') target.$IsFlags = true;
        if (args.includes('$Alias') && attribs.Alias) target.$Alias = attribs.Alias;
        if (args.includes('$Namespace') && attribs.Namespace) target.$Namespace = attribs.Namespace;

        if (args.includes('$BaseType') && attribs.BaseType) target.$BaseType = attribs.BaseType;
        if (args.includes('$MaxLength') && attribs.MaxLength != null && attribs.MaxLength.toLowerCase() !== 'max') {
            target.$MaxLength = parseInt(attribs.MaxLength, 10);
        }

        /*
            Scale Spec odata v 4.0:
            XML:    If no value is specified, the Scale facet defaults to zero.
            JSON:   If no value is specified, the Scale facet defaults to zero

            XML         | JSON
            -----------------------
            variable    | variable
            1-*         | 1-*
            0           | undefined
            undefined   | undefined
        */
        if (args.includes('$Scale') && (target.$Type === 'Edm.Decimal' || target.$UnderlyingType === 'Edm.Decimal')) {
            if (attribs.Scale != null) {
                if (attribs.Scale === 'variable') {
                    target.$Scale = 'variable';
                } else if (attribs.Scale !== '0') {
                    target.$Scale = parseInt(attribs.Scale, 10);
                }
            } else {
                target.$Scale = 0;
            }
        }

        /*
            Precision Spec odata v 4.0:
            XML:    For a temporal property [...] If no value is specified, the temporal property has a precision
                    of zero.
            JSON:   If no value is specified, the temporal property has a precision of zero.

            XML (Temp prop) | JSON (Temp prop)
            ----------------------------------
            1-12            | 1-12
            0               | undefined

            XML         | JSON
            -----------------------
            *           | *
            undefined   | undefined
        */

        if (args.includes('$Precision')) {
            if (attribs.Precision == null) {
                if (['Edm.Duration', 'Edm.Date', 'Edm.TimeOfDay', 'Edm.DateTimeOffset'].includes(target.$Type)) {
                    target.$Precision = 0;
                }
            } else if (target.$Precision !== '0') {
                target.$Precision = parseInt(attribs.Precision, 10);
            }
        }

        if (args.includes('$Partner') && attribs.Partner != null) target.$Partner = attribs.Partner;

        /*
            IsComposable Spec odata v 4.0:
                XML:    If no value is assigned [...], the attribute defaults to false
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | undefined
        */
        if (args.includes('$IsComposable') && attribs.IsComposable === 'true') target.$IsComposable = true;

        /*
            ContainsTarget Spec odata v 4.0:
            XML:    If no value is assigned [...], the attribute defaults to false
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | undefined
        */
        if (args.includes('$ContainsTarget') && attribs.ContainsTarget === 'true') target.$ContainsTarget = true;

        /*
            IsBound Spec odata v 4.0:
            XML:    Actions whose IsBound attribute is false or not specified are considered unbound
                    --> false
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | undefined
        */
        if (args.includes('$IsBound') && attribs.IsBound === 'true') target.$IsBound = true;

        if (args.includes('$DefaultValue') && attribs.DefaultValue !== undefined) {
            target.$DefaultValue = attribs.DefaultValue;
        }

        if (args.includes('$EntitySet') && attribs.EntitySet != null) {
            target.$EntitySet = attribs.EntitySet;
        }
        if (args.includes('$EntitySetPath') && attribs.EntitySetPath != null) {
            target.$EntitySetPath = attribs.EntitySetPath;
        }

        /*
            Nullable Spec odata v 4.0:
            XML:    If not specified, the Nullable attribute defaults to true.
            JSON:   Absence of the member means false

            XML         | JSON
            -----------------------
            true        | true
            undefined   | true
            false       | undefined
        */

        if (args.includes('$Nullable') &&
            (attribs.Nullable == null || attribs.Nullable === 'true') &&
            !(target.$Kind === 'NavigationProperty' && target.$Collection === true)) {
            target.$Nullable = true;
        }
    }


}

class EdmPrimitiveType {
    constructor(type) { this._type = type; }
    toString() { return this._type; }

    static from(typeFqn) {
        if (typeFqn.startsWith('Edm.')) return new EdmPrimitiveType(typeFqn);
        return null;
    }
}

class Named {
    constructor(edm, name, target) {
        this._edm = edm; this._name = name; this._target = target;
    }
    getTarget() { return this._target; }
    getType() {
        if (this._type) return this._type;
        const typeFqn = this._target.$Type || this._target.$UnderlyingType || 'Edm.String';
        this._type = this._edm.getEntityType(typeFqn) || this._edm.getComplexType(typeFqn) ||
            this._edm.getEnumType(typeFqn) || this._edm.getTypeDefinition(typeFqn) || EdmPrimitiveType.from(typeFqn);
        return this._type;

    }
    isCollection() { return this._target.$Collection === true; }
    setType(type) { this._type = type; return this; }
    toString() { return (this._target.$Type || this._target.$UnderlyingType || 'Edm.String'); }
    getName() { return this._name; }
}

class StructuredType extends Named {
    constructor(edm, name, fqn, target) { super(edm, name, target); this._structuredTypeFqn = fqn; }
}

class Term extends Named {
    constructor(edm, name, target) { super(edm, name, target); }
    getDefaultValue() { return this._target.$DefaultValue; }
}

class EnumType extends Named {
    constructor(edm, name, target) { super(edm, name, target); }
}

class TypeDefinition extends Named {
    constructor(edm, name, target) { super(edm, name, target); }
}

class EntityType extends StructuredType {
    constructor(edm, name, fqn, target) { super(edm, name, fqn, target); }
}

class ComplexType extends StructuredType {
    constructor(edm, name, fqn, target) { super(edm, name, fqn, target); }
}

class JsonEdm {

    constructor(csdl) {
        this._csdl = csdl;
        this._schemas = Object.keys(csdl)
            .filter(key => !['$Reference', '$Version', '$EntityContainer'].includes(key));
    }

    toFqn(aliasedName) {
        const [alias, type] = aliasedName.split('.');
        const target = Object.keys(this._csdl.$Reference)
            .map((key) => {
                return this._csdl.$Reference[key].$Include.find(item => item.$Alias === alias);
            })
            .filter(item => item != null);

        return `${target[0].$Namespace}.${type}`;
    }

    getSchemas() {
        return this._schemas;
    }

    _getNode(name, kind) {
        let _name = name;
        const targetSchema = this._schemas.find(
            schema => name.startsWith(schema) || name.startsWith(this._csdl[schema].$Alias)
        );
        if (targetSchema == null) return null;

        let target = this._csdl;
        if (name.startsWith(targetSchema)) {
            _name = name.substring(targetSchema.length + 1);
            target = target[targetSchema];
        }
        if (name.startsWith(this._csdl[targetSchema].$Alias)) {
            _name = name.substring(this._csdl[targetSchema].$Alias.length + 1);
            target = target[targetSchema];
        }

        let realName;
        _name.split('.').map(namePart => namePart.split('#')[0]).forEach((pathElem) => {
            if (target != null) {
                realName = pathElem;
                target = target[pathElem];
            }
        });

        if (kind && target && target.$Kind !== kind) return null;
        return {
            name: realName,
            target
        };
    }

    getReferenceUriForType(namespaceOrAliasWithType) {
        if (namespaceOrAliasWithType == null) return null;
        if (this._csdl.$Reference == null) return null;
        const namespaceOrAlias = namespaceOrAliasWithType.split('.').slice(0, -1).join('.');
        return Object
            .keys(this._csdl.$Reference)
            .find((refName) => {
                const ref = this._csdl.$Reference[refName];
                if (ref.$Include == null) return null;
                const result = ref.$Include.find((include) => {
                    return include.$Alias === namespaceOrAlias || include.$Namespace === namespaceOrAlias;
                });
                return result != null;
            });
    }

    getEntityType(fqn) {
        const result = this._getNode(fqn, 'EntityType');
        if (result && result.target) return new EntityType(this, result.name, fqn, result.target);
        return null;
    }

    getTypeDefinition(name) {
        const result = this._getNode(name, 'TypeDefinition');
        if (result && result.target) return new TypeDefinition(this, result.name, result.target);
        return null;
    }

    getEnumType(name) {
        const result = this._getNode(name, 'EnumType');
        if (result && result.target) return new EnumType(this, result.name, result.target);
        return null;
    }

    getComplexType(fqn) {
        const result = this._getNode(fqn, 'ComplexType');
        if (result && result.target) return new ComplexType(this, result.name, fqn, result.target);
        return null;
    }

    getTerm(name) {
        const result = this._getNode(name, 'Term');
        if (result && result.target) return new Term(this, result.name, result.target);
        return null;
    }
}

class DefaultValueConverter {

    constructor(target, currentDefaultValue, context) {
        this._target = target;
        this._currentDefaultValue = currentDefaultValue;
        this._context = context;
    }

    convert() {
        const target = this._target;
        const currentDefaultValue = this._currentDefaultValue;
        const context = this._context;

        if (currentDefaultValue == null) return null;
        if (target.$Type.startsWith('Edm.')) {
            // eslint-disable-next-line no-param-reassign
            target.$DefaultValue = Expression.convertDefaultValue(target.$Type, currentDefaultValue);
            return null;
        }
        context.on('pre finalize', (callback) => {
            context.resolveType(target.$Type).then((edmType) => {
                if (edmType instanceof TypeDefinition) {
                    // eslint-disable-next-line no-param-reassign
                    target.$DefaultValue = Expression.convertDefaultValue(
                        edmType.getType().toString(), currentDefaultValue
                    );
                    return callback();
                }
                if (edmType instanceof EnumType) {
                    // eslint-disable-next-line no-param-reassign
                    target.$DefaultValue = Expression.convertDefaultValue(
                        'EnumType', currentDefaultValue
                    );
                    return callback();
                }
                return callback(new Error(target.$Type + ' is not supported to create a term default value'));
            }).catch(callback);
        });
        return null;
    }
}

/**
 * The Context class is a helper/util class where an instance will be provided to each processor factory.
 *
 * @class Context
 * @extends {Emitter}
 */
class Context extends Emitter {
    constructor(strategy, logger = { info() { }, debug() { }, path() { }, warn() { }, error() { } }) {
        super();
        this._strategy = strategy;
        this._aliases = new Map();
        this._logger = logger;
        this._edmCache = new Map();
        this._missingTypes = [];
        this._converterOptions = {};
    }

    setConverterOptions(options) {
        this._converterOptions = options;
        return this;
    }

    getConverterOptions() {
        return this._converterOptions;
    }

    getMissingTypes() { return this._missingTypes; }

    setEdmCache(edmCache) { this._edmCache = edmCache; return this; }
    getEdmCache() { return this._edmCache; }

    setResult(result) { this._result = result; return this; }
    getResult() { return this._result; }
    /**
     * Sets an alias for a namespace
     *
     * @param {string} alias The alias
     * @param {string} namespace The namespace
     * @returns {Context} This instance of context
     * @memberof Context
     */
    setAlias(alias, namespace) { this._aliases.set(alias, namespace); return this; }

    /**
     * Returns the current logger. If no logger was provided through Strategy a default logger with
     * empty methods is used. The logger must have the api methods: info, warn, debug, path, error.
     * Each method will be provided with a different amount of parameters regarding to the corresponding
     * log event.
     *
     * @returns {Object} An instance of a logger.
     * @memberof Context
     */
    getLogger() { return this._logger; }

    /**
     * Resolves an alias to a namespace.
     *
     * @param {string} aliasToResolve The alias
     * @returns {string} The namespace for the alias. Null if alias was null. Alias itself if no entry could be found
     * @memberof Context
     */
    resolveAlias(aliasToResolve) {
        if (aliasToResolve == null) return aliasToResolve;
        for (const [alias, namespace] of this._aliases.entries()) {
            if (aliasToResolve.startsWith(alias + '.')) return aliasToResolve.replace(alias, namespace);
        }
        return aliasToResolve;
    }

    /**
     * Resolves a namespace to an alias.
     *
     * @param {string} namespaceToResolve The namespace and type
     * @param {boolean} forceReplace True if any namespace should be replaced, else false (default)
     * @returns {string} The alias for the namespace. Null if namepsace was null. Namespace itself if no entry could be found
     * @memberof Context
     */
    resolveNamespace(namespaceToResolve, forceReplace = false) {
        if (forceReplace) {
            for (const [alias, namespace] of this._aliases.entries()) {
                if (namespaceToResolve.indexOf(namespace) > -1) {
                    return namespaceToResolve.replace(namespace, alias);
                }
            }
        } else {
            const [schema, type] = this._getSchemaAndType(namespaceToResolve);
            if (namespaceToResolve == null) return namespaceToResolve;
            for (const [alias, namespace] of this._aliases.entries()) {
                if (namespace === schema) return `${alias}.${type}`;
            }
        }
        return namespaceToResolve;
    }

    _getSchemaAndType(typeFqnString) {
        const lastIndex = typeFqnString.lastIndexOf('.');
        const schema = typeFqnString.substring(0, lastIndex);
        const type = typeFqnString.substring(lastIndex + 1);
        return [schema, type];
    }

    _getEdm(typeFqn, edmCache, callback) {
        this.getLogger().path(`Entering Context.getEdm(${typeFqn}, callback)...`);
        const [schema, type] = this._getSchemaAndType(typeFqn);

        if (edmCache.has(schema)) {
            this.getLogger().debug(`Edm for '${typeFqn}' found local in cache`);
            return callback(null, edmCache.get(schema));
        }

        const currentResult = this.getResult();

        const isInCurrentEdm = currentResult != null &&
            currentResult[schema] != null && currentResult[schema][type] != null;

        if (isInCurrentEdm === true) {
            const edm = new JsonEdm(currentResult);
            edmCache.set(schema, edm);
            this.getLogger().debug(`Edm for '${typeFqn}' found in current local interpretation`);
            return callback(null, edm);
        }
        const ns = typeFqn.split('.').slice(0, -1).join('.').toLowerCase();
        const vocabulary = vocabulariesMap.get(ns);
        if (vocabulary) {
            this.getLogger().debug(`Create and cache edm for '${typeFqn}'`);
            const edm = new JsonEdm(vocabulary());
            edmCache.set(schema, edm);
            return callback(null, edm);
        }

        const referenceUri = new JsonEdm(currentResult).getReferenceUriForType(typeFqn);
        const namespace = typeFqn.split('.').slice(0, -1).join('.');

        return this._strategy.getMetadataFactory()(namespace, referenceUri, (error, metadata) => {
            const logger = this.getLogger();
            logger.path(`Entering Strategy.getMetadataFactory()(${namespace}, callback)...`);

            if (error) return callback(error);
            if (metadata == null) {
                const missingTypes = this.getMissingTypes();
                const existingMissingType = missingTypes.find(missing => missing.namespace === namespace);
                if (existingMissingType == null) missingTypes.push({ namespace, uri: referenceUri });
                return callback();
            }

            logger.debug(`Parsing provided metadata for '${typeFqn}': `, metadata);

            let metadataAst = metadata;
            if (typeof metadata === 'string') {
                metadataAst = this._strategy.getASTFactory()(metadata);
            }
            return new MetadataConverter({
                omit$TypeOnEdmString: false
            }).addConversion([
                MetadataConverter.createOdataV4MetadataXmlToOdataV4CsdlStrategy()
                    .setASTFactory(this._strategy.getASTFactory())
                    .setXmlNodeFactory(this._strategy.getXmlNodeFactory())
                    .setMetadataFactory(this._strategy.getMetadataFactory())
                    .setLogger(this.getLogger())
                    .setEdmCache(this.getEdmCache())
                    .use('http://docs.oasis-open.org/odata/ns/edm:Annotation', () => null)
                    .use('http://docs.oasis-open.org/odata/ns/edm:Annotations', () => null)
            ]).execute(metadataAst, (conversionError, result) => {
                if (conversionError) return callback(conversionError);
                this.getLogger().debug(`Create and cache edm for '${typeFqn}'`);
                const edm = new JsonEdm(result);
                edmCache.set(schema, edm);
                return callback(null, edm);
            });
        });
    }
    /**
     * Resolves type to a corresponding edm object. This method can also resolve the type through
     * dependent metadata documents which then must be provided through {@link DefaultXmlStrategy#setMetadataFactory} factory
     * implementation.
     *
     * @param {string} type The name of the type to resolve
     * @returns {Promise<Named, Error>} Resolves to an EDM object or rejects to an error
     * @memberof Context
     */
    resolveType(type) {
        return new Promise((resolve, reject) => {
            const typeFqn = this.resolveAlias(type);
            const edmCache = this.getEdmCache();
            return this._getEdm(typeFqn, edmCache, (error, edm) => {
                if (error) return reject(error);
                if (edm == null) return resolve();

                let artifact = edm.getEntityType(typeFqn) || edm.getComplexType(typeFqn) || edm.getEnumType(typeFqn);

                if (artifact != null) return resolve(artifact);

                artifact = edm.getTerm(typeFqn) || edm.getTypeDefinition(typeFqn);
                if (artifact == null) {
                    throw new Error(
                        `Could not find artifact '${typeFqn}' in provided EDM Schemas '${edm.getSchemas().join(',')}'`
                    );
                }

                const edmArtifactType = artifact.getType();
                if (edmArtifactType == null) {
                    const artifactType = artifact.getTarget().$Type;
                    const fqnType = edm.toFqn(artifactType);

                    this.resolveType(fqnType).then((resolvedType) => {
                        artifact.setType(resolvedType);
                        resolve(artifact);
                    }).catch(reject);
                } else {
                    resolve(artifact);
                }
                return undefined;
            });
        });
    }
}
MetadataConverter.Context = Context;

/**
* This callback is displayed as part of the {@link DefaultXmlStrategy#getMetadataFactory}.
* This callback is provided as a parameter of the metadata factory.
* It must be called to provide the metadata abstract syntax tree for the given type.
*
* @callback DefaultXmlStrategy~metadataFactoryCallback
* @param {Error} error Provide an error the type can not be found else null
* @param {Object} result The metadata abstract syntax tree of the depended metadata document
*/


/**
* This callback is displayed as part of the DefaultXmlStrategy class.
* This factory is called when the converter can not find a needed type within the current metadata document.
* This factory then must provide the metadata abstract syntax tree where the depended type exists in.
*
* @callback DefaultXmlStrategy~metadataFactory
* @param {String} type The full qualified type name which does not exist in the current metadata document
* @param {DefaultXmlStrategy~metadataFactoryCallback} callback To be called with the new metadata abstract
* syntax tree.
*/

/**
* This callback is displayed as part of the DefaultXmlStrategy class.
* This factory is called on each element visiting while convertig the abstract syntax tree. This factory
* is called with each and every element and must convert the provided element into an expected structure
* like this:
{
    name: 'The name of the element node without <>' // Like 'Annotation' for <Annotation>...</Annotation>
    attributes: {
        Name: 'The attribute value',
        AnotherAttribute: 'Another value'
    },
    elements: [
        { attributes: {...}, elements: [...] },
        ...
    ]
}
The result must be returned via 'return' statement.
*
* @callback DefaultXmlStrategy~nodeBuilder
* @param {Object} element The element which is currently visited. Starting with the first 'input' element
* @returns {Object} The converted element node must be returned
* syntax tree.
*/

/**
* This factory is displayed as part of the DefaultXmlStrategy class.
* This factory is called on each odata known node to create a corresponding {@link Expression} object
* for interpretation.
*
* @callback DefaultXmlStrategy~useFactory
* @param {Object} element The current element to interpret
* @param {Expression} parentExpression The parent expression. Can be null if the element is the root node.
* @param {Context} context A context object with some helper/util methods
* @returns {Expression} The expression to interpret the current element node
*/


/**
* This callback is displayed as part of the DefaultXmlStrategy class.
* This callback is called on finishing a strategy.
*
* @callback DefaultXmlStrategy~executeCallback
* @param {Error} error An error if occurs or null if not
* @param {Any} result The output of the Strategy
*/


class DefaultXmlStrategy extends Strategy {
    constructor(options) {
        super(undefined, options);
        this._nodeProcessorMap = new Map();
        this.setXmlNodeFactory((element) => element);

        this.setMetadataFactory((path, uri, callback) => {
            let message = `No metadata factory provided. Can not resolve '${path}'.`;
            message += ' Please add one via Strategy.setMetadataFactory(function(type, callback){})';
            callback(new Error(message));
        });

        this.setASTFactory(() => {
            throw new Error('No abstract syntax tree factory provided.');
        });
    }
    /**
     * This method sets the strategy to provide a metadata abstract syntax tree for a given type with
     * full qualified name.
     *
     * @param {DefaultXmlStrategy~metadataFactory} factory The factory to set
     * @returns {DefaultXmlStrategy} This instance of DefaultXmlStrategy
     * @memberof DefaultXmlStrategy
     */
    setMetadataFactory(factory) { this._metadataFactory = factory; return this; }

    getMetadataFactory() { return this._metadataFactory; }

    setASTFactory(astFactory) {
        this._astFactory = astFactory;
        return this;
    }

    getASTFactory() {
        return this._astFactory;
    }

    setEdmCache(edmCache) { this._edmCache = edmCache; return this; }
    getEdmCache() { return this._edmCache; }

    /**
     * Sets the node factory to create the expected abstract syntax tree structure for each element.
     * The default is returning each element as is.
     *
     * @param {DefaultXmlStrategy~nodeBuilder} nodeFactory The factory to create abstract syntax tree nodes
     * @returns {DefaultXmlStrategy} This instance of DefaultXmlStrategy
     * @memberof DefaultXmlStrategy
     */
    setXmlNodeFactory(nodeFactory) { this._nodeFactory = nodeFactory; return this; }
    getXmlNodeFactory() { return this._nodeFactory; }

    /**
     * This method registers a processor factory which will be called on each odata known node. This factory must provide
     * a correspnding {@link Expression} object which will be used to interpret the current node.
     * The factory will be called with following params
     *
     * @param {string} name The case senstive name of the xml node prefixed with the corresponding odata namesapce.
     *        Example: 'http://docs.oasis-open.org/odata/ns/edm:Annotation' for Annotation nodes.
     *        Example: 'http://docs.oasis-open.org/odata/ns/edmx:DataServices' for DataServices nodes.
     * @param {DefaultXmlStrategy~useFactory} callback The factory to create an {@link Expression} for a provided
     *        element node
     * @returns {DefaultXmlStrategy} This instance of DefaultXmlStrategy
     * @memberof DefaultXmlStrategy
     */
    use(name, callback) {
        this._nodeProcessorMap.set(name, callback);
        return this;
    }
    /**
     * Executes this strategy.
     *
     * @param {any} input Any input from {@link MetadataConverter#execute} if this is the root strategy else the output
     *         from a previous executed strategy.
     * @param {DefaultXmlStrategy~executeCallback} callback The callback to be called on finishing the Strategy
     * @param {MetadataConverter} converterInstance The metadata converter instance
     * @memberof DefaultXmlStrategy
     */
    execute(input, callback, converterInstance) { // callback(error, result) -> result = conversion result

        const logger = this.getLogger();

        if (logger) logger.path('Entering MetadataConverter.DefaultXmlStrategy.execute()...');

        const processElements = (elements, parentExpression, context) => {
            for (let index = 0; index < elements.length; index++) {
                const element = this._nodeFactory(elements[index]);

                let nodeName = element.name;
                let prefix = null;
                if (element && element.name) {
                    if (element.name.indexOf(':') > -1) [prefix, nodeName] = element.name.split(':');
                }

                const namespace = Expression.lookupXmlNamespace(element, parentExpression, prefix, logger);
                let isOdataElement = false;
                let processor = null;
                if (namespace != null) {
                    if (logger) logger.debug(`Found namespace '${namespace}'`);
                    isOdataElement = ODATA_NAMESPACES.v4.includes(namespace);
                    if (isOdataElement === true) {
                        const processorName = `${namespace}:${nodeName}`;
                        if (logger) logger.debug(`Loading processor: '${processorName}'`);
                        processor = this._nodeProcessorMap.get(processorName);
                    }
                } else if (logger) logger.warn(`No namespace found for element name '${nodeName}'`);

                if (processor) {
                    if (logger) {
                        const name = element.name;
                        logger.debug(
                            `Start processing of element ${name}: ${JSON.stringify(element.attributes, null, 2)}`
                        );
                    }
                    let target = element;
                    const childExpression = processor(target, parentExpression, context);
                    if (childExpression) {
                        parentExpression.getStack().push(childExpression);
                        if (target.elements) {
                            processElements(target.elements, childExpression, context);
                        }
                    }
                } else if (logger) logger.warn('No processor found');
            }
            return parentExpression;
        };

        let _input = input;
        if (typeof input === 'string') {
            _input = this.getASTFactory()(input);
        }

        const context = new Context(this, logger)
            .setConverterOptions(converterInstance.getOptions())
            .setEdmCache(this.getEdmCache() || new Map());

        const rootNode = this._nodeFactory(_input);
        const root = processElements(rootNode.elements, new Expression(rootNode, null, context), context);
        const result = root.interpret();

        context
            .on('error', (error) => {
                callback(error, result, context.getMissingTypes());
            })
            .on('post finalize', () => {
                const missingTypes = context.getMissingTypes();
                let error = null;
                if (missingTypes.length > 0) {
                    error = new Error('Could not convert document: Missing referenced documents');
                    error._missingReferences = context.getMissingTypes();
                }
                callback(error, result, missingTypes);
            });

        context.setResult(result);
        context.emit('finalize', result);
    }
}
MetadataConverter.DefaultXmlStrategy = DefaultXmlStrategy;


class EdmxRootExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = { $Version: this.getElement().attributes.Version };
        this.setTarget(target);

        this.getStack()
            .map((expr) => {
                return { type: expr.getType(), result: expr.interpret() };
            })
            .filter(interpretation => interpretation.result != null)
            .forEach((interpretation) => {
                if (interpretation.type === 'ReferenceExpression') {
                    if (target.$Reference == null) {
                        target.$Reference = {};
                    }
                    Object.assign(target.$Reference, interpretation.result.$Reference);
                } else {
                    Object.assign(target, interpretation.result);
                }
            });
        return target;
    }
}

class ReferenceIncludeExpression extends Expression {
    constructor(element, expression, context) {
        super(element, expression, context);
    }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = {};
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Namespace', '$Alias');
        super.interpret();
        return target;
    }
}

class StringExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const element = this.getElement();
        if (element.elements == null || element.elements[0] == null) return '';
        return this.getElement().elements[0].text;
    }
}

class BinaryExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {

        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Binary'
        };
        this.setTarget(target);
        return target;
    }
}

class BooleanExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() { return this.getElement().elements[0].text === 'true'; }
}

class DateExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Date'
        };
        this.setTarget(target);
        return target;
    }
}

class DateTimeOffsetExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.DateTimeOffset'
        };
        this.setTarget(target);
        return target;
    }
}

class DecimalExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Decimal'
        };
        this.setTarget(target);
        return target;
    }
}

class DurationExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Duration'
        };
        this.setTarget(target);
        return target;
    }
}

class FloatExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() { return parseFloat(this.getElement().elements[0].text); }
}

class EnumMemberExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = this.convertEnumMemberExpression(this.getElement().elements[0].text);
        this.setTarget(target);
        super.interpret();
        return target;
    }
}

class GuidExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Guid'
        };
        this.setTarget(target);
        return target;
    }
}

class TimeOfDayExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.TimeOfDay'
        };
        this.setTarget(target);
        return target;
    }
}

class NotExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() { return { $Not: super.interpret() }; }
}

class IntExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Cast: this.getElement().elements[0].text,
            $Type: 'Edm.Int64'
        };
        this.setTarget(target);
        super.interpret();
        return target;
    }
}

class PathExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = { $Path: this.getElement().elements[0].text };
        this.setTarget(target);
        super.interpret();
        return target;
    }
}

class AbstractLogicalExpression extends Expression {
    constructor(element, expression, context, kind) { super(element, expression, context); this._kind = kind; }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = {};
        this.setTarget(target);
        target[this._kind] = this.getStack().map(expr => expr.interpret()).filter(result => result != null);
        return target;
    }
}


class AndExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$And'); }
}

class GtExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Gt'); }
}

class LtExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Lt'); }
}

class LeExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Le'); }
}

class NeExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Ne'); }
}

class EqExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Eq'); }
}

class GeExpression extends AbstractLogicalExpression {
    constructor(element, expression, context) { super(element, expression, context, '$Ge'); }
}

class AnnotationPathExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        let target = {};
        this.setTarget(target);
        const targetOption = this.getContext().getConverterOptions().target;
        if (targetOption === MetadataConverter.TARGETS.LIBRARY) {
            target.$AnnotationPath = this.resolveNamespace(this.getElement().elements[0].text, true);
        } else {
            target = this.resolveNamespace(this.getElement().elements[0].text, true);
        }
        super.interpret();
        return target;
    }
}

class ApplyExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $Apply: [], $Function: this.getElement().attributes.Function };
        this.setTarget(target);

        this.getStack().map(expr => expr.interpret()).filter(expr => expr != null)
            .forEach((result) => {
                target.$Apply.push(result);
            });

        return target;
    }
}

class CastExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $Cast: '' };
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type');

        this.getStack().forEach((expr) => {
            const result = expr.interpret();
            if (result != null) {
                target.$Cast = result;
            }
        });

        return target;
    }
}

class CollectionExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }

    interpret() {
        const target = [];
        this.setTarget(this.getParentExpression().getTarget());

        this.getStack().map(expr => expr.interpret()).filter(result => result != null)
            .forEach((result) => {
                target.push(result);
            });

        return target;
    }
}

class IfExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $If: [] };
        this.setTarget(target);

        this.getStack().forEach((expr) => {
            const result = expr.interpret();
            if (result != null) {
                target.$If.push(result);
            }
        });

        return target;
    }
}

class OrExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $Or: [] };
        this.setTarget(target);
        target.$Or = this.getStack().map(expr => expr.interpret()).filter(expr => expr != null);
        return target;
    }
}

class IsOfExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $IsOf: {} };
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type');

        this.getStack().map(expr => expr.interpret()).filter(expr => expr != null)
            .forEach(result => Object.assign(target.$IsOf, result));

        return target;
    }
}

class LabeledElementExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $LabeledElement: {} };
        const element = this.getElement();
        target.$Name = element.attributes.Name;
        this.setTarget(target);

        const constantExpression = this.createExpressionFromAttributes(this.getElement());
        Object.assign(target.$LabeledElement, constantExpression);

        this.getStack().map(expr => expr.interpret()).filter(expr => expr != null)
            .forEach(result => Object.assign(target.$LabeledElement, result));

        return target;
    }
}

class NullExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = { $Null: null };
        this.setTarget(target);
        super.interpret();
        return target;
    }
}

class PropertyPathExpression extends Expression {
    constructor(element, expression, context, targetName = '$PropertyPath') {
        super(element, expression, context);
        this._targetName = targetName;
    }
    interpret() {
        let target = null;

        const targetOption = this.getContext().getConverterOptions().target;
        if (targetOption === MetadataConverter.TARGETS.LIBRARY) {
            target = { [this._targetName]: this.getElement().elements[0].text };
        } else {
            target = this.getElement().elements[0].text;
        }

        this.setTarget(target);
        super.interpret();
        return target;
    }
}

class NavigationPropertyPathExpression extends PropertyPathExpression {
    constructor(element, expression, context) { super(element, expression, context, '$NavigationPropertyPath'); }
}

class RecordExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        let target = {};
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type');

        this.getStack().forEach((expression) => {
            const interpretation = expression.interpret();
            if (expression.getType() === 'CollectionExpression') {
                target = interpretation;
                this.setTarget(target);
            } else if (interpretation != null) {
                Object.assign(target, interpretation);
            }
        });

        return target;
    }
}

class PropertyValueExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(this.getTargetPropertyName(), this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const name = element.attributes.Property;
        this.setTargetPropertyName(name);
        const target = { [name]: {} };
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type');

        if (element.attributes.Path) target[name].$Path = element.attributes.Path;
        if (element.attributes.String) target[name] = element.attributes.String;
        if (element.attributes.Bool) target[name] = element.attributes.Bool === 'true';

        this.getStack().forEach((expr) => {
            const result = expr.interpret();
            if (expr.getType() === 'CollectionExpression') {
                target[name] = result;
            } else if (typeof result === 'object') {
                if (result != null) Object.assign(target[name], result);
            } else {
                target[name] = result;
            }
        });

        return target;
    }
}

class UrlRefExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(this.getTargetPropertyName(), this.getTarget(), result); }
    interpret() {
        const target = { $UrlRef: {} };
        this.setTarget(target);
        const element = this.getElement();

        if (element.attributes && element.attributes.String) target.$UrlRef = element.attributes.String;

        this.getStack().forEach((expr) => {
            const result = expr.interpret();
            if (result !== null) {
                if (['StringExpression'].includes(expr.getType())) {
                    target.$UrlRef = result;
                } else {
                    Object.assign(target.$UrlRef, result);
                }
            }
        });

        return target;
    }
}

class LabeledElementReferenceExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const result = this.resolveNamespace(this.getElement().elements[0].text);
        const target = { $LabeledElementReference: result };
        this.setTarget(target.$LabeledElementReference);
        return target;
    }
}

class AnnotationExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(this.getTargetPropertyName(), this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        let name = element.attributes.Term;
        if (element.attributes.Qualifier) name += '#' + element.attributes.Qualifier;
        name = '@' + name;
        this._targetPropertyName = name;

        const target = {};
        this.setTarget(target);

        target[name] = this.createExpressionFromAttributes(element);

        this.getStack().map(expr => expr.interpret()).filter(result => result != null)
            .forEach((result) => {
                if (target[name] != null) {
                    target[name] = [target[name], result];
                } else {
                    target[name] = result;
                }
            });

        if (target[name] == null) {
            const context = this.getContext();

            const fqn = this.resolveAlias(name.substring(1));
            context.on('finalize', (callback) => {
                context
                    .resolveType(fqn)
                    .then((term) => {
                        if (term == null) return callback();
                        const parentExpr = this.getParentExpression();
                        const value = this.createAnnotationExpressionDerivedFromDefaultValue(term, this);
                        parentExpr.annotate({ [name]: value });
                        return callback();
                    }).catch(callback);
            });
        }

        this.getParentExpression().annotate(target);

        return null;
    }

    /**
     * Returns the default value for an annotation which does not define an expression.
     *
     * Spec Odata 4.0 Errata 03 Part 3 Csdl Complete, 14.3:
     * [...]
     * An edm:Annotation element MAY contain a constant expression or dynamic expression in either
     * attribute or element notation. If no expression is specified for a term with a primitive type, the annotation
     * evaluates to the default value of the term definition. If no expression is specified for a term with a complex
     * type, the annotation evaluates to a complex instance with default values for all properties is used.
     * If no expression is specified for a collection-valued term, the annotation evaluates to an empty collection.
     * [...]
     *
     * @param {Object} term
     * @param {Object} annotation
     * @returns {Object} The JSON CSDL default type for this annotation
     */
    createAnnotationExpressionDerivedFromDefaultValue(term, annotation) {
        if (term.isCollection()) {
            return [];
        }

        const type = term.getType();
        if (type instanceof EntityType || type instanceof ComplexType) {
            return {};
        }

        // If the terms type is not a structured type the term requires a default value
        let defaultValue = term.getDefaultValue();
        if (defaultValue == null) {
            throw new Error(
                `Term '${term.getName()}' for annotation '${annotation.getTargetPropertyName()}'` +
                ' must have a default value'
            );
        }

        if (type instanceof EnumType) {
            return this.convertEnumMemberExpression(defaultValue, term.toString());
        }

        const typeToStr = type.toString();
        if (typeToStr.startsWith('Edm.')) {
            // Also TypeDefs (with underlying type) will be handled here
            return this.createAnnotationExpressionForEdmType(typeToStr, defaultValue);
        }

        const message = 'Invalid annotation value. An annotation must define an expression or the target' +
            ` term must have a default value. Can not derive expression for '${term.toString()}'`;
        throw new Error(message);
    }


    createAnnotationExpressionForEdmType(typeToStr, defaultValue) {

        if (typeToStr === 'Edm.String') return defaultValue;
        if (typeToStr === 'Edm.Binary' || typeToStr === 'Edm.Stream') {
            return createCast(defaultValue.toString(), 'Edm.Binary');
        }
        if (typeToStr === 'Edm.Single' || typeToStr === 'Edm.Double') return parseFloat(defaultValue);
        if (typeToStr === 'Edm.Boolean') return String(defaultValue) === 'true';

        let types = ['Edm.Byte', 'Edm.SByte', 'Edm.Int16', 'Edm.Int32'];
        if (types.includes(typeToStr)) return createCast(parseInt(defaultValue, 10), typeToStr);

        types = [
            'Edm.Int64', 'Edm.Date', 'Edm.DateTimeOffset', 'Edm.Decimal', 'Edm.Duration', 'Edm.Guid', 'Edm.TimeOfDay'
        ];
        if (types.includes(typeToStr)) return createCast(defaultValue, typeToStr);

        if (typeToStr === 'Edm.ModelElementPath') return { $ModelElementPath: defaultValue };
        if (typeToStr === 'Edm.PropertyPath') return { $PropertyPath: defaultValue };
        if (typeToStr === 'Edm.AnnotationPath') {
            return { $AnnotationPath: this.resolveNamespace(defaultValue, true) };
        }

        return defaultValue;
    }
}
MetadataConverter.AnnotationExpression = AnnotationExpression;

class ReferenceExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        let target = {};
        this.setTarget(target);

        this.getStack().forEach((expression) => {
            if (expression.getType() === 'ReferenceIncludeExpression') {
                if (target.$Include == null) {
                    target.$Include = [];
                }
                target.$Include.push(expression.interpret());
            } else if (expression.getType() === 'IncludeAnnotationsExpression') {
                if (target.$IncludeAnnotations == null) {
                    target.$IncludeAnnotations = [];
                }
                target.$IncludeAnnotations.push(expression.interpret());
            } else {
                Object.assign(target, expression.interpret());
            }
        });

        return {
            $Reference: {
                [element.attributes.Uri]: target
            }
        };
    }
}

class DataServiceExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
}

class SchemaExpression extends Expression {
    constructor(element, expression, context) {
        super(element, expression, context);
    }

    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const namespace = this.getElement().attributes.Namespace;
        const target = {};
        this.setTarget(target);

        const result = {
            [element.attributes.Namespace]: target
        };

        if (element.attributes.Alias) {
            target.$Alias = element.attributes.Alias;
        }

        this.getStack().forEach((expr) => {
            if (['FunctionExpression', 'ActionExpression'].indexOf(expr.getType()) > -1) {
                const operationName = expr.getTargetPropertyName();
                if (target[operationName] != null) {
                    const operation = expr.interpret()[operationName];
                    target[operationName].push(...operation);
                } else {
                    Object.assign(target, expr.interpret());
                }
            } else if (expr.getType() === 'AnnotationsExpression') {
                if (target.$Annotations == null) {
                    target.$Annotations = {};
                    Object.assign(target.$Annotations, expr.interpret().$Annotations);
                } else {
                    const annotations = expr.interpret().$Annotations;
                    Object.keys(annotations).forEach((annotationKey) => {
                        if (target.$Annotations[annotationKey] == null) {
                            target.$Annotations[annotationKey] = annotations[annotationKey];
                        } else {
                            Object.assign(target.$Annotations[annotationKey], annotations[annotationKey]);
                        }
                    });
                }
            } else {
                if (expr.getType() === 'EntityContainerExpression') {
                    result.$EntityContainer = namespace + '.' + expr.getTargetPropertyName();
                }
                Object.assign(target, expr.interpret());
            }
        });

        return result;
    }

}

class AbstractTypeExpression extends Expression {
    constructor(element, expression, context, kind) { super(element, expression, context); this._kind = kind; }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = { $Kind: this._kind };
        this.setTarget(target);

        if (element.attributes.Abstract === 'true') target.$Abstract = true;

        this.buildTypeCollectionAndFacets('$Type');

        const result = {
            [element.attributes.Name]: super.interpret()
        };

        return result;
    }

}

class EnumTypeExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {

        const element = this.getElement();
        const target = { $Kind: 'EnumType' };
        this.setTarget(target);
        const result = { [element.attributes.Name]: target };


        this.getStack().forEach((expr, index) => {
            const interpretation = expr.interpret();
            if (interpretation != null) {
                const propertyName = expr.getTargetPropertyName();
                if (interpretation[propertyName] == null) {
                    interpretation[propertyName] = index;
                }
                Object.assign(target, interpretation);
            }
        });

        this.buildTypeCollectionAndFacets('$Type', '$UnderlyingType', '$IsFlags', '$BaseType');
        return result;
    }
}

class EntityTypeExpression extends AbstractTypeExpression {
    constructor(element, expression, context) { super(element, expression, context, 'EntityType'); }
    interpret() {
        const result = super.interpret();
        this.buildTypeCollectionAndFacets('$Type', '$BaseType', '$HasStream');
        return result;
    }
}

class ComplexTypeExpression extends AbstractTypeExpression {
    constructor(element, expression, context) { super(element, expression, context, 'ComplexType'); }
    interpret() {
        const result = super.interpret();
        this.buildTypeCollectionAndFacets('$Type', '$BaseType', '$HasStream');
        return result;
    }
}

class EntityTypeKeyExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = { $Key: this.getStack().map(exp => exp.interpret()) };
        this.setTarget(target);
        return target;
    }

}

class KeyPropertyRefExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        if (this.getElement().attributes.Alias) {
            const target = { [this.getElement().attributes.Alias]: this.getElement().attributes.Name };
            this.setTarget(target);
            super.interpret();
            return target;
        }
        this.setTarget(this.getParentExpression().getTarget());
        return this.getElement().attributes.Name;
    }

}

class MemberExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }

    annotate(result) {
        super.annotate(this.getElement().attributes.Name, this.getTarget(), result);
    }

    getValue() { return this._value; }
    setValue(value) { this._value = value; return this; }
    interpret() {
        const element = this.getElement();
        const name = element.attributes.Name;
        this._targetPropertyName = name;

        if (element.attributes.Value != null) {
            this.setValue(parseInt(element.attributes.Value, 10));
        } else {
            this.setValue(null);
        }

        const target = { [name]: this.getValue() };
        this.setTarget(target);

        const result = super.interpret();
        this.setTarget(this.getParentExpression().getTarget());
        return result;
    }

}

class TypeDefExpression extends AbstractTypeExpression {
    constructor(element, expression, context) { super(element, expression, context, 'TypeDefinition'); }
    interpret() {
        const result = super.interpret();
        this.buildTypeCollectionAndFacets('$UnderlyingType', '$MaxLength');
        return result;
    }
}

class PropertyExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const name = element.attributes.Name;
        const _target = this.getTarget();
        this.setTarget(_target);

        this.buildTypeCollectionAndFacets(
            '$Type', '$MaxLength', '$Precision', '$Scale', '$Nullable', '$DefaultValue'
        );

        const defaultValue = element.attributes.DefaultValue;
        if (defaultValue != null) {
            new DefaultValueConverter(_target, defaultValue, this.getContext()).convert();
        }

        super.interpret();
        return { [name]: _target };
    }

}

class NavigationPropertyExpression extends PropertyExpression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = { $Kind: 'NavigationProperty' };
        this.setTarget(target);
        this.buildTypeCollectionAndFacets(
            '$Type', '$MaxLength', '$Precision', '$Scale', '$Nullable',
            '$ContainsTarget', '$Partner'
        );
        return super.interpret();
    }

}

class ReferentialConstraintExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(this.getElement().attributes.Property, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = {
            [element.attributes.Property]: element.attributes.ReferencedProperty
        };
        this.setTarget(target);
        super.interpret();
        return { $ReferentialConstraint: super.interpret() };
    }

}

class ParameterExpression extends PropertyExpression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const target = {
            $Name: this.getElement().attributes.Name
        };
        this.setTarget(target);
        super.interpret();
        return target;
    }

}

class OperationExpression extends Expression {
    constructor(element, expression, context, kind) { super(element, expression, context); this._kind = kind; }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    getTargetPropertyName() { return this.getElement().attributes.Name; }
    interpret() {
        const target = { $Kind: this._kind };
        this.setTarget(target);

        this.getStack().forEach((expression) => {
            if (expression.getType() === 'ParameterExpression') {
                if (target.$Parameter == null) {
                    target.$Parameter = [];
                }
                target.$Parameter.push(expression.interpret());
            } else {
                Object.assign(target, expression.interpret());
            }
        });

        return {
            [this.getTargetPropertyName()]: [target]
        };
    }

}

class ActionExpression extends OperationExpression {
    constructor(element, expression, context) { super(element, expression, context, 'Action'); }
    interpret() {
        const result = super.interpret();
        this.buildTypeCollectionAndFacets('$Type', '$IsBound', '$EntitySetPath');
        return result;
    }
}

class FunctionExpression extends OperationExpression {
    constructor(element, expression, context) { super(element, expression, context, 'Function'); }
    interpret() {
        const result = super.interpret();
        this.buildTypeCollectionAndFacets('$Type', '$IsBound', '$IsComposable', '$EntitySetPath');
        return result;
    }
}

class ReturnTypeExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const target = {};
        this.setTarget(target);

        this.buildTypeCollectionAndFacets('$Type', '$Nullable', '$Precision', '$Scale');
        super.interpret();
        return { $ReturnType: target };
    }

}

class TermExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = { $Kind: 'Term' };
        this.setTarget(target);

        this._targetPropertyName = element.attributes.Name;

        this.buildTypeCollectionAndFacets(
            '$Type', '$MaxLength', '$Precision', '$Scale', '$Nullable'
        );

        super.interpret();
        const attr = element.attributes;

        if (attr.AppliesTo) target.$AppliesTo = element.attributes.AppliesTo.split(' ');
        new DefaultValueConverter(target, attr.DefaultValue, this.getContext()).convert();
        return { [element.attributes.Name]: target };
    }
}
MetadataConverter.TermExpression = TermExpression;

class EntityContainerExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    getTargetPropertyName() { return this.getElement().attributes.Name; }
    interpret() {
        const element = this.getElement();
        const target = { $Kind: 'EntityContainer' };
        this.setTarget(target);
        super.interpret();

        return { [element.attributes.Name]: target };
    }
}

class EntitySetExpression extends Expression {
    constructor(element, expression, context, kind = 'EntitySet') {
        super(element, expression, context); this._kind = kind;
    }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = {};
        if (this._kind === 'EntitySet') {
            target.$Collection = true;
        }
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type');

        /*
           IncludeInServiceDocument Spec odata v 4.0:
           XML:    If no value is specified for this attribute, its value defaults to true.
           JSON:   Absence of the member means true.

           XML         | JSON
           -----------------------
           true        | undefined
           undefined   | undefined
           false       | false
       */
        if (this._kind === 'EntitySet' && element.attributes.IncludeInServiceDocument === 'false') {
            target.$IncludeInServiceDocument = false;
        }

        this.getStack().forEach((expression) => {
            const interpretation = expression.interpret();
            if (expression.getType() === 'NavigationPropertyBindingExpression') {
                if (target.$NavigationPropertyBinding == null) {
                    target.$NavigationPropertyBinding = {};
                }
                Object.assign(target.$NavigationPropertyBinding, interpretation.$NavigationPropertyBinding);
            } else {
                Object.assign(target, interpretation);
            }
        });

        return { [element.attributes.Name]: target };
    }

}

class NavigationPropertyBindingExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const element = this.getElement();
        const target = { [element.attributes.Path]: element.attributes.Target };
        this.setTarget(target);
        return { $NavigationPropertyBinding: target };
    }

}

class ActionImportExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = {
            $Action: this.resolveNamespace(element.attributes.Action)
        };
        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$Type', '$EntitySet');
        super.interpret();
        return { [element.attributes.Name]: target };
    }

}

class FunctionImportExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = {
            $Function: element.attributes.Function
        };

        /*
            IncludeInServiceDocument Spec odata v 4.0:
            XML:    If no value is specified for this attribute, its value defaults to false.
            JSON:   Absence of the member means false.

            XML         | JSON
            -----------------------
            true        | true
            undefined   | undefined
            false       | false
        */
        if (element.attributes.IncludeInServiceDocument === 'true') {
            target.$IncludeInServiceDocument = true;
        }

        this.setTarget(target);
        this.buildTypeCollectionAndFacets('$EntitySet', '$Type');
        super.interpret();
        return { [element.attributes.Name]: target };
    }

}

class SingletonExpression extends EntitySetExpression {
    constructor(element, expression, context) { super(element, expression, context, 'Singleton'); }
}

class AnnotationsExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = {};
        this.setTarget(target);
        this._targetPropertyName = this.resolveNamespace(element.attributes.Target);
        super.interpret();
        return { $Annotations: { [this._targetPropertyName]: target } };
    }

}

class IncludeAnnotationsExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    interpret() {
        const element = this.getElement();
        const target = {};
        this.setTarget(target);
        const attributes = element.attributes;
        target.$TermNamespace = attributes.TermNamespace;
        if (attributes.Qualifier) target.$Qualifier = attributes.Qualifier;
        if (attributes.TargetNamespace) target.$TargetNamespace = attributes.TargetNamespace;
        super.interpret();
        return target;
    }

}

class OnDeleteExpression extends Expression {
    constructor(element, expression, context) { super(element, expression, context); }
    annotate(result) { super.annotate(undefined, this.getTarget(), result); }
    interpret() {
        const element = this.getElement();
        const target = { $OnDelete: element.attributes.Action };
        this.setTarget(target);
        super.interpret();
        return target;
    }

}


MetadataConverter.createOdataV4MetadataXmlToOdataV4CsdlStrategy = () => {
    return new MetadataConverter.DefaultXmlStrategy()
        .use('http://docs.oasis-open.org/odata/ns/edmx:Edmx', (element, parentExpression, context) => {
            return new EdmxRootExpression(element, null, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edmx:Reference', (element, parentExpression, context) => {
            return new ReferenceExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edmx:Include', (element, parentExpression, context) => {
            return new ReferenceIncludeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edmx:IncludeAnnotations', (element, parentExpression, context) => {
            return new IncludeAnnotationsExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edmx:DataServices', (element, parentExpression, context) => {
            return new DataServiceExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Annotation', (element, parentExpression, context) => {
            return new AnnotationExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:String', (element, parentExpression, context) => {
            return new StringExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Schema', (element, parentExpression, context) => {
            return new SchemaExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:EnumType', (element, parentExpression, context) => {
            return new EnumTypeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Member', (element, parentExpression, context) => {
            return new MemberExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:TypeDefinition', (element, parentExpression, context) => {
            return new TypeDefExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:EntityType', (element, parentExpression, context) => {
            return new EntityTypeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Key', (element, parentExpression, context) => {
            return new EntityTypeKeyExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:PropertyRef', (element, parentExpression, context) => {
            return new KeyPropertyRefExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Property', (element, parentExpression, context) => {
            return new PropertyExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:NavigationProperty', (element, parentExpression, context) => {
            return new NavigationPropertyExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:OnDelete', (element, parentExpression, context) => {
            return new OnDeleteExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:ReferentialConstraint', (element, parentExpression, context) => {
            return new ReferentialConstraintExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:ComplexType', (element, parentExpression, context) => {
            return new ComplexTypeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Action', (element, parentExpression, context) => {
            return new ActionExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Parameter', (element, parentExpression, context) => {
            return new ParameterExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:ReturnType', (element, parentExpression, context) => {
            return new ReturnTypeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Function', (element, parentExpression, context) => {
            return new FunctionExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Term', (element, parentExpression, context) => {
            return new TermExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:EntityContainer', (element, parentExpression, context) => {
            return new EntityContainerExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:EntitySet', (element, parentExpression, context) => {
            return new EntitySetExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:NavigationPropertyBinding', (element, parentExpression, context) => {
            return new NavigationPropertyBindingExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:ActionImport', (element, parentExpression, context) => {
            return new ActionImportExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:FunctionImport', (element, parentExpression, context) => {
            return new FunctionImportExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Singleton', (element, parentExpression, context) => {
            return new SingletonExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Annotations', (element, parentExpression, context) => {
            return new AnnotationsExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Binary', (element, parentExpression, context) => {
            return new BinaryExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Bool', (element, parentExpression, context) => {
            return new BooleanExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Date', (element, parentExpression, context) => {
            return new DateExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:DateTimeOffset', (element, parentExpression, context) => {
            return new DateTimeOffsetExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Decimal', (element, parentExpression, context) => {
            return new DecimalExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Duration', (element, parentExpression, context) => {
            return new DurationExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Float', (element, parentExpression, context) => {
            return new FloatExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:EnumMember', (element, parentExpression, context) => {
            return new EnumMemberExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:TimeOfDay', (element, parentExpression, context) => {
            return new TimeOfDayExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Guid', (element, parentExpression, context) => {
            return new GuidExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Int', (element, parentExpression, context) => {
            return new IntExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Not', (element, parentExpression, context) => {
            return new NotExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Path', (element, parentExpression, context) => {
            return new PathExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:And', (element, parentExpression, context) => {
            return new AndExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Gt', (element, parentExpression, context) => {
            return new GtExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Ge', (element, parentExpression, context) => {
            return new GeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Lt', (element, parentExpression, context) => {
            return new LtExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Le', (element, parentExpression, context) => {
            return new LeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Eq', (element, parentExpression, context) => {
            return new EqExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Ne', (element, parentExpression, context) => {
            return new NeExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:AnnotationPath', (element, parentExpression, context) => {
            return new AnnotationPathExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Apply', (element, parentExpression, context) => {
            return new ApplyExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Cast', (element, parentExpression, context) => {
            return new CastExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Collection', (element, parentExpression, context) => {
            return new CollectionExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:If', (element, parentExpression, context) => {
            return new IfExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Or', (element, parentExpression, context) => {
            return new OrExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:IsOf', (element, parentExpression, context) => {
            return new IsOfExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:LabeledElement', (element, parentExpression, context) => {
            return new LabeledElementExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:LabeledElementReference', (element, parentExpression, context) => {
            return new LabeledElementReferenceExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Null', (element, parentExpression, context) => {
            return new NullExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:PropertyPath', (element, parentExpression, context) => {
            return new PropertyPathExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:NavigationPropertyPath', (element, parentExpression, context) => {
            return new NavigationPropertyPathExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:Record', (element, parentExpression, context) => {
            return new RecordExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:PropertyValue', (element, parentExpression, context) => {
            return new PropertyValueExpression(element, parentExpression, context);
        })
        .use('http://docs.oasis-open.org/odata/ns/edm:UrlRef', (element, parentExpression, context) => {
            return new UrlRefExpression(element, parentExpression, context);
        });
};

module.exports = MetadataConverter;
