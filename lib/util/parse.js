const _debug = require('debug');
const debug = _debug('simpleOrm:parse');

const parse = {
    alias(name) {
        return name[0].toUpperCase() + name.substr(1).replace(/[^A-Z]/g, '');
    },

    followReferences(key, model, options) {
        let currentModel = model;

        const comps = key.split('.');
        const path = [];
        let field = null;
        debug('following references ', comps);
        while (comps.length) {
            let comp = comps.shift();

            const ref = currentModel.getReference(comp, options);
            const backRef = currentModel.getBackReference(comp, options);

            debug(` :: ${currentModel.name} :: ${comp}`);
            debug('   :: refs :: ', Object.keys(currentModel.references));
            debug('   :: back refs :: ', Object.keys(currentModel.backReferences));
            if (ref) {
                debug('   -- found ref');
                path.push({ from: currentModel, key: comp, ref });
                currentModel = ref.model;
            } else if (backRef) {
                debug('   -- found backRef');
                path.push({ from: currentModel, key: comp, backRef });
                currentModel = backRef.model;
            } else if (!comps.length) {
                debug('   -- found leaf');
                field = comp;
            } else {
                debug('   -- not found on model', currentModel.name);
                return null;
            }
        }

        if (!field) {
            debug('   -- using primary');
            [field] = currentModel.primaryKey;
        }

        if (!currentModel.fieldsMap[field]) {
            debug('   -- field, ', field, ' not found');
            return null;
        }

        debug('   -- ', { path, field });
        return { path, lastModel: currentModel, field };
    },

    join({
        ref,
        backRef,
        from: entryFrom,
    }) {
        let join;
        if (ref) {
            join = parse.referenceJoin(entryFrom, ref);
        } else if (backRef) {
            join = parse.backReferenceJoin(entryFrom, backRef);
        }

        return join;
    },

    referenceJoin(entryFrom, ref) {
        const { model: refModel } = ref;
        return ({
            join: true,
            table: refModel.name,
            as: refModel.alias,
            on: {
                lhs: { table: entryFrom.alias, field: ref.field },
                op: '=',
                rhs: { table: refModel.alias, field: refModel.primaryKey[0] },
            },
        });
    },

    backReferenceJoin(entryFrom, backRef) {
        const { model: backRefModel } = backRef;
        const backRefRef = backRefModel.references[backRef.refName];
        return ({
            join: true,
            table: backRefModel.name,
            as: backRefModel.alias,
            on: {
                lhs: { table: entryFrom.alias, field: entryFrom.primaryKey[0] },
                op: '=',
                rhs: { table: backRefModel.alias, field: backRefRef.field },
            },
        });
    },


    asArray(value) {
        return Array.isArray(value) ? value : [value];
    },

    condition(table, field, options) {
        const condition = {
            lhs: { table, field },
            op: null,
            rhs: null,
        };

        if (typeof options !== 'object'
            || options instanceof String
            || options instanceof Number
            || options instanceof Date
            || options === null
            || options === undefined
        ) {
            condition.op = '=';
            condition.rhs = { value: options };
        } else if (Array.isArray(options)) {
            condition.op = 'IN';
            condition.rhs = { value: options };
        } else if (Object.keys(options).length === 1) {
            const [op] = Object.keys(options);
            condition.op = op;
            condition.rhs = options[op];
        } else {
            condition.op = options.op;
            condition.rhs = options.rhs;
        }

        return condition;
    },

    limit(limit) {
        if (typeof limit === 'object') {
            return limit;
        } else if (limit !== undefined) {
            return { count: limit };
        }

        return undefined;
    },
};

module.exports = parse;
