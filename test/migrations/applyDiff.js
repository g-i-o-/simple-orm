const { expect } = require('chai');
const sinon = require('sinon');

const applyDiff = require('../../lib/migrations/applyDiff');

describe('applyDiff', () => {
    let restore = null;

    afterEach(() => {
        if (restore) {
            restore();
            restore = null;
        }
    });

    describe('migration', () => {
        // it('should apply the steps in the given migration to a given models list', () => {
            // restore = sinon.mock(applyDiff, 'step')
        // });
    });
    describe('step', () => {
    });
    describe('stepByAction', () => {
        describe('applyMigration', () => {
        });
        describe('createModel', () => {
        });
        describe('insertData    ', () => {
        });
    });
});
