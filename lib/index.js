const connectors = require('./connectors');
const Model = require('./Model');
const Schema = require('./Schema');


const simpleOrm = {
    Model,
    Schema,
    ...connectors,
};

module.exports = simpleOrm;
