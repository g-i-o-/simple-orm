
const { expect } = require('chai');
const sinon = require('sinon');
const mockery = require('mockery');
const rewire = require('rewire');

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
            '../../builders/generated',
            '../../definitions',
            '../../modifications/flow/removeTypeDuplicates',
            '../../utils/react/cleanJSXElementLiteralChild',
            '../../utils/shallowEqual',
            '../../validators/generated',
            '../../validators/is',
            '../binding',
            '../buildMatchMemberExpression',
            '../builder',
            '../builders/generated',
            '../cache',
            '../clone/cloneNode',
            '../comments/inheritsComments',
            '../constants',
            '../definitions',
            '../generated',
            '../index',
            '../modifications/removePropertiesDeep',
            '../node',
            '../package.json',
            '../retrievers/getBindingIdentifiers',
            '../scope',
            '../traverse/traverseFast',
            '../utils/inherit',
            '../utils/shallowEqual',
            '../validators/generated',
            '../validators/is',
            '../validators/isNode',
            '../validators/isValidIdentifier',
            '../validators/validate',
            './_DataView',
            './_Hash',
            './_ListCache',
            './_Map',
            './_MapCache',
            './_Promise',
            './_Set',
            './_SetCache',
            './_Stack',
            './_Symbol',
            './_Uint8Array',
            './_WeakMap',
            './_arrayEach',
            './_arrayFilter',
            './_arrayIncludes',
            './_arrayIncludesWith',
            './_arrayLikeKeys',
            './_arrayMap',
            './_arrayPush',
            './_assignValue',
            './_assocIndexOf',
            './_baseAssign',
            './_baseAssignIn',
            './_baseAssignValue',
            './_baseClone',
            './_baseCreate',
            './_baseFindIndex',
            './_baseGetAllKeys',
            './_baseGetTag',
            './_baseIndexOf',
            './_baseIsArguments',
            './_baseIsMap',
            './_baseIsNaN',
            './_baseIsNative',
            './_baseIsRegExp',
            './_baseIsSet',
            './_baseIsTypedArray',
            './_baseKeys',
            './_baseKeysIn',
            './_baseTimes',
            './_baseUnary',
            './_baseUniq',
            './_baseValues',
            './_cacheHas',
            './_cloneArrayBuffer',
            './_cloneBuffer',
            './_cloneDataView',
            './_cloneRegExp',
            './_cloneSymbol',
            './_cloneTypedArray',
            './_copyArray',
            './_copyObject',
            './_copySymbols',
            './_copySymbolsIn',
            './_coreJsData',
            './_createSet',
            './_defineProperty',
            './_freeGlobal',
            './_getAllKeys',
            './_getAllKeysIn',
            './_getMapData',
            './_getNative',
            './_getPrototype',
            './_getRawTag',
            './_getSymbols',
            './_getSymbolsIn',
            './_getTag',
            './_getValue',
            './_hashClear',
            './_hashDelete',
            './_hashGet',
            './_hashHas',
            './_hashSet',
            './_initCloneArray',
            './_initCloneByTag',
            './_initCloneObject',
            './_isIndex',
            './_isKeyable',
            './_isMasked',
            './_isPrototype',
            './_listCacheClear',
            './_listCacheDelete',
            './_listCacheGet',
            './_listCacheHas',
            './_listCacheSet',
            './_mapCacheClear',
            './_mapCacheDelete',
            './_mapCacheGet',
            './_mapCacheHas',
            './_mapCacheSet',
            './_nativeCreate',
            './_nativeKeys',
            './_nativeKeysIn',
            './_nodeUtil',
            './_objectToString',
            './_overArg',
            './_root',
            './_setCacheAdd',
            './_setCacheHas',
            './_setToArray',
            './_stackClear',
            './_stackDelete',
            './_stackGet',
            './_stackHas',
            './_stackSet',
            './_strictIndexOf',
            './_toSource',
            './addComments',
            './ancestry',
            './asserts/assertNode',
            './asserts/generated',
            './base',
            './binding',
            './buffer',
            './builder',
            './builders/flow/createTypeAnnotationBasedOnTypeof',
            './builders/flow/createUnionTypeAnnotation',
            './builders/generated',
            './builders/react/buildChildren',
            './cache',
            './classes',
            './clone',
            './clone/clone',
            './clone/cloneDeep',
            './clone/cloneNode',
            './clone/cloneWithoutLoc',
            './cloneNode',
            './comments',
            './comments/addComment',
            './comments/addComments',
            './comments/inheritInnerComments',
            './comments/inheritLeadingComments',
            './comments/inheritTrailingComments',
            './comments/inheritsComments',
            './comments/removeComments',
            './common',
            './constants',
            './constants/generated',
            './context',
            './conversion',
            './converters/ensureBlock',
            './converters/toBindingIdentifierName',
            './converters/toBlock',
            './converters/toComputedKey',
            './converters/toExpression',
            './converters/toIdentifier',
            './converters/toKeyAlias',
            './converters/toSequenceExpression',
            './converters/toStatement',
            './converters/valueToNode',
            './core',
            './definitions',
            './eq',
            './es2015',
            './evaluation',
            './experimental',
            './expressions',
            './family',
            './file',
            './flow',
            './formatters',
            './gatherSequenceExpressions',
            './generated',
            './generators',
            './getBindingIdentifiers',
            './hub',
            './index',
            './inference',
            './inferer-reference',
            './inferers',
            './inheritInnerComments',
            './inheritLeadingComments',
            './inheritTrailingComments',
            './instrumenter',
            './introspection',
            './isArguments',
            './isArray',
            './isArrayLike',
            './isBuffer',
            './isFunction',
            './isLength',
            './isLet',
            './isMap',
            './isObject',
            './isObjectLike',
            './isSet',
            './isString',
            './isSymbol',
            './isType',
            './isTypedArray',
            './isValidIdentifier',
            './jsx',
            './keys',
            './keysIn',
            './lib/coverage-map',
            './lib/file',
            './lib/hoister',
            './lib/removal-hooks',
            './lib/renamer',
            './lib/virtual-types',
            './literal',
            './matchesPattern',
            './methods',
            './misc',
            './modification',
            './modifications/appendToMemberExpression',
            './modifications/flow/removeTypeDuplicates',
            './modifications/inherits',
            './modifications/prependToMemberExpression',
            './modifications/removeProperties',
            './modifications/removePropertiesDeep',
            './modules',
            './node',
            './node.js',
            './noop',
            './options',
            './parentheses',
            './parse',
            './path',
            './path/lib/virtual-types',
            './populate',
            './printer',
            './read-coverage',
            './removal',
            './removeProperties',
            './replacement',
            './retrievers/getBindingIdentifiers',
            './retrievers/getOuterBindingIdentifiers',
            './scope',
            './source-coverage',
            './source-map',
            './statements',
            './string',
            './stubArray',
            './stubFalse',
            './template-literals',
            './toBlock',
            './toFinite',
            './toIdentifier',
            './toInteger',
            './toNumber',
            './traverse/traverse',
            './traverse/traverseFast',
            './types',
            './typescript',
            './utils',
            './utils/shallowEqual',
            './validators/buildMatchMemberExpression',
            './validators/generated',
            './validators/is',
            './validators/isBinding',
            './validators/isBlockScoped',
            './validators/isImmutable',
            './validators/isLet',
            './validators/isNode',
            './validators/isNodesEquivalent',
            './validators/isReferenced',
            './validators/isScope',
            './validators/isSpecifierDefault',
            './validators/isType',
            './validators/isValidES3Identifier',
            './validators/isValidIdentifier',
            './validators/isVar',
            './validators/matchesPattern',
            './validators/react/isCompatTag',
            './validators/react/isReactComponent',
            './validators/validate',
            './values',
            './visitor',
            './visitors',
            './whitespace',
            '@babel/generator',
            '@babel/parser',
            '@babel/template',
            '@babel/traverse',
            '@babel/types',
            'crypto',
            'debug',
            'esutils',
            'globals',
            'invariant',
            'istanbul-lib-coverage',
            'istanbul-lib-instrument',
            'jsesc',
            'lodash/clone',
            'lodash/includes',
            'lodash/isInteger',
            'lodash/isPlainObject',
            'lodash/isRegExp',
            'lodash/uniq',
            'ms',
            'semver',
            'supports-color',
            'to-fast-properties',
            'trim-right',
            'tty',
            'util',
        ]);

        format = require('../../lib/mysql/format');

        mockery.disable();
        mockery.deregisterAll();
    });

    beforeEach(() => {
        mocks.mysql.escape.callsFake(x => (Array.isArray(x) ? x.map(y => JSON.stringify(y)).join(', ') : JSON.stringify(x)));
        mocks.mysql.escapeId.callsFake(x => (`${x}`).split('.').map(y => `\`${y}\``).join('.'));
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

    describe('statement()', () => {
        const statements = ['begin', 'commit', 'rollback'];

        it(`formats statements ${statements.join(', ')}`, () => {
            statements.forEach((statement) => {
                expect(format.statement({ [statement]: true }));
            });
        });

        it('otherwise throws an error', () => {
            expect(() => format.statement({ notAStatement: true })).to.throw(Error);
        });
    });

    describe('insert()', () => {
        it('formats insert statements', () => {
            expect(format.insert({
                into: 'targetTable',
                fields: ['a', 'b', 'c'],
                values: [
                    { a: 1, b: 2, c: 3 },
                    { a: 4, b: 5, c: 6 },
                ],
            })).to.equal([
                'INSERT INTO `targetTable`(`a`, `b`, `c`) VALUES \n',
                '    (1, 2, 3),\n',
                '    (4, 5, 6);',
            ].join(''));
        });
    });

    describe('update()', () => {
        it('formats update statements', () => {
            expect(format.update({
                update: [{ table: 'table' }],
                set: [
                    { field: { field: 'field1'}, value: { asIs: 101 } },
                ],
                where: [{ lhs: { field: 'a' }, op: '=', rhs: { value: 5 } }],
                limit: { count: 6 },
            })).to.equal([
                'UPDATE  `table`  ',
                '   SET `field1` = (101)',
                'WHERE (`a` = 5)',
                'LIMIT 6',
                ';',
            ].join('\n'));
        });
    });

    describe('delete()', () => {
        it('formats delete statements', () => {
            expect(format.delete({
                // delete: [{ table: 'table' }],
                from: [{ table: 'table' }],
                where: [{ lhs: { field: 'a' }, op: '=', rhs: { value: 5 } }],
                orderBy: ['a'],
                limit: { count: 6 },
            })).to.equal([
                'DELETE ',
                'FROM  `table`  ',
                'WHERE (`a` = 5)',
                'LIMIT 6',
                ';'
            ].join('\n'));
        });

        it('allows multiple table statements', () => {
            expect(format.delete({
                // delete: [{ table: 'table' }],
                from: [
                    { table: 'table', as: 'T1' },
                    { table: 'table2', as: 'T2', join: true, on: { lhs: { field: 'a' }, op: '=', rhs: { field: 'b' } } }
                ],
                where: [{ lhs: { field: 'a' }, op: '=', rhs: { value: 5 } }],
                orderBy: ['a'],
                limit: { count: 6 },
            })).to.equal([
                'DELETE ',
                'FROM  `table` `T1` ',
                'JOIN `table2` `T2` ON `a` = `b`',
                'WHERE (`a` = 5)',
                'LIMIT 6',
                ';'
            ].join('\n'));
        });

        it('can have different reference and delete tables', () => {
            expect(format.delete({
                delete: [{ table: 'table', as: 'T1' }],
                from: [
                    { table: 'table', as: 'T1' },
                    { table: 'table2', as: 'T2', join: true, on: { lhs: { field: 'a' }, op: '=', rhs: { field: 'b' } } }
                ],
                where: [{ lhs: { field: 'a' }, op: '=', rhs: { value: 5 } }],
                orderBy: ['a'],
                limit: { count: 6 },
            })).to.equal([
                'DELETE `T1`',
                'FROM  `table` `T1` ',
                'JOIN `table2` `T2` ON `a` = `b`',
                'WHERE (`a` = 5)',
                'LIMIT 6',
                ';'
            ].join('\n'));
        });

    });

    describe('query()', () => {
        it('formats sql query statements', () => {
            expect(format.query({
                select: ['a', 'b', 'c'],
                from: [{ table: 'table', as: 'T' }],
                where: [{ lhs: { field: 'a' }, op: '=', rhs: { value: 5 } }],
                orderBy: ['a'],
                limit: { offset: 0, count: 4 },
            })).to.equal([
                'SELECT "a", "b", "c"\n',
                'FROM  `table` `T` \n',
                'WHERE (`a` = 5)\n',
                'ORDER BY "a" \n',
                'LIMIT 0, 4\n',
                ';',
            ].join(''));
        });

        it('supports group by', () => {
            expect(format.query({
                from: [{ table: 'table', as: 'T' }],
                groupBy: ['a'],
            })).to.equal([
                'SELECT *\n',
                'FROM  `table` `T` \n',
                'GROUP BY "a" \n',
                ';',
            ].join(''));
        });

        it('supports random sorting', () => {
            expect(format.query({
                random: true,
                from: [{ table: 'table', as: 'T' }],
            })).to.equal([
                'SELECT *\n',
                'FROM  `table` `T` \n',
                'ORDER BY RAND() \n',
                ';',
            ].join(''));
        });

        it('if query is already a string, returns it', () => {
            expect(format.query('SELECT alkjklasjasjdlkajas')).to.equal('SELECT alkjklasjasjdlkajas');
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

    describe('from()', () => {
        it('formats a {join, table, as, on} object to a from\'s join clause', () => {
            expect(format.from({
                join: true,
                table: 'tablename',
                as: 'T',
                on: { lhs: { table: 'T', field: 'f1' }, op: '=', rhs: { value: 3 } },
            })).to.equal('JOIN `tablename` `T` ON `T`.`f1` = 3');
        });
        it('join, as and on are optional', () => {
            expect(format.from({
                table: 'tablename',
            })).to.equal(' `tablename`  ');
        });
        it('if from is a string, then it gets returned', () => {
            expect(format.from('tablename')).to.equal('tablename');
        });
    });

    describe('fromAlias()', () => {
        it('formats a {join, table, as, on} object to the `as` attribute', () => {
            expect(format.fromAlias({
                join: true,
                table: 'tablename',
                as: 'T',
                on: { lhs: { table: 'T', field: 'f1' }, op: '=', rhs: { value: 3 } },
            })).to.equal('`T`');
        });
        it('uses table name if no alias is specified', () => {
            expect(format.fromAlias({
                join: true,
                table: 'tablename',
                on: { lhs: { table: 'tablename', field: 'f1' }, op: '=', rhs: { value: 3 } },
            })).to.equal('`tablename`');
        });
        it('if from is a string, then it gets returned', () => {
            expect(format.fromAlias('tablename')).to.equal('tablename');
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

        describe('IN()', () => {
            it('should return the sql format for an IN expression', () => {
                const result = format.conditionByOp.IN({ asIs: 'string' }, [1, 2, 3]);
                expect(result).to.equal('string IN (1, 2, 3)');
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

    describe('selectTerm()', () => {
        it('accepts an `as` parameter, for aliasing the term expression.', () => {
            const result = format.selectTerm({ field: 'termField', as: 'fieldAlias' });
            expect(result).to.equal('`termField` AS `fieldAlias`');
        });

        it('`as` parameter is optional.', () => {
            const result = format.selectTerm(null);
            expect(result).to.equal('NULL');
        });

        it('delegates other parameters to format.term.', () => {
            const spy = sinon.spy(format, 'term');
            const result = format.selectTerm({ field: 'termField', as: 'fieldAlias' });
            format.term.restore();
            expect(result).to.equal('`termField` AS `fieldAlias`');
            expect(spy.callCount).to.equal(1);
            expect(spy.getCall(0).args).to.deep.equal([{ field: 'termField', as: 'fieldAlias' }]);
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

        describe('dbOption', () => {
            it('should format a given option and value to a options phrase.', () => {
                expect(format.description.dbOption('option', 'value')).to.equal('OPTION="value"');
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
