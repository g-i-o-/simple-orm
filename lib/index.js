const connectors = require('./connectors');
const Model = require('./Model');


const simpleOrm = {
    Model,
    connectors,
};

module.exports = simpleOrm;
