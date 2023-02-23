const fs = require('fs');
const { PATH_TO_DATABASE_FILE } = require('./defaults');

class Database {
    #database = this.#read_database();
    #database_name;
    #table_name;

    #check_available_database(name) {
        return this.#database[name] !== undefined;
    }

    constructor(database) {
        this.#database_name = database;
    }
    
    #check_available_table(name) {
        return this.#database[this.#database_name][name] !== undefined;
    }
    
    #save_database() {
        fs.writeFileSync(PATH_TO_DATABASE_FILE, JSON.stringify(this.#database), {encoding: 'utf8'});
    }

    #read_database() {
        const file = this.#read_file(PATH_TO_DATABASE_FILE, {encoding: 'utf8', flag: 'r'});

        if(file) {
            return JSON.parse(file);
        }

        return {};
    }

    #read_file(path, opts = {}) {
        if(fs.existsSync(path)) {
            return fs.readFileSync(path, opts);
        }
        
        return false;
    }

    table(name) {
        this.table_name = name;
        return this.#database;
    }

}

module.exports = Database;