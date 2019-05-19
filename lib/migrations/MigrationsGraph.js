const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

// const debug = require('debug')('simpleOrm:migrations:MigrationsGraph');
const debug = console.log.bind(console);

class MigrationsGraph {
    constructor(modelspath) {
        this.path = modelspath;
        this.load();
    }

    connectMigrations() {
        this.namingConflicts = [];

        this.byName = this.list.reduce((_, migration) => {
            const { name } = migration;
            if (_[name] && this.namingConflicts.indexOf(name) === -1) {
                this.namingConflicts.push(name);
            }

            _[name] = migration;

            return _;
        }, {});

        this.missing = [];

        this.list.forEach((migration) => {
            if (migration.dependencies) {
                migration.dependencies.forEach((dependency, idx) => {
                    const name = typeof dependency === 'string' ? dependency : dependency.name;
                    const provider = this.byName[name];
                    if (!provider && this.missing.findIndex(item => item.name === name) === -1) {
                        this.missing.push({ name, by: migration.name });
                    } else {
                        (provider.providesFor || (provider.providesFor = [])).push(migration);
                        migration.dependencies[idx] = provider;
                    }
                });
            }
        });

        this.rootMigrations = this.list.filter(migration => !migration.dependencies || !migration.dependencies.length);
        this.leafMigrations = this.list.filter(migration => !migration.providesFor);
        this.dirtyMigrations = this.list.filter(migration => migration.dirty);
    }

    addMigration(migration) {
        migration.dirty = true;
        this.list.push(migration);
        this.connectMigrations();
    }

    validate() {
        if (this.namingConflicts.length) {
            throw new Error(`Some migration names are conflicting: ${this.namingConflicts.join(', ')}`);
        }

        if (this.missing.length) {
            throw new Error(`Some migrations are missing: ${this.missing.map(item => `${item.name} by ${item.by}`).join(', ')}`);
        }

        if (this.leafMigrations.length > 1) {
            throw new Error(`There are divergent migrations wich must be merged: ${
                this.leafMigrations.map(migration => migration.name).join(', ')
            }`);
        }
    }

    load() {
        debug('Reading migrations from ', this.path);

        try {
            this.list = fs.readdirSync(this.path).filter(file => /\.migration\.yaml$/.test(file)).map(
                file => YAML.parse(fs.readFileSync(path.join(this.path, file), 'utf-8')),
            );
        } catch (e) {
            this.list = [];
        }

        this.connectMigrations();
    }

    save() {
        const migrationPaths = this.dirtyMigrations.map(
            migration => path.join(this.path, `${migration.name}.migration.yaml`),
        );

        if (!migrationPaths.length) {
            debug('All migrations are already saved.');
            return 0;
        }

        debug(`Saving ${migrationPaths.length} migrations:`);
        migrationPaths.forEach(migrationPath => debug(`   ${migrationPath}`));

        try {
            fs.mkdirSync(this.path);
        } catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }

        if (migrationPaths.filter(fs.existsSync).length) {
            throw new Error('Cannot save all migrations. Some names clash.');
        }


        migrationPaths.forEach((migrationPath, idx) => {
            const migration = this.dirtyMigrations[idx];
            delete migration.dirty;

            console.log('saving migration', migration);
            try {
                fs.writeFileSync(
                    migrationPath,
                    YAML.stringify(migration, null, 4),
                    { encoding: 'utf-8', flag: 'wx' },
                );
            } catch (e) {
                migration.dirty = true;
                throw e;
            }
        });

        this.connectMigrations();

        return migrationPaths.length;
    }
}


module.exports = MigrationsGraph;
