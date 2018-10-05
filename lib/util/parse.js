const parse = {
    asArray(value) {
        return Array.isArray(value) ? value : [value];
    },

    condition(field, options) {
        const condition = {
            lhs: { field },
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
};

module.exports = parse;
