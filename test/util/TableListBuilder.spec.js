
const { expect } = require('chai');
const sinon = require('sinon');

const TableListBuilder = require('../../lib/util/TableListBuilder');

const T = [
    { name: 'table0', as: 'T0' },
    { name: 'table1', as: 'T1' },
    { name: 'table2', as: 'T2' },
    { name: 'table3', as: 'T3' },
    { name: 'table4', as: 'T4' },
];

describe('TableListBuilder', () => {
    describe('constructor', () => {
        it('constructs a new empty instance', () => {
            expect(new TableListBuilder()).to.deep.equal({
                list: [],
                set: {},
            });
        });

        it('Can optionally specify tables to add initially', () => {
            sinon.stub(TableListBuilder.prototype, 'addTable');
            const tlb = new TableListBuilder([T[1], T[2], T[3]]);
            expect(tlb.addTable.callCount).to.equal(3);
            expect(tlb.addTable.getCall(0).args).to.deep.equal([T[1]]);
            expect(tlb.addTable.getCall(1).args).to.deep.equal([T[2]]);
            expect(tlb.addTable.getCall(2).args).to.deep.equal([T[3]]);
            TableListBuilder.prototype.addTable.restore();
        });
    });

    describe('hasTable', () => {
        it('returns wether a table has been added to the list', () => {
            const tlb = new TableListBuilder([T[1], T[2], T[3]]);
            expect(tlb.hasTable(T[1])).to.equal(true);
            expect(tlb.hasTable(T[4])).to.equal(false);
        });
    });


    describe('addTable', () => {
        it('should add a table to the list', () => {
            const tlb = new TableListBuilder();
            tlb.addTable(T[1]);
            expect(tlb.list).to.deep.equal([T[1]]);
            expect(tlb.set).to.deep.equal({ [T[1].as]: T[1] });
        });

        it('if table is already added, then does nothing', () => {
            const tlb = new TableListBuilder([T[1]]);
            tlb.addTable(T[1]);
            expect(tlb.list).to.deep.equal([T[1]]);
            expect(tlb.set).to.deep.equal({ [T[1].as]: T[1] });
        });

        it('if no table is given, then does nothing', () => {
            const tlb = new TableListBuilder();
            tlb.addTable();
            expect(tlb.list).to.deep.equal([]);
            expect(tlb.set).to.deep.equal({});
        });
    });
});
