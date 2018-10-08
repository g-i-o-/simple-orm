const parse = {
    alias(name) {
        return name[0].toUpperCase() + name.substr(1).replace(/[^A-Z]/g, '');
    },

    followReferences(key, model) {
        let currentModel = model;
        const comps = key.split('.');
        const path = [];
        let field = null;
        while (comps.length) {
            const comp = comps.shift();
            const ref = currentModel.references[comp];
            const backRef = currentModel.backReferences[comp];

            if (ref) {
                path.push({ from: currentModel, key: comp, ref });
                currentModel = ref.model;
            } else if (backRef) {
                path.push({ from: currentModel, key: comp, backRef });
                currentModel = backRef.model;
            } else if (!comps.lenght) {
                field = comp;
            } else {
                return null;
            }
        }

        if (!field) {
            [field] = currentModel.primaryKey;
        }

        if (!currentModel.fieldsMap[field]) {
            return null;
        }

        return { path, lastModel: currentModel, field };
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
