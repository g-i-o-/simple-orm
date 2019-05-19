const format = require('./format');

const makeCreateTableQuery = model => [
    format.format('CREATE TABLE ?? (', [model.name]),
    `    ${format.joinNonEmpty([
        ...model.fields.map(format.description.field),
        model.primaryKey && format.description.primaryKey(model.primaryKey),
        ...(model.keys || []).map(format.description.key),
        ...(model.constraints || []).map(format.description.constraint),
    ], ',\n    ')}`,
    `) ${
        model.dbOptions ? Object.keys(model.dbOptions).map(
            option => format.description.dbOption(option, model.dbOptions[option]),
        ).join(' ') : ''
    };`,
].join('\n');

const makeAlterTableQuery = (model, alterations) => `ALTER TABLE ${format.escapeId(model.name)}\n
${format.joinNonEmpty(alterations.map(format.description.alteration), ',\n')};`;

module.exports = {
    makeCreateTableQuery,
    makeAlterTableQuery,
};
