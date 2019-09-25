const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');

const Model = rewire('../lib/Model');
const Field = require('../lib/Field');

const mocks = {
    connectors: {
        getDefaultConnector: sinon.mock(),
    },
};

const fieldDef = {
    name: 'id',
    type: 'int',
    canBeNull: false,
    autoIncrement: true,
};

const modelDef = {
    name: 'users',
    fields: [fieldDef],
    primaryKey: ['id'],
    dbOptions: 'ENGINE=InnoDB DEFAULT CHARSET=latin1',
};

const model2Def = {
    name: 'houses',
    singularName: 'house',
    fields: [fieldDef],
    primaryKey: ['id'],
    dbOptions: 'ENGINE=InnoDB DEFAULT CHARSET=latin1',
};

const emptyModel = {
    name: 'users',
    fields: [],
};


describe('Model', () => {
    let revertModelSet = null;
    before(() => {
        revertModelSet = Model.__set__(mocks);
    });

    after(() => {
        revertModelSet();
    });

    describe('[constructor]', () => {
        it('should construct a model instance', () => {
            const model = new Model(modelDef);

            expect(model).to.be.instanceof(Model);
            expect(model.alias).to.equal('U');
            expect(model.name).to.equal('users');
            expect(model.backReferences).to.deep.equal({});
            expect(model.references).to.deep.equal({});
            expect(model.connection).to.equal(undefined);
            expect(model.constraints).to.equal(undefined);
            expect(model.fields).to.deep.equal([
                new Field(fieldDef),
            ]);
            expect(model.fieldsMap).to.deep.equal({
                id: new Field(fieldDef),
            });
            expect(model.keys).to.equal(undefined);
            expect(model.primaryKey).to.deep.equal(['id']);
            expect(model.dbOptions).to.equal('ENGINE=InnoDB DEFAULT CHARSET=latin1');
        });
        it('should accept connection as second parameter', () => {
            const connection = { connection: true };
            const model = new Model(modelDef, connection);

            expect(model.connection).to.equal(connection);
        });
    });

    describe('connect()', () => {
        it('should set the connection', () => {
            const model = new Model(modelDef);
            model.connect({ connection: true });
            expect(model.connection).to.deep.equal({ connection: true });
        });
    });

    describe('disconnect()', () => {
        it('should clear the connection', () => {
            const model = new Model(modelDef, { connection: true });
            expect(model.connection).to.deep.equal({ connection: true });
            model.disconnect();
            expect(model.connection).to.equal(null);
        });
    });

    describe('getConnection()', () => {
        it('should return the model\'s connection', () => {
            const model = new Model(modelDef, { connection: true });
            expect(model.getConnection()).to.deep.equal({ connection: true });
        });

        it('should create/return a default connection if no connection is set', () => {
            const model = new Model(modelDef);
            mocks.connectors.getDefaultConnector.resetHistory();
            mocks.connectors.getDefaultConnector.returns({ connection: true });
            expect(model.getConnection()).to.deep.equal({ connection: true });
            expect(mocks.connectors.getDefaultConnector.callCount).to.equal(1);
        });
    });

    describe('linkReference()', () => {
        it('set a link from this model to the other given model, and back', () => {
            const model1 = new Model(modelDef);
            const model2 = new Model(modelDef);
            model1.linkReference('refName', 'fieldName', model2);
            expect(model1.references).to.deep.equal({
                refName: { field: 'fieldName', model: model2 },
            });
            expect(model2.backReferences).to.deep.equal({
                [model1.name]: { refName: 'refName', model: model1 },
            });
        });
    });

    describe('addField()', () => {
        it('should add a field to the model instance', () => {
            const model = new Model(emptyModel);

            expect(model.fields).to.exist;
            expect(model.fields.length).to.equal(0);
            model.addField(fieldDef);
            expect(model.fields.length).to.equal(1);
            expect(model.fields[0]).to.be.instanceof(Field);
            expect(model.fields[0].name).to.equal(fieldDef.name);
        });
        it('should throw if adding a field with the same name as one of the model\'s fields', () => {
            const model = new Model(modelDef);

            expect(() => model.addField(fieldDef)).to.throw(Error);
        });

        describe('({ id:true })', () => {
            it('should parse as primaryKey, with default name:id, type:int, autoIncrement, canBeNull:false', () => {
                const model = new Model(emptyModel);
                expect(model.fields).to.exist;
                expect(model.fields.length).to.equal(0);
                model.addField({ id: true });
                expect(model.fields.length).to.equal(1);
                expect(model.fields[0]).to.be.instanceof(Field);
                expect(model.fields[0]).to.deep.equal(new Field({
                    name: 'id',
                    type: 'int',
                    default: undefined,
                    values: undefined,
                    canBeNull: false,
                    autoIncrement: true,
                }));
                expect(model.primaryKey).to.deep.equal(['id']);
            });
            it('name, type, autoIncrement and canBeNull can be overriden', () => {
                const model = new Model(emptyModel);
                expect(model.fields).to.exist;
                expect(model.fields.length).to.equal(0);
                model.addField({
                    id: true,
                    type: 'otherinttype',
                    canBeNull: true,
                    autoIncrement: false,
                });
                expect(model.fields.length).to.equal(1);
                expect(model.fields[0]).to.be.instanceof(Field);
                expect(model.fields[0]).to.deep.equal(new Field({
                    name: 'id',
                    type: 'otherinttype',
                    default: undefined,
                    values: undefined,
                    canBeNull: true,
                    autoIncrement: false,
                }));
            });
        });

        describe('({ references:<Model> })', () => {
            it('should link the given model as a reference', () => {
                const model1 = new Model(modelDef);
                const model2 = new Model(model2Def);
                sinon.stub(model1, 'linkReference');

                model1.addField({ name: 'houseId', references: model2 });
                expect(model1.fields.length).to.equal(2);
                expect(model1.fields[1]).to.be.instanceof(Field);
                expect(model1.fields[1]).to.deep.equal(new Field({
                    name: 'houseId',
                    type: 'int',
                    default: undefined,
                    values: undefined,
                    canBeNull: undefined,
                    autoIncrement: undefined,
                }));
                expect(model1.linkReference.callCount).to.equal(1);
                expect(model1.linkReference.getCall(0).calledOn(model1)).to.equal(true);
                expect(model1.linkReference.getCall(0).args).to.deep.equal(
                    ['houseId', 'houseId', model2],
                );
            });
            it('the field name gets appended Id if it doesnt already has it', () => {
                const model1 = new Model(modelDef);
                const model2 = new Model(model2Def);
                sinon.stub(model1, 'linkReference');

                model1.addField({ name: 'house', references: model2 });
                expect(model1.fields.length).to.equal(2);
                expect(model1.fields[1]).to.be.instanceof(Field);
                expect(model1.fields[1]).to.deep.equal(new Field({
                    name: 'houseId',
                    type: 'int',
                    default: undefined,
                    values: undefined,
                    canBeNull: undefined,
                    autoIncrement: undefined,
                }));
                expect(model1.linkReference.callCount).to.equal(1);
                expect(model1.linkReference.getCall(0).calledOn(model1)).to.equal(true);
                expect(model1.linkReference.getCall(0).args).to.deep.equal(
                    ['house', 'houseId', model2],
                );
            });
            it('default field name comes from reference', () => {
                const model1 = new Model(model2Def);
                const model2 = new Model(modelDef);
                sinon.stub(model1, 'linkReference');

                model1.addField({ references: model2 });
                expect(model1.fields.length).to.equal(2);
                expect(model1.fields[1]).to.be.instanceof(Field);
                expect(model1.fields[1]).to.deep.equal(new Field({
                    name: 'usersId',
                    type: 'int',
                    default: undefined,
                    values: undefined,
                    canBeNull: undefined,
                    autoIncrement: undefined,
                }));
                expect(model1.linkReference.callCount).to.equal(1);
                expect(model1.linkReference.getCall(0).calledOn(model1)).to.equal(true);
                expect(model1.linkReference.getCall(0).args).to.deep.equal(
                    ['users', 'usersId', model2],
                );
            });
            it('throws error if reference has no primary key', () => {
                const model1 = new Model(model2Def);
                const model2 = new Model(emptyModel);
                sinon.stub(model1, 'linkReference');

                expect(() => model1.addField({ references: model2 })).to.throw(Error);
            });
        });

        describe('({ enum:[...] })', () => {
            it('should parse as type:enum, values:[...]', () => {
                const model = new Model(emptyModel);
                expect(model.fields).to.exist;
                expect(model.fields.length).to.equal(0);
                model.addField({ name: 'a', enum: ['v1', 'v2', 'v3'] });
                expect(model.fields.length).to.equal(1);
                expect(model.fields[0]).to.be.instanceof(Field);
                expect(model.fields[0]).to.deep.equal(new Field({
                    name: 'a',
                    type: 'enum',
                    default: undefined,
                    values: ['v1', 'v2', 'v3'],
                    canBeNull: undefined,
                    autoIncrement: undefined,
                }));
            });
        });

        describe('({ primaryKey })', () => {
            it('primaryKey:true should add field name to primaryKey list', () => {
                const model = new Model(emptyModel);
                model.addField({ name: 'qwe', type: 'int', primaryKey: true });
                model.addField({ name: 'id2', type: 'int', primaryKey: true });
                expect(model.primaryKey).to.deep.equal(['qwe', 'id2']);
            });

            it('primaryKey:false does nothing of the sort', () => {
                const model = new Model(emptyModel);
                model.addField({ name: 'qwe', type: 'int' });
                expect(model.fields.length).to.equal(1);
                expect(model.fields[0]).to.be.instanceof(Field);
                expect(model.fields[0]).to.deep.equal(new Field({
                    name: 'qwe',
                    type: 'int',
                    default: undefined,
                    values: undefined,
                    canBeNull: undefined,
                    autoIncrement: undefined,
                }));
                expect(model.primaryKey).to.equal(undefined);
            });

            it('does nothing if field is already in primaryKey list', () => {
                const model = new Model({ ...emptyModel, primaryKey: ['id'] });
                model.addField({ name: 'id', type: 'int', primaryKey: true });
                expect(model.primaryKey).to.deep.equal(['id']);
            });
        });
    });

    describe('findOne()', () => {
        it('calls find() with the given options plut limit:1, and returns the first result', async () => {
            const model = new Model(modelDef);
            model.find = sinon.stub().resolves(['first result', 'second result']);
            const result = await model.findOne();
            expect(model.find.callCount).to.equal(1);
            expect(model.find.getCall(0).args).to.deep.equal([{
                limit: { count: 1 },
            }]);
            expect(result).to.equal('first result');
        });
    });

    describe('find()', () => {
        it('performs a query with the given options and returns an array of matching items.', async () => {
            const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
            const model = new Model(modelDef, mockConnection);
            const result = await model.find({ id: 3, orderBy: 'id' });
            expect(mockConnection.query.callCount).to.equal(1);
            expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                select: [{ field: 'id', table: 'U' }],
                from: [{ table: model.name, as: model.alias }],
                where: [{ lhs: { table: model.alias, field: 'id' }, op: '=', rhs: { value: 3 } }],
                orderBy: [{ field: 'id', table: 'U', sort: undefined }],
                random: undefined,
                limit: undefined,
            }]);
            expect(result).to.deep.equal(['first result', 'second result']);
        });
        it('no options performs query without any where clauses.', async () => {
            const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
            const model = new Model(modelDef, mockConnection);
            const result = await model.find();
            expect(mockConnection.query.callCount).to.equal(1);
            expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                select: [{ field: 'id', table: 'U' }],
                from: [{ table: model.name, as: model.alias }],
                where: [],
                orderBy: undefined,
                random: undefined,
                limit: undefined,
            }]);
            expect(result).to.deep.equal(['first result', 'second result']);
        });
        describe('{[field]} options', () => {
            it('add a where clause to that field.', async () => {
                const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
                const model = new Model(modelDef, mockConnection);
                const result = await model.find({ id: 3 });
                expect(mockConnection.query.callCount).to.equal(1);
                expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                    select: [{ field: 'id', table: 'U' }],
                    from: [{ table: model.name, as: model.alias }],
                    where: [{ lhs: { table: model.alias, field: 'id' }, op: '=', rhs: { value: 3 } }],
                    orderBy: undefined,
                    random: undefined,
                    limit: undefined,
                }]);
                expect(result).to.deep.equal(['first result', 'second result']);
            });
        });
        describe('{[reference].[field]} options', () => {
            const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
            const usersModel = new Model({
                name: 'users',
                singularName: 'user',
                fields: [
                    fieldDef,
                    { name: 'name', type: 'text' },
                ],
                primaryKey: ['id'],
                dbOptions: 'ENGINE=InnoDB DEFAULT CHARSET=latin1',
            }, mockConnection);
            const avatarsModel = new Model({
                name: 'avatars',
                fields: [
                    fieldDef,
                    { name: 'url', type: 'text' },
                    { references: usersModel },
                ],
                primaryKey: ['id'],
                dbOptions: 'ENGINE=InnoDB DEFAULT CHARSET=latin1',
            }, mockConnection);

            it('joins a reference table and adds a where clause to that field.', async () => {
                mockConnection.query.resetHistory();
                const result = await avatarsModel.find({ 'user.id': 3 });
                expect(mockConnection.query.callCount).to.equal(1);
                expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                    select: [{ table: 'A', field: 'id' }, { table: 'A', field: 'url' }, { table: 'A', field: 'userId' }],
                    from: [
                        { table: 'avatars', as: 'A' },
                        { table: 'users', as: 'U', join: true, on: {
                            lhs: { table: 'A', field: 'userId' },
                            op: '=',
                            rhs: { table: 'U', field: 'id' }
                        }},
                    ],
                    where: [{ lhs: { table: 'U', field: 'id' }, op: '=', rhs: { value: 3 } }],
                    orderBy: undefined,
                    random: undefined,
                    limit: undefined,
                }]);
                expect(result).to.deep.equal(['first result', 'second result']);
            });

            it('Also works with back references.', async () => {
                mockConnection.query.resetHistory();
                const result = await usersModel.find({ 'avatars.url': 'url' });
                expect(mockConnection.query.callCount).to.equal(1);
                expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                    select: [{ table: 'U', field: 'id' }, { table: 'U', field: 'name' }],
                    from: [
                        { table: 'users', as: 'U' },
                        { table: 'avatars', as: 'A', join: true, on: {
                            lhs: { table: 'U', field: 'id' },
                            op: '=',
                            rhs: { table: 'A', field: 'userId' },
                        }},
                    ],
                    where: [{ lhs: { table: 'A', field: 'url' }, op: '=', rhs: { value: 'url' } }],
                    orderBy: undefined,
                    random: undefined,
                    limit: undefined,
                }]);
                expect(result).to.deep.equal(['first result', 'second result']);
            });
        });
        it('other options get ignored.', async () => {
            const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
            const model = new Model(modelDef, mockConnection);
            const result = await model.find({ qwe: 3 });
            expect(mockConnection.query.callCount).to.equal(1);
            expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                select: [{ field: 'id', table: 'U' }],
                from: [{ table: model.name, as: model.alias }],
                where: [],
                orderBy: undefined,
                random: undefined,
                limit: undefined,
            }]);
            expect(result).to.deep.equal(['first result', 'second result']);
        });
        it('throws error if no connection can be obtained.', async () => {
            const model = new Model(modelDef);
            model.getConnection = sinon.stub().resolves(null);

            try {
                await model.find();
            } catch (err) {
                return;
            }

            throw Error('expected model.find to be rejected');
        });
        describe('if model.findPreprocess() defined', () => {
            it('it gets to modify the constructed query before executing it.', async () => {
                const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
                const model = new Model(modelDef, mockConnection);
                model.findPreprocess = sinon.stub().returns('new query');

                const result = await model.find({ qwe: 3 });
                expect(model.findPreprocess.callCount).to.equal(1);
                expect(model.findPreprocess.getCall(0).args).to.deep.equal([{
                    select: [{ field: 'id', table: 'U' }],
                    from: [{ table: model.name, as: model.alias }],
                    where: [],
                    orderBy: undefined,
                    random: undefined,
                    limit: undefined,
                }, { qwe: 3 }]);
                expect(mockConnection.query.callCount).to.equal(1);
                expect(mockConnection.query.getCall(0).args).to.deep.equal(['new query']);
                expect(result).to.deep.equal(['first result', 'second result']);
            });
            it('original query gets used if returns falsy.', async () => {
                const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
                const model = new Model(modelDef, mockConnection);
                model.findPreprocess = sinon.stub().returns(null);

                const result = await model.find({ qwe: 3 });
                expect(mockConnection.query.callCount).to.equal(1);
                expect(mockConnection.query.getCall(0).args).to.deep.equal([{
                    select: [{ field: 'id', table: 'U' }],
                    from: [{ table: model.name, as: model.alias }],
                    where: [],
                    orderBy: undefined,
                    random: undefined,
                    limit: undefined,
                }]);
                expect(result).to.deep.equal(['first result', 'second result']);
            });
        });
        describe('if model.findPostProcess() defined', () => {
            it('it gets to modify the results before returning them.', async () => {
                const mockConnection = { query: sinon.stub().resolves(['first result', 'second result']) };
                const model = new Model(modelDef, mockConnection);
                model.findPostProcess = sinon.stub().returns('new results');

                const result = await model.find();
                expect(result).to.deep.equal('new results');
            });
        });
    });

    describe('getSchema()', () => {
        it('should return n object representing this model\'s schema', () => {
            const model = new Model(modelDef);
            expect(model.getSchema()).to.deep.equal({
                name: 'users',
                primaryKey: ['id'],
                dbOptions: 'ENGINE=InnoDB DEFAULT CHARSET=latin1',
                fields: [
                    {
                        name: 'id',
                        type: 'int',
                        autoIncrement: true,
                        canBeNull: false,
                    },
                ],
            });
        });
    });
});
