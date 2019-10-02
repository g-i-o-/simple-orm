const mysql = require('mysql');
const debug = require('debug')('simpleOrm:mysql:connector:lifecycle');

const Transaction = require('./Transaction');
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
        if(process.env.SIMPLE_ORM_USE_POOL){
            debug(`Creating new mysql connection pool (${process.env.SIMPLE_ORM_POOL_LIMIT || 'unlimited'} connections)`);
            this.using_pool = true;
            this.connection = new ConnectionWrapper(mysql.createPool({
                ...{
                    connectionLimit: process.env.SIMPLE_ORM_POOL_LIMIT,
                    timeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    connectTimeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    acquireTimeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    host: process.env.SIMPLE_ORM_HOST,
                    user: process.env.SIMPLE_ORM_USER,
                    password: process.env.SIMPLE_ORM_PASSWORD,
                    database: process.env.SIMPLE_ORM_DATABASE,
                    typeCast: addJSONTypeSupport,
                },
                ...params,
            }));
            return Promise.resolve();
        } else {
            debug('Creating new mysql connection');
            this.connection = new ConnectionWrapper(mysql.createConnection({
                ...{
                    timeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    connectTimeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    acquireTimeout: (process.env.SIMPLE_ORM_TIMEOUT | 0) || 10000,
                    host: process.env.SIMPLE_ORM_HOST,
                    user: process.env.SIMPLE_ORM_USER,
                    password: process.env.SIMPLE_ORM_PASSWORD,
                    database: process.env.SIMPLE_ORM_DATABASE,
                    typeCast: addJSONTypeSupport,
                },
                ...params,
            }));
        }
    }

    /** Returns wether the connector is connected to the database or not.
     *  @returns {Bool} true if the connector is connected, false otherwise.
     */
    isConnected() {
        return !!this.connection;
    }

    /** Disconnectes the connector from the database.
     *  @returns {Promise} resolving when the connector is disconnected from the database.
     */
    disconnect() {
        if (!this.connection) {
            debug('Trying to disconnect mysql connection, but its set to null');
            return Promise.resolve();
        }

        debug(`Disconnecting mysql connection${this.using_pool ? ' pool' : ''}`);
        return new Promise((resolve, reject) => this.connection.connection.end((err) => {
            this.connection = null;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
    }

    /** performs a transaction in the database and commits it when finished.
     *  @param {Function} operation - (Transaction) => Promise function that recieves a
     *          transaction object, performs some action with it, and returns a Promise
     *          that resolves after performing those actions.
     */
    async performTransaction(operation) {
        if (!this.isConnected()) {
            await this.connect();
        }

        const is_pooled_connection = this.connection.using_pool;
        const connection = await new Promise((resolve, reject) => {
            if (is_pooled_connection) {
                this.connection.connection.getConnection((err, connection) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(connection);
                    }
                });
            } else {
                resolve(this.connection.connection);
            }
        });

        const transaction = new Transaction(connection);
        let error;
        let result;

        try {
            result = transaction.performTransaction(operation);
        } catch (operror) {
            error = operror;
        }

        if (is_pooled_connection) {
            connection.release();
        }

        if (error) {
            throw error;
        }

        return result;
    }

    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    async query(query) {
        if (!this.isConnected()) {
            await this.connect();
        }

        return this.connection.query(query);
    }

    async insert(statement) {
        if (!this.isConnected()) {
            await this.connect();
        }

        return this.connection.insert(statement);
    }

    async update(statement) {
        if (!this.isConnected()) {
            await this.connect();
        }

        return this.connection.update(statement);
    }
}


module.exports = mysqlConnector;
