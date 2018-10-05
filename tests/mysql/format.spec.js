
const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');

describe('format', () => {
    let format;
    const mocks = {
        mysql: {
            format: sinon.stub(),
            escape: sinon.stub(),
            escapeId: sinon.stub(),
        },
    };

    before(() => {
        mockery.enable();
        mockery.registerMock('mysql', mocks.mysql);
        mockery.registerAllowables([
            '../../lib/mysql/format',
        ]);

        format = require('../../lib/mysql/format');

        mockery.disable();
        mockery.deregisterAll();
    });

    beforeEach(() => {
        mocks.mysql.escape.callsFake(x => JSON.stringify(x));
        mocks.mysql.escapeId.callsFake(x => `\`${x}\``);
    });

    afterEach(() => {
        sinon.resetHistory();
    });

    describe('format()', () => {
        it('should delegate to mysql.format', () => {
            format.format(1);
            expect(mocks.mysql.format.calledOnce).to.be.true;
        });
    });

    describe('escape()', () => {
        it('should delegate to mysql.escpae', () => {
            format.escape(1);
            expect(mocks.mysql.escape.calledOnce).to.be.true;
        });
    });

    describe('escapeId()', () => {
        it('should delegate to mysql.escapeId', () => {
            format.escapeId(1);
            expect(mocks.mysql.escapeId.calledOnce).to.be.true;
        });
    });

    describe('joinNonEmpty()', () => {
        it('should join items in an array', () => {
            const result = format.joinNonEmpty(['1', '2', '3'], ', ');
            expect(result).to.equal('1, 2, 3');
        });
        it('should skip falsy items', () => {
            const result = format.joinNonEmpty(['1', undefined, '3'], ', ');
            expect(result).to.equal('1, 3');
        });
    });

    describe('orderby()', () => {
        // orderby: (orderByTerm) => `${format.term(orderByTerm)} ${SORT_TYPES[orderByTerm.sort] || '' }`,
        it('should return the sql format for an orderby term', () => {
            const result = format.orderby({ asIs: 'string' });
            expect(result).to.equal('string ');
        });

        it('can include a sort direction (asc)', () => {
            const result = format.orderby({ asIs: 'string', sort: 'asc' });
            expect(result).to.equal('string ASC');
        });

        it('can include a sort direction (desc)', () => {
            const result = format.orderby({ asIs: 'string', sort: 'desc' });
            expect(result).to.equal('string DESC');
        });
    });

    describe('condition({ op })', () => {
        it('delegates to conditionByOp[op]', () => {
            const cbo = format.conditionByOp;
            const mockCbo = Object.keys(cbo).reduce((_, key) => {
                _[key] = sinon.stub();
                return _;
            }, {});

            const lhs = { asIs: 'lhs' };
            const rhs = { asIs: 'rhs' };

            format.conditionByOp = mockCbo;
            Object.keys(cbo).forEach((op) => {
                format.condition({ lhs, op, rhs });
            });
            format.conditionByOp = cbo;

            Object.keys(cbo).forEach((op) => {
                expect(mockCbo[op].calledOnce).to.be.true;
            });
        });
    });

    describe('conditionByOp', () => {
        describe('NOT()', () => {
            it('should return the sql format for a NOT expression', () => {
                const result = format.conditionByOp.NOT({ asIs: 'string' });
                expect(result).to.equal('NOT string');
            });
        });

        describe('BETWEEN()', () => {
            it('should return the sql format for a NOT expression', () => {
                const result = format.conditionByOp.BETWEEN({ asIs: 'string' }, [{ asIs: 't1' }, { asIs: 't2' }]);
                expect(result).to.equal('string BETWEEN t1 AND t2');
            });
        });

        ['=', '!=', '<', '<=', '>', '>='].forEach((op) => {
            describe(`['${op}']()`, () => {
                it(`should return the sql format for the ${op} operation`, () => {
                    const result = format.conditionByOp[op]({ asIs: 'string' }, { asIs: 'string2' });
                    expect(result).to.equal(`string ${op} string2`);
                });
            });
        });
    });

    describe('term()', () => {
        [
            [undefined, 'NULL'],
            [null, 'NULL'],
            [{ asIs: 'as is term' }, 'as is term', '"as is" terms', 'themselves'],
            [{ func: 'function' }, 'function()', 'functions (no args)', 'function calls ()'],
        ].forEach(([value, mapping, valueDesc, mappingDesc]) => {
            it(`should format ${valueDesc || value} to ${mappingDesc || mapping}`, () => {
                const result = format.term(value);
                expect(result).to.equal(mapping);
            });
        });

        it('should delegate fields to format.escapeId', () => {
            const realFei = format.escapeId;
            const mockFei = sinon.mock();
            format.escapeId = mockFei;
            format.term({ field: 'field1' });
            format.escapeId = realFei;

            expect(mockFei.calledOnce).to.be.true;
        });

        it('should delegate values to format.escape', () => {
            const realFe = format.escape;
            const mockFe = sinon.mock();
            format.escape = mockFe;
            format.term({ value: 'field1' });
            format.escape = realFe;

            expect(mockFe.calledOnce).to.be.true;
        });

        it('should delegate strings to format.escape', () => {
            const realFe = format.escape;
            const mockFe = sinon.mock();
            format.escape = mockFe;
            format.term({ value: 'field1' });
            format.escape = realFe;

            expect(mockFe.calledOnce).to.be.true;
        });

        it('should call itself recursively on function arguments', () => {
            const spy = sinon.spy(format, 'term');
            const term = { func: 'function', args: [1, 2, 4] };
            const result = format.term(term);
            format.term.restore();

            expect(result).to.equal('function(1, 2, 4)');
            expect(spy.callCount).to.equal(4);
            expect(spy.getCall(0).args[0]).to.equal(term);
            expect(spy.getCall(1).args[0]).to.equal(1);
            expect(spy.getCall(2).args[0]).to.equal(2);
            expect(spy.getCall(3).args[0]).to.equal(4);
        });
    });

    describe('description', () => {
        describe('primaryKey()', () => {
            it('should return sql text declaring a primary key.', () => {
                const result = format.description.primaryKey(['k1']);
                expect(result).to.equal('PRIMARY KEY (`k1`)');
                expect(mocks.mysql.escapeId.callCount).to.equal(1);
            });

            it('should allow key tuples.', () => {
                const result = format.description.primaryKey(['k1', 'k2']);
                expect(result).to.equal('PRIMARY KEY (`k1`, `k2`)');
                expect(mocks.mysql.escapeId.callCount).to.equal(2);
            });

            it('should allow single string arg.', () => {
                const result = format.description.primaryKey('k1');
                expect(result).to.equal('PRIMARY KEY (`k1`)');
                expect(mocks.mysql.escapeId.callCount).to.equal(1);
            });
        });

        describe('field()', () => {
            it('should return sql text declaring a field.', () => {
                const result = format.description.field({ name: 'f1', type: 'int' });
                expect(result).to.equal('`f1` INT NOT NULL');
            });

            it('can declare a nullable field.', () => {
                const result = format.description.field({ name: 'f1', type: 'int', canBeNull: true });
                expect(result).to.equal('`f1` INT NULL');
            });

            it('can declare an auto incremented field.', () => {
                const result = format.description.field({ name: 'f1', type: 'int', autoIncrement: true });
                expect(result).to.equal('`f1` INT NOT NULL AUTO_INCREMENT');
            });

            it('can declare an enum type.', () => {
                const result = format.description.field({ name: 'f1', type: 'enum', values: ['a', 'b', 'c'] });
                expect(result).to.equal('`f1` ENUM("a","b","c") NOT NULL');
            });

            it('can declare an default value.', () => {
                const result = format.description.field({ name: 'f1', type: 'int', default: 3 });
                expect(result).to.equal('`f1` INT NOT NULL DEFAULT 3');
            });
        });

        describe('key()', () => {
            it('should return sql text declaring a key.', () => {
                const result = format.description.key({ name: 'k1', fields: ['f1'] });
                expect(result).to.equal('KEY `k1` (`f1`)');
            });

            it('fields can be {name:} objects.', () => {
                const result = format.description.key({ name: 'k1', fields: [{ name: 'f1' }] });
                expect(result).to.equal('KEY `k1` (`f1`)');
            });

            it('fields can specify sort order `asc`.', () => {
                const result = format.description.key({ name: 'k1', fields: [{ name: 'f1', sort: 'asc' }] });
                expect(result).to.equal('KEY `k1` (`f1` ASC)');
            });

            it('fields can specify sort order `desc`.', () => {
                const result = format.description.key({ name: 'k1', fields: [{ name: 'f1', sort: 'desc' }] });
                expect(result).to.equal('KEY `k1` (`f1` DESC)');
            });
        });

        describe('constraint({ type })', () => {
            it('delegates to constraint[type]', () => {
                const realCbt = format.description.constraintByType;
                const mockCbt = Object.keys(realCbt).reduce((_, key) => {
                    _[key] = sinon.stub();
                    return _;
                }, {});

                format.description.constraintByType = mockCbt;
                Object.keys(realCbt).forEach((type) => {
                    format.description.constraint({ name: 'cnt', type });
                });
                format.description.constraintByType = realCbt;

                Object.keys(realCbt).forEach((type) => {
                    expect(mockCbt[type].calledOnce).to.be.true;
                });
            });
        });

        describe('constraintByType', () => {
            describe('foreignKey()', () => {
                it('should return the sql format for a foreign key constraint expression', () => {
                    const result = format.description.constraintByType.foreignKey({
                        field: 'f1',
                        references: { table: 'rft', field: 'rff1' },
                        onDelete: 'noAction',
                        onUpdate: 'noAction',
                    });
                    expect(result).to.equal('FOREIGN KEY (`f1`) REFERENCES `rft` (`rff1`) ON DELETE NO ACTION ON UPDATE NO ACTION');
                });
            });
        });

        describe('alteration()', () => {
            it('delegates to alteration[type]', () => {
                const realAbt = format.description.alterationByType;
                const mockAbt = Object.keys(realAbt).reduce((_, key) => {
                    _[key] = sinon.stub();
                    return _;
                }, {});

                format.description.alterationByType = mockAbt;
                Object.keys(realAbt).forEach((type) => {
                    format.description.alteration([type, { name: 'cnt', type: 'int' }]);
                });
                format.description.alterationByType = realAbt;

                Object.keys(realAbt).forEach((type) => {
                    expect(mockAbt[type].calledOnce).to.be.true;
                });
            });

            it('returns \'\' if alteration[type] not found', () => {
                const result = format.description.alteration(['unexisting type', { name: 'cnt', type: 'int' }]);
                expect(result).to.equal('');
            });
        });

        describe('alterationPositional()', () => {
            it('default is ""', () => {
                const result = format.description.alterationPositional({});
                expect(result).to.equal('');
            });

            it('{first:} should return the sql format for specifying a column as first', () => {
                const result = format.description.alterationPositional({
                    first: true,
                });
                expect(result).to.equal(' FIRST');
            });

            it('{after:} should return the sql format for specifying a column as coming after some other one', () => {
                const result = format.description.alterationPositional({
                    after: 'fc1',
                });
                expect(result).to.equal(' AFTER `fc1`');
            });
        });

        describe('alterationByType', () => {
            describe('dropColumn()', () => {
                it('should return the sql format for a drop column alter table expression', () => {
                    const result = format.description.alterationByType.dropColumn({
                        name: 'f1', type: 'int',
                    });
                    expect(result).to.equal('DROP COLUMN `f1`');
                });
            });

            describe('addColumn()', () => {
                it('should return the sql format for a add column alter table expression', () => {
                    const result = format.description.alterationByType.addColumn({
                        name: 'f1', type: 'int', first: true,
                    });
                    expect(result).to.equal('ADD COLUMN `f1` INT NOT NULL FIRST');
                });
            });

            describe('changeColumn()', () => {
                it('should return the sql format for a change column alter table expression', () => {
                    const result = format.description.alterationByType.changeColumn({
                        oldName: 'oldf1',
                        name: 'f1',
                        type: 'int',
                        after: 'aff',
                    });
                    expect(result).to.equal('CHANGE COLUMN `oldf1` `f1` INT NOT NULL AFTER `aff`');
                });
            });
        });
    });
});
