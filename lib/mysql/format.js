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

const statements = {
    begin: 'BEGIN',
    commit: 'COMMIT',
    rollback: 'ROLLBACK',
};

const format = {
    format: mysql.format.bind(mysql),
    escape: mysql.escape.bind(mysql),
    escapeId: mysql.escapeId.bind(mysql),

    statement(statement) {
        const keys = Object.keys(statement);
        if (keys.length === 1 && statements[keys[0]]) {
            return `${statements[keys[0]]};`;
        }

        throw new Error('Invalid Statement');
    },

    insert(statement) {
        const {
            into,
            fields,
            values,
        } = statement;

        return `INSERT INTO ${format.escapeId(into)}(${fields.map(format.escapeId).join(', ')}) VALUES \n    (${values.map(
            item => fields.map(field => format.term(item[field])).join(', '),
        ).join('),\n    (')});`;
    },

    update(statement) {
        const {
            update,
            set,
            where,
            limit,
        } = statement;

        return [
            `UPDATE ${update.map(format.from).join('\n')}\n`,
            `   SET ${set.map(format.fieldUpdate).join(', ')}\n`,
            (where && where.length ? `WHERE (${where.map(format.condition).join(') AND (')})\n` : ''),
            (limit ? `LIMIT ${limit.count | 0}\n` : ''),
            ';',
        ].join('');
    },

    delete(statement) {
        const {
            delete: _delete,
            from,
            where,
            orderBy,
            limit,
        } = statement;

        return [
            `DELETE ${_delete ? _delete.map(format.fromAlias).join(', ') : ''}\n`,
            `FROM ${from.map(format.from).join('\n')}\n`,
            (where && where.length ? `WHERE (${where.map(format.condition).join(') AND (')})\n` : ''),
            (limit ? `LIMIT ${limit.count | 0}\n` : ''),
            ';',
        ].join('');
    },

    query(query) {
        if (typeof query === 'string') {
            return query;
        }

        return format.selectExpression(query) + ';';
    },

    selectExpression(query) {
        if (typeof query === 'string') {
            return query;
        }

        const {
            select,
            from,
            where,
            groupBy,
            limit,
            distinct,
            random,
        } = query;

        let {
            orderBy,
        } = query;

        if (random) {
            (orderBy || (orderBy = [])).push({ func: 'RAND' });
        }

        return [
            (distinct ? 'SELECT DISTINCT ' : 'SELECT '), (select && select.length ? select.map(format.selectTerm).join(', ') : '*'), '\n',
            'FROM ', from.map(format.from).join('\n'), '\n',
            (where && where.length ? `WHERE (${where.map(format.condition).join(') AND (')})\n` : ''),
            (groupBy && groupBy.length ? `GROUP BY ${groupBy.map(format.orderby).join(', ')}\n` : ''),
            (orderBy && orderBy.length ? `ORDER BY ${orderBy.map(format.orderby).join(', ')}\n` : ''),
            (limit ? `LIMIT ${limit.offset | 0}, ${limit.count | 0}\n` : ''),
        ].join('');
    },

    joinNonEmpty: (list, sep) => list.filter(_ => !!_).join(sep),

    from: (from) => {
        if (typeof from === 'string') {
            return from;
        }

        const {
            join,
            table,
            as,
            on,
        } = from;

        return `${JOINS[join] || ''} ${format.escapeId(table)} ${as ? format.escapeId(as) : ''} ${on ? `ON ${format.condition(on)}` : ''}`;
    },

    fromAlias: (from) => {
        if (typeof from === 'string') {
            return from;
        }

        const { table, as } = from;

        return `${as ? format.escapeId(as) : format.escapeId(table)}`;
    },

    orderby: orderByTerm => `${format.term(orderByTerm)} ${SORT_TYPES[orderByTerm.sort] || ''}`,

    condition: ({ lhs, op, rhs }) => format.conditionByOp[op.toUpperCase()](lhs, rhs),
    conditionByOp: {
        NOT: lhs => `NOT ${format.term(lhs)}`,
        IN: (lhs, rhs) => `${format.term(lhs)} IN (${format.term(rhs)})`,
        IN_QUERY: (lhs, rhs) => `${format.term(lhs)} IN (${format.selectExpression(rhs)})`,
        BETWEEN: (lhs, rhs) => `${format.term(lhs)} BETWEEN ${format.term(rhs[0])} AND ${format.term(rhs[1])}`,
        ...(['IS', 'IS NOT', '=', '!=', '<', '<=', '>', '>='].reduce((_, op) => {
            _[op] = (lhs, rhs) => `${format.term(lhs)} ${op} ${format.term(rhs)}`;
            return _;
        }, {})),
    },
    selectTerm: term => `${format.term(term)}${term && term.as ? ` AS ${format.escapeId(term.as)}` : ''}`,
    field: ({table, field}) => format.escapeId(table ? `${table}.${field}` : field),
    term: (term) => {
        if (term === undefined || term === null) {
            return 'NULL';
        } else if (term.field) {
            return format.field(term);
        } else if (term.asIs) {
            return term.asIs;
        } else if (term.func) {
            return `${term.func}(${(term.args || []).map(format.term).join(', ')})`;
        } else if (Object.prototype.hasOwnProperty.call(term, 'value')) {
            return format.escape(term.value);
        }

        return format.escape(term);
    },

    fieldUpdate: ({ field, value }) => `${format.field(field)} = (${format.term(value)})`,

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
