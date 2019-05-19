#!/usr/bin/env node
const commander = require('commander');

const computeOptions = require('../lib/util/computeOptions');

const loadModels = require('../lib/util/loadModels');
const connectors = require('../lib/connectors');

commander.version('0.0.1')
    .usage('[options] [model1 model2 ...]')
    .option('-l, --ls', 'List models only')
    .option('-c, --connector <connector-type>', 'Connector type')
    .option('-m, --models <models-path>', 'models path')
    .option('-p, --package <package-json>', 'package json lookup path]')
    .parse(process.argv);

const options = computeOptions({
    defaultOptions: {
        models: './models',
    },
    packageFolder: commander.package,
    overrides: {
        type: commander.connector,
        models: commander.models,
    },
});

const connector = connectors.getConnector(options);
const selectedModels = commander.args.length ? commander.args : null;

const models = loadModels(options.models)
    .filter(selectedModels ? (module => selectedModels.indexOf(module.name) !== -1) : (() => true));

if (commander.ls) {
    console.log(`Connector: ${connector.type}`);
    console.log(`Models:\n  - ${models.map(model => model.name).join('\n  - ')}`);
} else {
    console.log(models.map(model => connector.showCreateModel(model)).join('\n\n'));
}
