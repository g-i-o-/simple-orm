const connectors = require('./connectors');
const filterKeys = require('./util/filterKeys');
const Field = require('./Field');
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

    getConnection() {
        if (!this.connection) {
            this.connection = connectors.getDefaultConnector();
        }

        return this.connection;
    }

    /** Adds a field
     *  @param {Field} fieldDefinition - the field's definition
     */
    addField(fieldDefinition) {
        const field = new Field(fieldDefinition);
        if (field.name in this.fieldsMap) {
            throw new Error(`Trying to declare field ${field.name}, which already exists.`);
        }

        this.fields.push(field);
        this.fieldsMap[field.name] = fieldDefinition;

        if (field.primaryKey) {
            if (!this.primaryKey) {
                this.primaryKey = [];
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

        let select = [];
        const from = [this.name];
        const where = [];
        const query = {
            select,
            from,
            where,
            orderBy: options.orderBy && parse.asArray(options.orderBy),
            random: options.random,
            limit: options.limit,
        };

        Object.entries(options).forEach(([key, option]) => {
            if (this.fieldsMap[key]) {
                where.push(parse.condition(this.alias, key, option));
            }
        });

        select = this.fields.map(field => field.name);

        const result = await db.query(query);

        return this.findPostProcess
            ? this.findPostProcess(result, options || {})
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

module.exports = Model;
