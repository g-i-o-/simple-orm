#!/usr/bin/env node

const path = require('path');
const commander = require('commander');
const findPackageJson = require('find-package-json');

const MigrationMaker = require('../lib/migrations/MigrationMaker');

commander.version('0.0.1')
    .option('--dry-run', 'perform a dry run')
    .option('--verbose', 'verbose mode')
    .option('--models [models-path]', 'models path')
    .option('--migrations [migrations-path]', 'migrations path')
    .option('--package package-json', 'package json lookup path]')
    .parse(process.argv);

const defaultOptions = {
    models: './models',
    migrations: './migrations',
};

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

const simpleOrmOptions = Object.assign({}, defaultOptions, ...readPackageJsons(commander.package))

simpleOrmOptions.models = commander.models || simpleOrmOptions.models;
simpleOrmOptions.migrations = commander.migrations || simpleOrmOptions.migrations;
simpleOrmOptions.dryRun = commander.dryRun;
simpleOrmOptions.verbose = commander.verbose;

const mm = new MigrationMaker(simpleOrmOptions);

mm.makeMigration();
