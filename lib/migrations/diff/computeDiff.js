const pairItemsBy = require('../../util/pairItemsBy');

const pairByIdentity = pairItemsBy(object => object);
const pairByName = pairItemsBy(object => object.name);


/** high order function augments a diffing function with create* and delete* actions.
 *  @param {String} objectType - type to use to complete the create*, delete* actions.
 *  @param {Function} diffFn - diffing function to augment.
 *
 *  @return {Function} diffing function that returns a create${objectType} step if B exists and A doesn't,
 *      a delete${objectType} step if A exists and B doesn't, and otherwise delegates to diffFn.
 */
function makeDiffer(objectType, diffFn) {
    return (itemA, itemB, ...args) => {
        if (itemA && !itemB) {
            return [{ action: `delete${objectType}`, name: itemA.name }];
        } else if (!itemA && itemB) {
            return [{ action: `create${objectType}`, ...itemB }];
        } else if (!itemA && !itemB) {
            return [];
        }

        return diffFn(itemA, itemB, ...args);
    };
}

/** differ that sets B's properties to A if the json representation of A and of B differ.
 *  @param {String} objectType - type of object being diffed
 *  @param {Any} itemA - object to compare.
 *  @param {Any} itemB - object to compare with.
 *
 * @return {Array} If JSON.stringify(A) === JSON.stringify(B), a one element list of a set* action
 *     setting all properties in B to A. An empty list otherwise.
 */
function setIfJSONSDiffer(objectType, itemA, itemB) {
    if (JSON.stringify(itemA) !== JSON.stringify(itemB)) {
        return [{ action: `set${objectType}`, ...itemB }];
    }

    return [];
}

/** higher order function returns a differ that pairs items in two arrays and diffs them.
 *  @param {String} objectType - type of object being diffed
 *  @param {Function} diffFn - diffing function to map to each of the paired elements on the lists.
 *
 * @return {Function} diffing function that takes two arrays containing objectType elements, pairs them by name, and maps the pairing to the given diffing function.
 */
function makePairwiseDiffer(objectType, diffFn) {
    const differ = makeDiffer(objectType, diffFn);
    return (listA, listB, ...args) => [].concat(...pairByName(listA, listB).map((itemA, itemB) => differ(itemA, itemB, ...args)));
}

const computeDiff = {
    /** returns the difference between two models.
     *  @param {Object} modelA - model to compare
     *  @param {Object} modelB - model to compare to
     *
     * @return {Array} Array of different actions that would transform modelA into modelB.
     */
    model: makeDiffer('Model', (modelA, modelB) => {
        const steps = [
            (modelA.name !== modelB.name) && {
                action: 'rename', to: modelB.name,
            },
            (modelA.primaryKey !== modelB.primaryKey) && {
                action: 'setPrimaryKey', to: modelB.primaryKey,
            },
            ...computeDiff.keys(modelA.keys, modelB.keys),
            ...computeDiff.constraints(modelA.constraints, modelB.constraints),
            ...pairByIdentity(Object.keys(modelA.dbOptions || {}), Object.keys(modelB.dbOptions || {})).map((kA, kB) => computeDiff.dbOption(
                kA && modelA.dbOptions[kA],
                kB && modelB.dbOptions[kB],
            )),
            ...computeDiff.fields(modelA.fields, modelB.fields),
        ];
        console.log('Diff Models::\n', 'modelA', modelA, '\nmodelB', modelB, '\nsteps:', JSON.stringify(steps));

        return steps ? [{ action: 'changeModel', model: modelA.name, steps }] : [];
    }),

    /** returns the difference between two lists of keys.
     *  @param {List<Object>} keysA - list of keys to compare
     *  @param {List<Object>} keysB - list of keys to compare to
     *
     * @return {Array} Array of different actions that would transform keysA into keysB.
     */
    keys: makePairwiseDiffer('Key', setIfJSONSDiffer),

    /** returns the difference between two list of constraints.
     *  @param {List<Object>} constraintsA - list of constraints to compare
     *  @param {List<Object>} constraintsB - list of constraints to compare to
     *
     * @return {Array} Array of different actions that would transform constraintsA into constraintsB.
     */
    constraints: makePairwiseDiffer('Constraint', setIfJSONSDiffer),

    /** returns the difference between two dboptions objects.
     *  @param {Object} dbOptionsA - dbOptions object to compare
     *  @param {Object} dbOptionsB - dbOptions object to compare to
     *
     * @return {Array} Array of different actions that would transform dbOptionsA into dbOptionsB.
     */
    dbOption: makePairwiseDiffer('DBOption', setIfJSONSDiffer),

    /** returns the difference between two fields.
     *  @param {Object} fieldA - field to compare
     *  @param {Object} fieldB - field to compare to
     *
     * @return {Array} Array of different actions that would transform fieldA into fieldB.
     */
    fields: makePairwiseDiffer('Field', setIfJSONSDiffer),
};

module.exports = computeDiff;
