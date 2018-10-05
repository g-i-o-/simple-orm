const expect = require('chai').expect;
const Model = require('../lib/Model');
const Field = require('../lib/Field');

describe('Model', () => {
    describe('[constructor]', () => {
        it('should construct a model instance', () => {
            const modelDef = {   "name": "users",
                "fields": [
                    { "name": "id", "type": "int", "canBeNull": false, "autoIncrement": true}
                ],
                "primaryKey": [ "id" ],
                "dbOptions": "ENGINE=InnoDB DEFAULT CHARSET=latin1"
            };
            const model = new Model(modelDef);

            expect(model).to.be.instanceof(Model);
            expect(model.name).to.be.equal(modelDef.name);
            expect(model.primaryKey).to.deep.equal(modelDef.primaryKey);
            expect(model.fields).to.exist;
            model.fields.map((field, idx) => {
                expect(field).to.be.instanceof(Field);
                expect(field.name).to.equal(modelDef.fields[idx].name);
            });
            expect(model.dbOptions).to.deep.equal(modelDef.dbOptions);
        });
        it('should accept connection as second parameter', () => {
            const connection = { connection: true };
            const model = new Model({   "name": "users",
                "fields": [
                    { "name": "id", "type": "int", "canBeNull": false, "autoIncrement": true}
                ],
                "primaryKey": [ "id" ],
                "dbOptions": "ENGINE=InnoDB DEFAULT CHARSET=latin1"
            }, connection);

            expect(model.connection).to.equal(connection);
        });
    });

    describe('addField()', () => {
        it('should add a field to the model instance', () => {
            const fieldDef = { "name": "id", "type": "int", "canBeNull": false, "autoIncrement": true};
            const model = new Model({   "name": "users",
                "fields": [],
            });

            expect(model.fields).to.exist;
            expect(model.fields.length).to.equal(0);
            model.addField(fieldDef);
            expect(model.fields.length).to.equal(1);
            expect(model.fields[0]).to.be.instanceof(Field);
            expect(model.fields[0].name).to.equal(fieldDef.name);
        });
        it('should throw if adding a field with the same name as one of the model\'s fields', () => {
            const model = new Model({   "name": "users",
                "fields": [
                    { "name": "id", "type": "int", "canBeNull": false, "autoIncrement": true}
                ],
            });

            expect(() => model.addField({"name": "id"})).to.throw(Error);
        });
    });
});
