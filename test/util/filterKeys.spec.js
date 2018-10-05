
const { expect } = require('chai');

const filterKeys = require('../../lib/util/filterKeys');

describe('filterKeys()', () => {
    it('should filter an objects keys depending on filter function', () => {
        expect(filterKeys({
            1: 'this',
            2: 'is',
            3: 'SPARTAA!!!',
        }, word => /i/.test(word))).to.deep.equal({
            1: 'this',
            2: 'is',
        });
    });

    it('should filter undefined values by default', () => {
        expect(filterKeys({
            1: 'this',
            2: 'is',
            3: undefined,
        })).to.deep.equal({
            1: 'this',
            2: 'is',
        });
    });
});
