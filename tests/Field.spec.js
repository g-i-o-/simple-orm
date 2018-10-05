const expect = require('chai').expect;
const Field = require('../lib/Field');

describe('Field', () => {
    describe('[constructor]', () => {
        it('should construct a field instance', () => {
            const fieldDefs = [
                { "name": "id", "type": "int", "canBeNull": false, "autoIncrement": true},
                { "name": "id", "type": "enum", "values": ["1", "2"], "canBeNull": false, "autoIncrement": true}
            ];

            fieldDefs.forEach(fieldDef => {
                const field = new Field(fieldDef);

                expect(field).to.be.instanceof(Field);
                expect(field.name).to.equal(fieldDef.name);
                expect(field.type).to.equal(fieldDef.type);
                expect(field.canBeNull).to.equal(fieldDef.canBeNull);
                expect(field.autoIncrement).to.equal(fieldDef.autoIncrement);
                expect(field.values).to.deep.equal(fieldDef.values);
            });
        });
    });
});
