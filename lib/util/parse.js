const _debug = require('debug');
const debug = _debug('simpleOrm:parse');

const parse = {
    alias(name) {
        return name[0].toUpperCase() + name.substr(1).replace(/[^A-Z]/g, '');
    },

    showArgument(item, model, options){
        if (item.asIs) {
            return [item.asIs];
        }

        const item_as = item.as;
        if (item_as) {
            delete item.as;
        }

        if (item.func) {
            const argrefs = (item.args || []).map(arg => parse.showArgument(arg, model, options))
            return [
                {func:item.func, args:argrefs.map(argref => argref[0]), as:item_as},
                {
                    path: argrefs.reduce((_, [_1, ref]) => {
                        if(ref) {
                            _.push.apply(_, ref.path)
                        }
                        return _;
                    }, []),
                    showable: argrefs.reduce((a, b) => (a && b[1] && b[1].showable), true)
                }
            ];
        } else if(Object.keys(item).length === 1){
            const func = Object.keys(item);
            return parse.showArgument({ func, args:item[func], as:item_as }, model, options);
        }

        const refs = parse.followReferences(item, model, options);
        if(refs){
            refs.showable = refs.lastModel.fieldsMap[refs.field].canBeShown;
        }
        return refs && [{ table: refs.lastModel.alias, field: refs.field, as:item_as }, refs]
    },

    followReferences(key, model, options) {
        let currentModel = model;

        const comps = key.split('.');
        const path = [];
        let field = null;
        debug('following references ', comps);
        while (comps.length) {
            let comp = comps.shift();
            let joinType = '';
            if (comp[0] === '?') { // left join
                comp = comp.substr(1);
                joinType = 'left';
            } else if(comp[comp.length - 1] === '?') {
                comp = comp.substr(0, comp.length - 1);
                joinType = 'right';
            }

            const ref = currentModel.getReference(comp, options);
            const backRef = currentModel.getBackReference(comp, options);

            debug(` :: ${currentModel.name} :${joinType}: ${comp}`);
            debug('   :: refs :: ', Object.keys(currentModel.references));
            debug('   :: back refs :: ', Object.keys(currentModel.backReferences));
            if (ref) {
                debug('   -- found ref');
                path.push({ from: currentModel, key: comp, joinType, ref });
                currentModel = ref.model;
            } else if (backRef) {
                debug('   -- found backRef');
                path.push({ from: currentModel, key: comp, joinType, backRef });
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
        joinType,
        from: entryFrom,
    }) {
        let join;
        if (ref) {
            join = parse.referenceJoin(entryFrom, ref, joinType);
        } else if (backRef) {
            join = parse.backReferenceJoin(entryFrom, backRef, joinType);
        }

        return join;
    },

    referenceJoin(entryFrom, ref, joinType) {
        const { model: refModel } = ref;
        return ({
            join: joinType || true,
            table: refModel.name,
            as: refModel.alias,
            on: {
                lhs: { table: entryFrom.alias, field: ref.field },
                op: '=',
                rhs: { table: refModel.alias, field: refModel.primaryKey[0] },
            },
        });
    },

    backReferenceJoin(entryFrom, backRef, joinType) {
        const { model: backRefModel } = backRef;
        const backRefRef = backRefModel.references[backRef.refName];
        return ({
            join: joinType || true,
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
