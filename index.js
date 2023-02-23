const fs = require('fs');
const { PATH_TO_DATABASE_FILE, PATH_TO_DATABASE_FOLDER } = require('./defaults');

class Database {
    #database = this.#read_database();
    #path = PATH_TO_DATABASE_FOLDER;
    #database_name;
    #table_name;
    #route;

    constructor(database_name) {
        this.#database_name = database_name;

        this.#create_folder();
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
        const file = this.#read_file(PATH_TO_DATABASE_FILE, {encoding: 'utf8'});

        if (file) {
            return JSON.parse(file);
        }

        return {};
    }

    #create_database() {
        const name = this.#database_name;
        this.#path += `\\${name}`;

        if (!this.#check_available_database(name)) {
            this.#database[name] = {};
            this.#save_database();
            this.#create_folder();
        }
    }

    #create_table() {
        this.#path += `\\${this.#table_name}`;

        if (!this.#check_available_table(this.#table_name)) {
            this.#database[this.#database_name][this.#table_name] = {
                rows: [],
                length: 0,
            };
            this.#save_database();
            this.#create_folder();
        }
        this.#route = this.#database[this.#database_name][this.#table_name];
    }

    #create_folder() {
        if (!fs.existsSync(this.#path)) {
            fs.mkdirSync(this.#path);
        }
    }

    #read_file(path, opts = {}) {
        if (fs.existsSync(path)) {
            return fs.readFileSync(path, opts);
        }

        return false;
    }

    #create_row({filename, data}) {
        const path_to_row = `${this.#path}\\${filename}.json`;
        fs.writeFileSync(path_to_row, JSON.stringify(data));

        this.#route.rows.push(filename);
        this.#route.length += 1;
        this.#save_database();
    }

    table(name) {
        this.#table_name = name;
        this.#create_table();

        return this;
    }

    insert(data) {
        let filename = data.id;
        if (!data.id) {
            const rows = this.#route.rows;
            filename = (rows.length)
                ? rows.at(-1) + 1
                : 1;
        }
        filename = filename.toString();

        this.#create_row({filename, data});
    }

    remove(id = null) {
        if (id) {
            id = id.toString();
            fs.unlinkSync(`${this.#path}\\${id}.json`);

            const ind = this.#route.rows.indexOf(id);
            this.#route.rows.splice(ind, 1);
            this.#route.length -= 1;
        } else {
            fs.rmSync(`${this.#path}`, {recursive: true, force: true});
            if (this.#table_name) {
                delete this.#database[this.#database_name][this.#table_name];
            } else {
                delete this.#database[this.#database_name];
            }
        }
        
        this.#save_database();
    }

}

module.exports = Database;
