const pairItemsBy = require('../util/pairItemsBy');
const filterKeys = require('../util/filterKeys');

const computeDiff = require('./diff/computeDiff');
const applyDiff = require('./diff/applyDiff');

const pairModelsByName = pairItemsBy(model => model.name);

class MigrationsState {
    constructor(options) {
        this.name = options.name;
        if (options.models) {
            this.models = options.models;
        } else if (options.migration) {
            // compute from migrations graph
            this.dependencies = [options.migration];

            this.models = applyDiff.migration({ migration: options.migration });
        } else {
            this.models = [];
        }
    }

    getMigrationsPath() {
        // const stack = [this];
        // const migrationsPath = [];
        // while (stack.length) {
        //     const currentMigration = migrationsPath.unshift();
        //     if (migration.dependencies) {
        //
        //     }
        // }
    }

    isEmpty() {
        return !this.models.length;
    }

    diff(otherState) {
        const dependencies = [
            ...(this.isEmpty() ? [] : [this]),
            ...(otherState.dependencies || []),
        ];

        const steps = [].concat(...pairModelsByName(
            this.models,
            otherState.models,
        ).map(
            ([_1, _2]) => computeDiff.model(_1, _2),
        ));

        return filterKeys({
            name: otherState.name,
            dependencies,
            steps,
        }, x => x !== undefined && (!Array.isArray(x) || x.length));
    }
}

function createModelsFromMigration(migration) {
    const stack = [migration];
    const migrationsPath = [];
    while (stack.length){
        migrationsPath.unshift(currentMigration);
    }
    if (migration.dependencies) {

    }
    console.log(migration);
    throw new Error('Don\'t know how to create state from migrations.');
}


module.exports = MigrationsState;
