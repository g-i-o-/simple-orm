const debug = require('debug')('simpleOrm:mysql:transaction');
const ConnectionWrapper = require('./ConnectionWrapper');

class Transaction {
    constructor(connection) {
        this.connection = new ConnectionWrapper(connection);
        this.counter = 0;
    }

    async begin() {
        this.counter += 1;
        if (this.counter === 1) {
            debug('Transaction started.');
            await this.exec({ begin: true });
        } else {
            debug(`Sub-Transaction started. depth: ${this.counter}`);
        }
    }

    async end(error) {
        if (this.counter === 1) {
            debug('Transaction ended.');
            this.counter -= 1;
            if (error) {
                await this.exec({ rollback: true });
            } else {
                await this.exec({ commit: true });
            }
        } else {
            debug(`Sub-Transaction started. depth: ${this.counter}`);
            this.counter -= 1;
        }
    }

    async performTransaction(operation) {
        let error;
        let result;

        await this.begin();

        try {
            result = await operation(this);
        } catch (operror) {
            error = operror;
        }

        await this.end(error);

        if (error) {
            throw error;
        }

        return result;
    }

    query(statement) {
        return this.connection.query(statement);
    }

    exec(statement) {
        return this.connection.exec(statement);
    }

    insert(statement) {
        return this.connection.insert(statement);
    }

    update(statement) {
        return this.connection.update(statement);
    }
}


module.exports = Transaction;
