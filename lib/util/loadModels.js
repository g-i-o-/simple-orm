const fs = require('fs');
const path = require('path');
const debug = require('debug')('simpleOrm:util:loadModels');

const Model = require('../Model');

function loadModels(modelsBaseDir) {
    debug('Getting all models in ', modelsBaseDir);
    const files = [modelsBaseDir];
    const models = [];
    while (files.length) {
        const file = files.shift();
        const fileStat = fs.statSync(file);
        if (fileStat.isDirectory()) {
            files.push(...fs.readdirSync(file).map(
                subdirFile => path.join(file, subdirFile),
            ));
        } else if (fileStat.isFile() && /\.js$/.test(file)) {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            const module = require(file);
            if (module instanceof Model) {
                models.push(module.getSchema());
            }
        }
    }

    return models;
}

module.exports = loadModels;
