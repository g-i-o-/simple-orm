
class TableListBuilder {
    constructor(list) {
        this.list = [];
        this.set = {};
        (list || []).forEach(table => this.addTable(table));
    }

    hasTable(table) {
        return !!this.set[table.as];
    }

    addTable(table) {
        if (!!table && !this.hasTable(table)) {
            this.set[table.as] = table;
            this.list.push(table);
        }
    }
}

module.exports = TableListBuilder;
