const mysql = require('mysql');
const debug = require('debug');

const format = require('./format');

const debugSql = debug('simpleOrm:mysql:connector:sql');
const debugResult = debug('simpleOrm:result');

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
        this.pool = mysql.createPool({
            ...{
                connectionLimit: process.env.SIMPLE_ORM_POOL_LIMIT,
                host: process.env.SIMPLE_ORM_HOST,
                user: process.env.SIMPLE_ORM_USER,
                password: process.env.SIMPLE_ORM_PASSWORD,
                database: process.env.SIMPLE_ORM_DATABASE,
                typeCast: addJSONTypeSupport,
            },
            ...params,
        });
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

        return new Promise((resolve, reject) => this.pool.end((err) => {
            this.pool = null;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        }));
    }


    async query({
        select,
        from,
        where,
        data,
        groupBy,
        orderBy,
        limit,
        random,
    }) {
        if (!this.isConnected()) {
            await this.connect();
        }

        if (random) {
            (orderBy || (orderBy = [])).push({ func: 'RAND' });
        }

        const sql = [
            'SELECT ', (select && select.length ? select.join(', ') : '*'), '\n',
            'FROM ', from.join('\n'), '\n',
            (where && where.length ? `WHERE (${where.map(format.condition).join(') AND (')})\n` : ''),
            (groupBy && groupBy.length ? `GROUP BY ${groupBy.map(format.orderby).join(', ')}\n` : ''),
            (orderBy && orderBy.length ? `ORDER BY ${orderBy.map(format.orderby).join(', ')}\n` : ''),
            (limit ? `LIMIT ${limit.offset | 0}, ${limit.count | 0}\n` : ''),
            ';',
        ].join('');

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
