const debug = require('debug');

const format = require('./format');

const debugSql = debug('simpleOrm:mysql:connector:sql');
const debugResult = debug('simpleOrm:result');

class ConnectionWrapper {
    constructor(connection) {
        this.connection = connection;
    }

    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    async query(query) {
        const sql = format.query(query);
        debugSql(sql);

        return new Promise((resolve, reject) => this.connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                debugResult(result);
                resolve(result);
            }
        }));
    }

    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    async insert(statement) {
        const sql = format.insert(statement);
        debugSql(sql);

        return new Promise((resolve, reject) => this.connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                debugResult(result);
                resolve(result);
            }
        }));
    }

    exec(statement) {
        const sql = format.statement(statement);
        debugSql(sql);

        return new Promise((resolve, reject) => this.connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                debugResult(result);
                resolve(result);
            }
        }));
    }
}


module.exports = ConnectionWrapper;
