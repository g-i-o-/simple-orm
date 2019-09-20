
class TableListBuilder {
    constructor(list) {
        this.list = [];
        this.set = {};
        (list || []).forEach(table => this.addTable(table));
    }

    getTable(table) {
        return this.set[(table && table.as) || table];
    }

    hasTable(table) {
        return !!this.getTable(table);
    }

    addTable(table) {
        const existingTable = this.getTable(table);
        if(!table){
            // do nothing
        } else if (!existingTable) {
            this.set[table.as] = table;
            this.list.push(table);
        } else if(existingTable.table !== table.table){
            throw new Error(`Cannot add table '${table.table}' with alias '${table.as}', table '${existingTable.table}' already has that alias.`);
        }
    }
}

module.exports = TableListBuilder;
