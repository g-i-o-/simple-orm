
/** Represents an entity in the database
 */
class Field {
    /**
     *  @param {Object} properties
     *  @param {Object} properties.name
     *  @param {Object} properties.type
     *  @param {Object} properties.canBeNull
     *  @param {Object} properties.autoIncrement
     *  @param {Object} properties.values
     *  @param {Object} properties.default
     */
    constructor(properties) {
        this.name = properties.name;
        this.referenceName = properties.referenceName;
        this.type = properties.type;
        this.canBeNull = properties.canBeNull;
        this.canBeShown = properties.canBeShown !== false;
        this.show = properties.show === undefined ? true : properties.show;
        this.autoIncrement = properties.autoIncrement;
        this.values = properties.values;
        this.default = properties.default;
        this.references = properties.references;
    }
}

module.exports = Field;
