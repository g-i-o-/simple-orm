const debug = require('debug')('simpleOrm:Model');

const connectors = require('./connectors');
const filterKeys = require('./util/filterKeys');
const Field = require('./Field');
const TableListBuilder = require('./util/TableListBuilder');
const parse = require('./util/parse');

/** Represents an entity in the database
 */
class Model {
    /**
     *  @param {Object} properties
     *  @param {Object} properties.name - the model's name
     *  @param {Object} properties.fields - list of the model's fields, each must be a field definition
     *  @param {Object} properties.primaryKey - the field(s) that is/are this model's primary key
     *  @param {Object} properties.keys - list of any other of the model's keys
     *  @param {Object} properties.constraints - list of the model's constraints
     *  @param {Object} properties.dbOptions - extra model creation options
     */
    constructor(
        {
            name,
            fields,
            primaryKey,
            keys,
            constraints,
            dbOptions,
            relations,
            schema,
            ...moreProps
        },
        connection,
    ) {
        this.name = name;
        this.alias = parse.alias(name);
        this.primaryKey = primaryKey;
        this.keys = keys;
        this.constraints = constraints;
        this.dbOptions = dbOptions;
        this.fields = [];
        this.defaultShowableFields = [];

        this.references = {};
        this.backReferences = {};

        this.schema = schema;

        this.fieldsMap = {};
        fields.forEach(field => this.addField(field));

        if (this.schema){
            this.schema.addModel(this);
        }

        this.connection = connection;

        Object.assign(this, moreProps);
    }

    connect(connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    getConnection(options) {
        options = options || {};

        if (options.transaction) {
            return options.transaction;
        }

        if (!this.connection) {
            this.connection = this.schema ? this.schema.getConnection() : connectors.getDefaultConnector();
        }

        if (options.required && !this.connection) {
            throw new Error(`Cannot find ${this.name} objects, invalid connection.`);
        }

        return this.connection;
    }

    completeReferenceName(refName){
        let suffix = '';

        if (!/(Id|^id)$/.test(refName)) {
            suffix = 'Id';
        }

        return refName + suffix;
    }

    resolveReference(field){
        const reference = field.references;
        delete field.references;

        const refPK = reference.primaryKey && reference.fields.filter(field => reference.primaryKey.indexOf(field.name) !== -1).pop();

        if (!refPK) {
            throw new Error(`Cannot reference ${reference.name} because it has no primary key.`);
        }

        const refName = field.name || reference.singularName || reference.name;
        field.name = field.fieldName || this.completeReferenceName(refName);

        field.type = field.type || refPK.type;

        // re-add to field map, since name may have changed (also this keeps around the old name).
        if (!this.fieldsMap[field.name]) {
            this.fieldsMap[field.name] = field;
        }

        this.linkReference(field.referenceName || refName, field.name, reference);
    }

    linkReference(refName, fieldName, reference) {
        this.references[refName] = { field: fieldName, model: reference };
        reference.backReferences[this.name] = { refName, model: this };
    }

    /** Adds a field
     *  @param {Field} fieldDefinition - the field's definition
     */
    addField(fieldDefinition) {
        if (fieldDefinition.id) {
            delete fieldDefinition.id;
            fieldDefinition.name = fieldDefinition.name || 'id';
            fieldDefinition.type = fieldDefinition.type || 'int';
            fieldDefinition.canBeNull = fieldDefinition.canBeNull || false;
            fieldDefinition.autoIncrement = fieldDefinition.autoIncrement !== undefined ? fieldDefinition.autoIncrement : true;
            fieldDefinition.primaryKey = true;
        }

        if (fieldDefinition.enum) {
            fieldDefinition.type = 'enum';
            fieldDefinition.values = fieldDefinition.enum;
            delete fieldDefinition.enum;
        }

        const field = new Field(fieldDefinition);

        if (field.references instanceof Model) {
            this.resolveReference(field)
        } else if(typeof field.references === 'string'){
            if(this.schema){
                this.schema.addUnresolvedReference(this, field, field.references);
                delete field.references;
            } else {
                throw new Error("String references can only be resolved against a given schema, but this Model belongs to no schema.");
            }
        }

        if (field.name in this.fieldsMap) {
            throw new Error(`Trying to declare field ${field.name}, which already exists.`);
        }

        this.fields.push(field);

        if (field.show === true) {
            this.defaultShowableFields.push(field);
        }

        this.fieldsMap[field.name] = field;

        if (fieldDefinition.primaryKey) {
            if (!this.primaryKey) {
                this.primaryKey = [];
            }
            if (this.primaryKey.indexOf(field.name) === -1) {
                this.primaryKey.push(field.name);
            }
        }
    }

    async findOne(options) {
        options = { ...options };
        options.limit = {
            ...parse.limit(options.limit),
            count: 1,
        };

        const results = await this.find(options);
        return results && results[0];
    }

    async find(options) {
        options = options || {};

        debug("find :: ", this.name, options);

        const db = options.transaction || await this.getConnection();
        if (!db) {
            throw new Error(`Cannot find ${this.name} objects, invalid connection.`);
        }

        const query = this.build_query(options);

        let result = await db.query(query);

        if (this.findPostProcess) {
            result = await Promise.resolve().then(() => this.findPostProcess(result, options));
        }

        if (options.mapRows) {
            result = result.map(options.mapRows);
        }

        return result;
    }

    getReference(key, options){
        const ref = this.references[key];

        if (ref && options && options.aliasPrefix){
            return { ...ref, model: ref.model.withAliasPrefix(options.aliasPrefix) };
        }

        return ref;
    }

    getBackReference(key, options){
        const backRef = this.backReferences[key];

        if (backRef && options && options.aliasPrefix){
            return { ...backRef, model: backRef.model.withAliasPrefix(options.aliasPrefix) };
        }

        return backRef;
    }

    withAliasPrefix(aliasPrefix){
        const aliasedModel = Object.create(this);
        aliasedModel.alias = aliasPrefix + this.alias;
        return aliasedModel;
    }

    /** Builds a query for this model using the given options.
     */
    build_query(options) {
        options = options || {};

        options.show = options.show || options.showOnly;

        const model = options.aliasPrefix ? this.withAliasPrefix(options.aliasPrefix) : this;

        const select = options.showOnly ? [] : this.defaultShowableFields.map(field => ({ table: model.alias, field: field.name }));
        const tableList = new TableListBuilder([{ table: model.name, as: model.alias }]);
        const where = [];
        let query = {
            select,
            from: tableList.list,
            where,
            orderBy: options.orderBy && parse.asArray(options.orderBy).map((item) => {
                const refs = parse.followReferences(item.field || item, model, options);
                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }
                return { table: refs.lastModel.alias, field: refs.field, sort: item.sort };
            }),
            groupBy: options.groupBy && parse.asArray(options.groupBy).map((item) => {
                const refs = parse.followReferences(item.field || item, model, options);
                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }
                return { table: refs.lastModel.alias, field: refs.field, sort: item.sort };
            }),
            distinct: options.selectDistinct,
            random: options.random,
            limit: parse.limit(options.limit),
        };

        if (options.join) {
            parse.asArray(options.join).forEach((item) => {
                const refs = parse.followReferences(item, model, options);

                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }
            });
        }

        if (options.show) {
            parse.asArray(options.show).forEach((item) => {
                const [argument, refs] = parse.showArgument(item, model, options) || [];

                if (refs && refs.showable === false) {
                    throw new Error(`Cannot show field ${refs.field} from model ${refs.lastModel.name}`);
                }

                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }

                if (arguments){
                    select.push(argument);
                }
            });
        }

        ['show', 'orderBy', 'random', 'limit', 'transaction'].forEach((k) => { delete options[k]; });

        where.push(...parse.conditionsList(options, model, tableList, options));

        if (model.findPreprocess) {
            query = model.findPreprocess(query, options) || query;
        }

        console.log(options)
        return query;
    }

    async insert(options) {
        options = options || {};
        const db = options.transaction || await this.getConnection();
        if (!db) {
            throw new Error(`Cannot insert ${this.name} objects, invalid connection.`);
        }

        const query = {
            into: this.name,
            fields: [],
            values: [],
        };

        ['transaction'].forEach((k) => { delete options[k]; });

        const addedFields = {};
        query.values = (options.values || [options]).map(item => Object.entries(item).reduce((_, [key, option]) => {
            let field;
            let value;

            if (this.fieldsMap[key]) {
                field = this.fieldsMap[key].name;
                value = option;
            } else if (this.references[key]) {
                const reference = this.references[key];
                field = reference.field;
                value = option[reference.model.primaryKey[0]];
            }

            if (field) {
                if (!addedFields[field]) {
                    addedFields[field] = true;
                    query.fields.push(field);
                }
            }

            _[field] = value;

            return _;
        }, {}));

        return db.insert(query);
    }

    /** updates already-existing entities of this model.
     * @params {Object} options - options object
     * @params {Array} set - set of fields to change on the model.
     * @params {Array} where - set of conditions limiting the model update.
     * @params {Transaction} transaction - an ongoing transaction, if any
     */
    async update(options) {
        options = options || {};
        const db = options.transaction || await this.getConnection();
        if (!db) {
            throw new Error(`Cannot update ${this.name} objects, invalid connection.`);
        }

        const model = this; // no prefix aliases thank you

        const tableList = new TableListBuilder([{ table: model.name, as: model.alias }]);
        const updatedFields = [];
        const where = [];

        const query = {
            update: tableList.list,
            set: updatedFields,
            where,
            limit: parse.limit(options.limit),
        };

        where.push(...parse.conditionsList(options.where, model, tableList, options));

        ['transaction', 'where'].forEach((k) => { delete options[k]; });

        Object.entries(options.set).forEach(([key, value]) => {
            const [fieldArgument, fieldRefs] = parse.fieldArgument(key, model, options);
            const [valueArgument, valueRefs] = parse.valueArgument(value, model, options);

            updatedFields.push({field: fieldArgument, value: valueArgument});

            if (fieldRefs) {
                fieldRefs.path.forEach(component => tableList.addTable(parse.join(component)));
            }

            if (valueRefs) {
                valueRefs.path.forEach(component => tableList.addTable(parse.join(component)));
            }
        });

        return db.update(query);
    }

    getSchema() {
        return filterKeys({
            name: this.name,
            primaryKey: this.primaryKey,
            keys: this.keys,
            constraints: this.constraints,
            dbOptions: this.dbOptions,
            fields: this.fields.map(field => filterKeys(field)),
        }, x => x !== undefined && (!Array.isArray(x) || x.length));
    }
}

Model.prototype.parse = parse;

module.exports = Model;
