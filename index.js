const fs = require('fs');
const { PATH_TO_DATABASE_FILE } = require('./defaults');

class Database {
    #database = this.#read_database();
    #database_name;
    #table_name;

    constructor(database) {
        this.#database_name = database;

        this.#create_database();
    }

    #check_available_database(name) {
        return this.#database[name] !== undefined;
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

    #create_database() {
        const name = this.#database_name;

        if(!this.#check_available_database(name)) {
            this.#database[name] = {};
            this.#save_database();
        }
    }

    #create_table() {
        if(!this.#check_available_table(this.#table_name)) {
            this.#database[this.#database_name][this.#table_name] = {
                rows: [],
                length: 0,
            };
            this.#save_database();
        }
    }

    #read_file(path, opts = {}) {
        if(fs.existsSync(path)) {
            return fs.readFileSync(path, opts);
        }

        return false;
    }

    #write_file(path, {filename, data}) {
        const path_to_row = `${path}\\${filename}.json`;
        fs.writeFileSync(path_to_row, JSON.stringify(data));
    }

    table(name) {
        this.#table_name = name;
        this.#create_table();

        return this;
    }

}

module.exports = Database;