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
    constructor(properties){
        this.name = properties.name;
        this.type = properties.type;
        this.canBeNull = properties.canBeNull;
        this.autoIncrement = properties.autoIncrement;
        this.values = properties.values;
        this.default = properties.default;
    }
}

module.exports = Field;
