const path = require('path');
const findPackageJson = require('find-package-json');

const filterKeys = require('./filterKeys');

function readPackageJsons(basepath) {
    const jsons = [];
    for (let f = findPackageJson(basepath), packageJson = f.next(); !packageJson.done; packageJson = f.next()) {
        const { simpleOrm } = packageJson.value;
        if (simpleOrm) {
            const json = {};
            const packageJsonDir = path.dirname(packageJson.filename);
            if (simpleOrm.models) {
                json.models = path.resolve(packageJsonDir, simpleOrm.models);
            }
            if (simpleOrm.migrations) {
                json.migrations = path.resolve(packageJsonDir, simpleOrm.migrations);
            }
            jsons.unshift(json);
        }
    }
    return jsons;
}

function computeOptions({
    packageFolder,
    defaultOptions,
    overrides,
}) {
    return Object.assign(
        {},
        defaultOptions,
        ...readPackageJsons(packageFolder),
        filterKeys(overrides),
    );
}

module.exports = computeOptions;
