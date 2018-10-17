
const { expect } = require('chai');
const sinon = require('sinon');

const parse = require('../../lib/util/parse');

const model1 = { name: 'model1', alias: 'M1', fieldsMap: { id: true, dog: true }, references: {}, backReferences: {}, primaryKey: ['id'] };
const model2 = { name: 'model2', alias: 'M2', fieldsMap: { id: true, dog: true }, references: {}, backReferences: {}, primaryKey: ['id'] };
const model3 = { name: 'model3', alias: 'M3', fieldsMap: { id: true, dog: true }, references: {}, backReferences: {}, primaryKey: ['id'] };

model1.references.model2 = { model: model2, field: 'model2Id' };
model2.backReferences.model1 = { model: model1 };
model2.references.model3 = { model: model3, field: 'model3Id' };
model3.backReferences.model2 = { model: model2 };

describe('parse', () => {
    describe('alias', () => {
        [
            ['users', 'U'],
            ['userRoles', 'UR'],
            ['userURLS', 'UURLS'],
        ].forEach(([name, alias]) => {
            it(`${name} => ${alias}`, () => {
                expect(parse.alias(name)).to.equal(alias);
            });
        });
    });

    describe('followReferences', () => {
        it('should parse key and traverse model\'s references, returning its path and possible field.', () => {
            expect(parse.followReferences('model2.id', model1)).to.deep.equal({
                path: [{ from: model1, key: 'model2', ref: model1.references.model2 }],
                lastModel: model2,
                field: 'id',
            });
        });

        it('can also traverse back references.', () => {
            expect(parse.followReferences('model1.id', model2)).to.deep.equal({
                path: [{ from: model2, key: 'model1', backRef: model2.backReferences.model1 }],
                lastModel: model1,
                field: 'id',
            });
        });

        it('if key\'s field is ommited, the field is the last model\'s primary key', () => {
            expect(parse.followReferences('model2', model1)).to.deep.equal({
                path: [{ from: model1, key: 'model2', ref: model1.references.model2 }],
                lastModel: model2,
                field: 'id',
            });
        });

        it('if a model\'s reference cannot be found, then returns null.', () => {
            expect(parse.followReferences('model32.id', model1)).to.equal(null);
        });

        it('if the last model does not contain the specified field, then returns null.', () => {
            expect(parse.followReferences('model2.fancyId', model1)).to.equal(null);
        });
    });

    describe('join', () => {
        it('should delegate refs to referenceJoin()', () => {
            sinon.stub(parse, 'referenceJoin').returns('join1');
            expect(parse.join({ ref: 1, from: 2 })).to.equal('join1');
            expect(parse.referenceJoin.callCount).to.equal(1);
            parse.referenceJoin.restore();
        });

        it('should delegate backRefs to backReferenceJoin()', () => {
            sinon.stub(parse, 'backReferenceJoin').returns('join1');
            expect(parse.join({ backRef: 1, from: 2 })).to.equal('join1');
            expect(parse.backReferenceJoin.callCount).to.equal(1);
            parse.backReferenceJoin.restore();
        });

        it('else, returns undefined', () => {
            expect(parse.join({ from: 2 })).to.equal(undefined);
        });
    });

    describe('referenceJoin', () => {
        it('should parse a reference join to a join clause item', () => {
            expect(parse.referenceJoin(model1, { model: model2, field: 'model2Id' })).to.deep.equal({
                join: true,
                table: model2.name,
                as: model2.alias,
                on: {
                    lhs: { table: model1.alias, field: 'model2Id' },
                    op: '=',
                    rhs: { table: model2.alias, field: model2.primaryKey[0] },
                },
            });
        });
    });

    describe('backReferenceJoin', () => {
        it('should parse a back reference join to a join clause item', () => {
            expect(parse.backReferenceJoin(model2, { model: model1, refName: 'model2' })).to.deep.equal({
                join: true,
                table: model1.name,
                as: model1.alias,
                on: {
                    lhs: { table: model2.alias, field: model2.primaryKey[0] },
                    op: '=',
                    rhs: { table: model1.alias, field: 'model2Id' },
                },
            });
        });
    });

    describe('asArray', () => {
        it('should return an array if given an array', () => {
            const array = [1, 2, 3];
            expect(parse.asArray(array)).to.equal(array);
        });

        it('should wrap anything else to an array', () => {
            expect(parse.asArray(2)).to.deep.equal([2]);
        });
    });

    describe('condition', () => {
        it('should parse strings to field = \'string\'', () => {
            expect(parse.condition(undefined, 'field', 'string')).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '=',
                rhs: { value: 'string' },
            });
        });

        it('should parse numbers to field = 3', () => {
            expect(parse.condition(undefined, 'field', 3)).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '=',
                rhs: { value: 3 },
            });
        });

        it('should parse dates to field = \'date\'', () => {
            const date = new Date();
            expect(parse.condition(undefined, 'field', date)).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '=',
                rhs: { value: date },
            });
        });

        it('should parse null to field IS NULL', () => {
            expect(parse.condition(undefined, 'field', null)).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '=',
                rhs: { value: null },
            });
        });

        it('should parse undefined to field IS undefined', () => {
            expect(parse.condition(undefined, 'field', undefined)).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '=',
                rhs: { value: undefined },
            });
        });

        it('should parse [value1, value2, ...] to { op: \'IN\' values: [...] }', () => {
            expect(parse.condition(undefined, 'field', [1101011, 1102011])).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: 'IN',
                rhs: { value: [1101011, 1102011] },
            });
        });

        it('should parse { [op]: value } to field I<op> <value>', () => {
            expect(parse.condition(undefined, 'field', { op: 'value' })).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: 'op',
                rhs: 'value',
            });
        });

        it('should parse { op, rhs } to itself', () => {
            expect(parse.condition(undefined, 'field', { op: '???', rhs: 'eere' })).to.deep.equal({
                lhs: { table: undefined, field: 'field' },
                op: '???',
                rhs: 'eere',
            });
        });
    });

    describe('limit', () => {
        it('parse objects as limit literals', () => {
            expect(parse.limit({ limit: true })).to.deep.equal({ limit: true });
        });

        it('parse non-undefined non-objects as a { count } object', () => {
            expect(parse.limit(7)).to.deep.equal({ count: 7 });
        });

        it('parses undefined as undefined', () => {
            expect(parse.limit(undefined)).to.equal(undefined);
        });
    });
});
