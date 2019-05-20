const { expect } = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const path = require('path');
const MockConnectorClass = require('./test-files/MockConnectorClass');

const connectors = rewire('../lib/connectors');

describe('connectors', () => {
    let revertMocks = null;
    let mocks = null;
    let env = null;

    const setMocks = (_mocks) => {
        mocks = _mocks;
        revertMocks = connectors.__set__(_mocks);
    };

    beforeEach(() => {
        env = process.env;
    });

    afterEach(() => {
        if (revertMocks) {
            revertMocks();
            revertMocks = null;
        }
        if (env) {
            process.env = env;
            env = null;
        }
    });

    describe('getConnector()', () => {
        it('should return a connector instance, given the params', () => {
            setMocks({
                CONNECTOR_MODULES: { mockConnector: path.resolve(__dirname, 'test-files', 'MockConnectorClass') },
            });

            const connector = connectors.getConnector({ type: 'mockConnector', connectionParams: { param1: 1, param2: 2 } });

            expect(connector).to.be.instanceOf(MockConnectorClass);
            expect(connector.args).to.deep.equal([{ param1: 1, param2: 2 }]);
        });

        it('throws if connector is unknown', () => {
            setMocks({
                CONNECTOR_MODULES: { mockConnector: path.resolve(__dirname, 'test-files', 'MockConnectorClass') },
            });

            expect(() => {
                connectors.getConnector({ type: 'nonExistentMockConnector' });
            }).to.throw(Error);
        });

        it('default uses SIMPLE_ORM_DATABASE_TYPE env variable', () => {
            setMocks({
                CONNECTOR_MODULES: { mockConnector: path.resolve(__dirname, 'test-files', 'MockConnectorClass') },
            });

            process.env = { SIMPLE_ORM_DATABASE_TYPE: 'mockConnector' };

            const connector = connectors.getConnector();

            expect(connector).to.be.instanceOf(MockConnectorClass);
        });

        it('throws if SIMPLE_ORM_DATABASE_TYPE is not defined', () => {
            process.env = { };

            expect(() => { connectors.getConnector(); }).to.throw(Error);
        });
    });

    describe('getDefaultConnector()', () => {
        it('Should return the default connector singleton', () => {
            setMocks({
                defaultConnector: 'defaultConnector',
            });

            expect(connectors.getDefaultConnector()).to.equal('defaultConnector');
        });

        it('If singleton is falsey, then tries to create a default connector', () => {
            setMocks({
                defaultConnector: null,
                getConnector: sinon.mock().returns('connector'),
            });

            expect(connectors.getDefaultConnector()).to.equal('connector');
            expect(mocks.getConnector.callCount).to.equal(1);
        });
    });
});
