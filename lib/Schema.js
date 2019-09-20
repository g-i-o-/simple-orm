const connectors = require('./connectors');

/** Represents an entity in the database
 */
class Schema {
    constructor(options, connection) {
        const { name } = options || {};
        this.name = name;
        this.finalized = false;
        this.models = {};
        this.unresolvedReferences = [];
        this.connection = connection;
    }

    addModel(model){
        if(this.finalized){
            throw new Error('Cannot add new models to a finalized schema.');
        }
        this.models[model.name] = model;
    }

    resolveReferences(throwIfUnresolved){
        // sift through the unresolve references
        this.unresolvedReferences = this.unresolvedReferences.filter(
            ([model, field, referenceName]) => {
                const reference = this.models[referenceName];
                if (reference) {
                    field.references = reference;
                    model.resolveReference(field);
                }

                // keep if no reference was found
                return !reference;
            }
        )
    }

    finalize(){
        this.finalized = true;

        this.resolveReferences();

        Object.values(this.models).reduce((_, model) => {
            _[model.alias] = (_[model.alias] | 0) + 1;
            if(_[model.alias] > 1){
                model.alias += _[model.alias];
            }
            return _;
        }, {})

        if(this.unresolvedReferences.length){
            throw new Error(`Schema finalized, but some references are still unresolved. Unresolved references: ${JSON.stringify(this.unresolvedReferences.map(([model, _, rname]) => [model.name, rname]))}`);
        }
    }

    addUnresolvedReference(model, field, referenceName){
        this.unresolvedReferences.push([model, field, referenceName]);
    }

    connect(connection) {
        this.connection = connection;
    }

    disconnect() {
        this.connection = null;
    }

    getConnection() {
        if (!this.connection) {
            this.connection = connectors.getDefaultConnector();
        }

        return this.connection;
    }
}

module.exports = Schema;
