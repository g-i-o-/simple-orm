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

        this.references = {};
        this.backReferences = {};

        this.fieldsMap = {};
        fields.forEach(field => this.addField(field));

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
            this.connection = connectors.getDefaultConnector();
        }

        if (options.required && !this.connection) {
            throw new Error(`Cannot find ${this.name} objects, invalid connection.`);
        }

        return this.connection;
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

        if (fieldDefinition.references instanceof Model) {
            const reference = fieldDefinition.references;
            const refPK = reference.primaryKey && reference.fields.filter(field => reference.primaryKey.indexOf(field.name) !== -1).pop();

            if (!refPK) {
                throw new Error(`Cannot reference ${reference.name} because it has no primary key.`);
            }

            delete fieldDefinition.references;
            const refName = fieldDefinition.name || reference.singularName || reference.name;
            fieldDefinition.name = refName;
            if (!/Id$/.test(fieldDefinition.name)) {
                fieldDefinition.name += 'Id';
            }

            fieldDefinition.type = fieldDefinition.type || refPK.type;

            this.linkReference(refName, fieldDefinition.name, reference);
        }

        if (fieldDefinition.enum) {
            fieldDefinition.type = 'enum';
            fieldDefinition.values = fieldDefinition.enum;
            delete fieldDefinition.enum;
        }


        const field = new Field(fieldDefinition);
        if (field.name in this.fieldsMap) {
            throw new Error(`Trying to declare field ${field.name}, which already exists.`);
        }

        this.fields.push(field);
        this.fieldsMap[field.name] = fieldDefinition;

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
        const db = await this.getConnection();
        if (!db) {
            throw new Error(`Cannot find ${this.name} objects, invalid connection.`);
        }

        const select = this.fields.map(field => ({ table: this.alias, field: field.name }));
        const tableList = new TableListBuilder([{ table: this.name, as: this.alias }]);
        const where = [];
        let query = {
            select,
            from: tableList.list,
            where,
            orderBy: options.orderBy && parse.asArray(options.orderBy).map((item) => {
                const refs = parse.followReferences(item.field || item, this);
                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }
                return { table: refs.lastModel.alias, field: refs.field, sort: item.sort };
            }),
            random: options.random,
            limit: parse.limit(options.limit),
        };

        if (options.show) {
            parse.asArray(options.show).forEach((item) => {
                const refs = parse.followReferences(item, this);
                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                }
                return { table: refs.lastModel.alias, field: refs.field };
            });
        }

        ['show', 'orderBy', 'random', 'limit', 'transaction'].forEach((k) => { delete options[k]; });

        Object.entries(options).forEach(([key, option]) => {
            if (this.fieldsMap[key]) {
                where.push(parse.condition(this.alias, key, option));
            } else {
                const refs = parse.followReferences(key, this);
                if (refs) {
                    refs.path.forEach(component => tableList.addTable(parse.join(component)));
                    where.push(parse.condition(refs.lastModel.alias, refs.field, option));
                }
            }
        });

        if (this.findPreprocess) {
            query = this.findPreprocess(query, options) || query;
        }

        const result = await db.query(query);

        return this.findPostProcess
            ? this.findPostProcess(result, options)
            : result;
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
