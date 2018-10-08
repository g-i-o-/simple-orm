const mysql = require('mysql');


const SORT_TYPES = {
    asc: 'ASC',
    desc: 'DESC',
};

const ON_ACTIONS = {
    noAction: 'NO ACTION',
    cascade: 'CASCADE',
};

const JOINS = {
    true: 'JOIN',
    left: 'LEFT JOIN',
    right: 'RIGHT JOIN',
    inner: 'INNER JOIN',
    outer: 'OUTER JOIN',
};

const format = {
    format: mysql.format.bind(mysql),
    escape: mysql.escape.bind(mysql),
    escapeId: mysql.escapeId.bind(mysql),

    joinNonEmpty: (list, sep) => list.filter(_ => !!_).join(sep),

    from: (from) => {
        if (typeof from === 'string') {
            return from;
        }

        const { join, table, as, on } = from;

        return `${JOINS[join]} ${table} ${as || ''} ${on ? format.condition(on) : ''}`;
    },

    orderby: orderByTerm => `${format.term(orderByTerm)} ${SORT_TYPES[orderByTerm.sort] || ''}`,

    condition: ({ lhs, op, rhs }) => format.conditionByOp[op.toUpperCase()](lhs, rhs),
    conditionByOp: {
        NOT: lhs => `NOT ${format.term(lhs)}`,
        BETWEEN: (lhs, rhs) => `${format.term(lhs)} BETWEEN ${format.term(rhs[0])} AND ${format.term(rhs[1])}`,
        ...(['=', '!=', '<', '<=', '>', '>='].reduce((_, op) => {
            _[op] = (lhs, rhs) => `${format.term(lhs)} ${op} ${format.term(rhs)}`;
            return _;
        }, {})),
    },
    term: (term) => {
        if (term === undefined || term === null) {
            return 'NULL';
        } else if (term.field) {
            return format.escapeId(term.table ? `${term.table}.${term.field}` : term.field);
        } else if (term.asIs) {
            return term.asIs;
        } else if (term.func) {
            return `${term.func}(${(term.args || []).map(format.term).join(', ')})`;
        } else if (term.value) {
            return format.escape(term.value);
        }

        return format.escape(term);
    },

    description: {
        primaryKey(primaryKey) {
            return `PRIMARY KEY (${(Array.isArray(primaryKey) ? primaryKey : [primaryKey]).map(
                pk => format.escapeId(pk),
            ).join(', ')})`;
        },

        dbOption(option, value) {
            const optionCC = option.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
            return `${optionCC}=${format.escape(value)}`;
        },

        field(field) {
            return format.joinNonEmpty([
                format.escapeId(field.name),
                `${
                    field.type.toUpperCase()
                }${
                    field.type === 'enum' ? `(${
                        field.values.map(value => format.escape(value))
                    })` : ''
                }`,
                field.canBeNull ? 'NULL' : 'NOT NULL',
                field.autoIncrement && 'AUTO_INCREMENT',
                field.default !== undefined && `DEFAULT ${format.escape(field.default)}`,
            ], ' ');
        },

        key(key) {
            return [
                'KEY', format.escapeId(key.name), `(${key.fields.map(
                    field => format.joinNonEmpty([
                        format.escapeId(typeof field === 'string' ? field : field.name),
                        SORT_TYPES[field.sort],
                    ], ' '),
                ).join(', ')})`,
            ].join(' ');
        },

        constraint(constraint) {
            return [
                'CONSTRAINT', format.escapeId(constraint.name),
                format.description.constraintByType[constraint.type](constraint),
            ].join(' ');
        },

        constraintByType: {
            foreignKey: ({
                field,
                references,
                onDelete,
                onUpdate,
            }) => [
                'FOREIGN KEY', `(${format.escapeId(field)})`,
                'REFERENCES', format.escapeId(references.table), `(${format.escapeId(references.field)})`,
                'ON DELETE', ON_ACTIONS[onDelete],
                'ON UPDATE', ON_ACTIONS[onUpdate],
            ].join(' '),
        },

        alteration([alteration, payload]) {
            const byType = format.description.alterationByType[alteration];
            return byType ? byType(payload) : '';
        },

        alterationPositional: (field) => {
            if (field.first) {
                return ' FIRST';
            } else if (field.after) {
                return ` AFTER ${format.escapeId(field.after)}`;
            }

            return '';
        },

        alterationByType: {
            dropColumn: field => `DROP COLUMN ${format.escapeId(field.name)}`,
            addColumn: field => `ADD COLUMN ${format.description.field(field)}${format.description.alterationPositional(field)}`,
            changeColumn: field => `CHANGE COLUMN ${format.escapeId(field.oldName)} ${format.description.field(field)}${format.description.alterationPositional(field)}`,
        },
    },
};

module.exports = format;
