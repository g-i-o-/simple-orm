const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');

const computeDiff = rewire('../../lib/migrations/diff/computeDiff');

describe.only('computeDiff', () => {
    let restore = null;

    afterEach(() => {
        if (restore) {
            restore();
            restore = null;
        }
    });

    describe('makeDiffer()', () => {
        const makeDiffer = computeDiff.__get__('makeDiffer');
        const A = { name: 'A', x: 3 };
        const B = { name: 'B', x: 5 };

        it('should return a differ function', () => {
            expect(makeDiffer()).to.be.a('function');
        });

        it('should return [{create*}] if B and not A', () => {
            const differ = makeDiffer('TestObject', (_A, _B) => `delegated to differ: (${_A}, ${_B})`);
            expect(differ(null, B)).to.deep.equal([
                { action: 'createTestObject', name: 'B', x: 5 },
            ]);
        });

        it('should return [{delete*}] if A and not B', () => {
            const differ = makeDiffer('TestObject', (_A, _B) => `delegated to differ: (${_A}, ${_B})`);
            expect(differ(A, null)).to.deep.equal([
                { action: 'deleteTestObject', name: 'A' },
            ]);
        });

        it('should return [] if not A and not B', () => {
            const differ = makeDiffer('TestObject', (_A, _B) => `delegated to differ: (${_A}, ${_B})`);
            expect(differ(null, null)).to.deep.equal([]);
        });

        it('should return delegate to the given differ if A and B', () => {
            const delegatedObject = [{ this: 'object', is: 'the return value', of: 'the differ' }];
            const differ = makeDiffer('TestObject', () => delegatedObject);
            expect(differ(A, B)).to.equal(delegatedObject);
        });
        // return (itemA, itemB, ...args) => {
        //     if (itemA && !itemB) {
        //         return [{ action: `delete${objectType}`, name: itemA.name }];
        //     } else if (!itemA && itemB) {
        //         return [{ action: `create${objectType}`, ...itemB }];
        //     } else if (!itemA && !itemB) {
        //         return [];
        //     }
        //
        //     return diffFn(itemA, itemB, ...args);
        // };

    });

});
