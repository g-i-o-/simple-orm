
// const debug = require('debug')('simpleOrm:migrations:MigrationMaker');
const debug = console.log.bind(console);

const MigrationsGraph = require('./MigrationsGraph');
const MigrationState = require('./MigrationState');

const loadModels = require('../util/loadModels');

/** Utility class for making migrations.
 */
class MigrationMaker {
    constructor({ models, migrations, ...options }) {
        this.paths = {
            models,
            migrations,
        };
        this.options = options;
    }

    makeMigration() {
        debug('Im making a migration...');

        if (this.options.dryRun) {
            debug('Running dry');
        }

        debug('Loading migrations graph');
        const graph = new MigrationsGraph(this.paths.migrations);
        debug('    migrations found:', graph.list.length);

        debug('validating graph');
        graph.validate();

        const lastMigrationsState = new MigrationState({ migration: graph.leafMigrations[0] });

        debug('Computing current state');
        const currentState = new MigrationState({
            name: `${graph.list.length + 1}-${this.options.name || (`auto-${new Date().getTime()}`)}`,
            models: loadModels(this.paths.models),
        });
        debug('    models found:', currentState.models.length);


        debug('Computing diff');
        const newMigration = lastMigrationsState.diff(currentState);

        debug('Adding diff to graph');
        graph.addMigration(newMigration);

        if (this.options.verbose) {
            debug(newMigration);
        }

        if (!this.options.dryRun) {
            graph.save();
        }
    }
}

module.exports = MigrationMaker;
