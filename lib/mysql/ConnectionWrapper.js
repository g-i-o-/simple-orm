const debug = require('debug');

const format = require('./format');

const debugSql = debug('simpleOrm:mysql:connector:sql');
const debugResult = debug('simpleOrm:result');

class ConnectionWrapper {
    constructor(connection) {
        this.connection = connection;
        this.__id__ = (new Date().getTime());
        this.__ct__ = 0;
    }

    make_tag() {
        return `<${this.__id__}:query #${++this.__ct__}>\n`;
    }

    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    query(query) {
        return this._sql(format.query(query));
    }

    /** Performs a query un a mysql database, and returns a promise resolving to the results. */
    insert(statement) {
        return this._sql(format.insert(statement));
    }

    /** Performs an update query on a mysql database, and returns a promise resolving to the results. */
    update(statement) {
        return this._sql(format.update(statement));
    }

    /** Performs an delete query on a mysql database, and returns a promise resolving to the results. */
    delete(statement) {
        return this._sql(format.delete(statement));
    }

    /** Executes a simple statement on a mysql database, and returns a promise resolving to the results. */
    exec(statement) {
        return this._sql(format.statement(statement));
    }

    /** Executes an sql string statement on a mysql database, and returns a promise resolving to the results. */
    _sql(sql){
        const tag = this.make_tag();
        debugSql(tag, sql);

        return new Promise((resolve, reject) => this.connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
            } else {
                debugResult(tag,
                    Array.isArray(result) && result.length > 10 ?
                    result.slice(0, 10).concat([`... ${result.length - 10} more ...`]) :
                    result
                );
                resolve(result);
            }
        }));
    }
}


module.exports = ConnectionWrapper;
