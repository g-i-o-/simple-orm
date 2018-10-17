const mysql = require('mysql');
const debug = require('debug');

const format = require('./format');

const debugSql = debug('simpleOrm:mysql:connector:sql');
const debugResult = debug('simpleOrm:result');
const ConnectionWrapper = require('./ConnectionWrapper');

function addJSONTypeSupport(field, next) {
    if (field.type === 'JSON') {
        return JSON.parse(field.string());
    }

    return next();
}

class mysqlConnector {
    constructor(connectionParams) {
        this.type = 'mysql';
        this.connectionParams = connectionParams;
    }

    /** Returns a connection to a mysql database.
     *  @param {Object} params - connection parameters
     *  @param {String} params.host - the mysql host. (default: env.SIMPLE_ORM_HOST)
     *  @param {String} params.user - user to connect as. (default: env.SIMPLE_ORM_USER)
     *  @param {String} params.password - user's password. (default: env.SIMPLE_ORM_PASSWORD)
     *  @param {String} params.database - database to connect to. (default: env.SIMPLE_ORM_DATABASE)
     *  @returns {Promise} resolving when the connection is established.
     */
    connect(params) {
        this.pool = new ConnectionWrapper(mysql.createPool({
            ...{
                connectionLimit: process.env.SIMPLE_ORM_POOL_LIMIT,
                host: process.env.SIMPLE_ORM_HOST,
                user: process.env.SIMPLE_ORM_USER,
                password: process.env.SIMPLE_ORM_PASSWORD,
                database: process.env.SIMPLE_ORM_DATABASE,
                typeCast: addJSONTypeSupport,
            },
            ...params,
        }));
        return Promise.resolve();
    }

    /** Returns wether the connector is connected to the database or not.
     *  @returns {Bool} true if the connector is connected, false otherwise.
     */
    isConnected() {
        return !!this.pool;
    }

    /** Disconnectes the connector from the database.
     *  @returns {Promise} resolving when the connector is disconnected from the database.
     */
    disconnect() {
        if (!this.pool) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => this.pool.connection.end((err) => {
            this.pool = null;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
    }



    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    async query(query) {
        if (!this.isConnected()) {
            await this.connect();
        }

        return this.pool.query(query);
    }

    async insert(statement) {
        if (!this.isConnected()) {
            await this.connect();
        }

        return this.pool.insert(statement);
    }

        debugSql(sql);

        return new Promise((resolve, reject) => this.pool.query(sql, data, (err, result) => {
            if (err) {
                reject(err);
            } else {
                debugResult(result);
                resolve(result);
            }
        }));
    }
}

module.exports = mysqlConnector;
