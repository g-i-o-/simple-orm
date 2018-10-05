/** Filters an object's properties.
 *  @param {Object} object - Object
 *  @param {Function} fn - function used to filter the object's properties.
 *                  default removes undefined properties.
 *
 *  @return {Object} containing the properties of object for which fn returned true.
 */
function filterKeys(object, fn = (v => v !== undefined)) {
    return Object.keys(object).reduce((_, key) => {
        if (fn(object[key], key)) {
            _[key] = object[key];
        }
        return _;
    }, {});
}

module.exports = filterKeys;
