
const { expect } = require('chai');

const parse = require('../../lib/util/parse');

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
});
