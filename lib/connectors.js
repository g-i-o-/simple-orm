const CONNECTOR_MODULES = {
    mysql: './mysql',
};

/** Returns a connector to a database.
 * @param {Object} params - connector parameters.
 * @param {String} params.type - type of connector to use. Defaults to
 * @param {Object} ...params.connectionParams - parameters to use for
 *                 connecting to the database.
 */
function getConnector(params) {
    const { type, connectionParams } = params || {};
    const databaseType = type || process.env.SIMPLE_ORM_DATABASE_TYPE;

    if (!databaseType) {
        throw new Error('Unable to get connector, database type not given and no default has been defined.');
    }

    const module = CONNECTOR_MODULES[databaseType];

    if (!module) {
        throw new Error(`Unknown database type ${databaseType}.`);
    }

    // eslint-disable-next-line global-require, import/no-dynamic-require
    const ConnectorClass = require(module);
    return new ConnectorClass(connectionParams);
}

let defaultConnector = null;

/** Returns a default connector singleton instance.
 */
function getDefaultConnector() {
    if (!defaultConnector) {
        defaultConnector = getConnector();
    }
    return defaultConnector;
}

module.exports.getConnector = getConnector;
module.exports.getDefaultConnector = getDefaultConnector;
