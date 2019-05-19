/** Utility functions for applying diffs.
 */
const applyDiff = {
    /** Applies the migration specified in options to the list of models specified in options.
     * @param {Object} options - options object.
     * @param {Array<Model>} options.models - list of models to apply a diff to.
     * @param {Array<Step>} options.migration - migration to apply to the list of models.
     * @param {Any} options.* - options passed to applyDiff.step for each step.
     * @return {Array<Model>} list of models, after applying the given migration.
     */
    migration: (options) => {
        const { migration } = options;
        const models = options.models || [];
        ((migration || {}).steps || []).forEach((step) => {
            applyDiff.step({ ...options, step, models });
        });

        return models;
    },

    step: (options) => {
        const { step } = options;
        const stepActionFn = applyDiff.stepByAction[step.action];

        if (!stepActionFn) {
            throw new Error(`Unknown action ${step.action}.`);
        }

        stepActionFn(options);
    },

    stepByAction: {
        applyMigration: ({ step, ...options }) => {
            const { migration } = options;
            const toApply = migration.dependencies.find(item => item.name === step.migration);

            if (!toApply) {
                throw new Error(`Could not apply migration ${step.migration}. The migration was not found.`);
            }

            applyDiff.migration({ ...options, migration: toApply });
        },
        createModel: ({ step, models, connection }) => {
            const { action, ...model } = step;
            const idx = models.reduce((_, item, modelIdx) => (item.name === model.name ? modelIdx : _), -1);

            if (idx !== -1) {
                throw new Error(`Can't apply action ${step.action} for model ${step.name}, since it already exists.`);
            }

            if (connection) {
                throw new Error('Not Fully Implemented');
            }

            models.push(model);
        },
        insertData: ({ step, models, connection }) => {
            if (connection) {
                throw new Error('Not Fully Implemented');
            }

            console.log(models);
        }
    },
    //
    // model: makeDiffer('Model', (modelA, modelB) => {
    //     const steps = [
    //         (modelA.name !== modelB.name) && {
    //             action: 'rename', to: modelB.name,
    //         },
    //         (modelA.primaryKey !== modelB.primaryKey) && {
    //             action: 'setPrimaryKey', to: modelB.primaryKey,
    //         },
    //         ...applyDiff.keys(modelA.keys, modelB.keys),
    //         ...applyDiff.constraints(modelA.constraints, modelB.constraints),
    //         ...pairByIdentity(Object.keys(modelA.dbOptions), Object.keys(modelB.dbOptions)).map((kA, kB) => applyDiff.dbOption(
    //             kA && modelA.dbOptions[kA],
    //             kB && modelB.dbOptions[kB],
    //         )),
    //         ...applyDiff.fields(modelA.fields, modelB.fields),
    //     ];
    //
    //     return steps ? [{ action: 'changeModel', model: modelA.name, steps }] : [];
    // }),
    // keys: makePairwiseDiffer('Key', setIfJSONSDiffer),
    // constraints: makePairwiseDiffer('Constraint', setIfJSONSDiffer),
    // dbOption: makePairwiseDiffer('DBOption', setIfJSONSDiffer),
    // fields: makePairwiseDiffer('Field', setIfJSONSDiffer),
};

module.exports = applyDiff;
