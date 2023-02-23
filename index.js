const fs = require('fs');
const { PATH_TO_DATABASE_FILE, PATH_TO_DATABASE_FOLDER } = require('./defaults');
const all_data = require('./methods/all');

class Database {
    #database = this.#read_database();
    #path = PATH_TO_DATABASE_FOLDER;
    #database_name;
    #table_name;
    #route;
    #sort = [];

    constructor(database_name = 'default') {
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
        if(this.#path.indexOf(this.#table_name) === -1) {
            this.#path += `\\${this.#table_name}`;
        }
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

        if (this.#route.rows.indexOf(filename) === -1) {
            this.#route.rows.push(filename);
            this.#route.length += 1;
        }
        this.#save_database();
    }

    static all() {
        return all_data();
    }

    table(name = null) {
        this.#table_name = name;
        if (name) {
            this.#create_table();
        }else {
            this.#path = null;
        }

        return this;
    }

    insert(data = null) {
        if (data) {
            let filename = data.id;
            if (!data.id) {
                const rows = this.#route.rows;
                filename = (rows.length)
                    ? parseInt(rows.at(-1)) + 1
                    : 1;
            }
            filename = filename.toString();

            this.#create_row({filename, data});
        }
    }

    remove(id = null) {
        if (id !== null || id !== '') {
            id = id.toString();
            const file = `${this.#path}\\${id}.json`;
            if(fs.existsSync(file)) {
                fs.unlinkSync(file);
                
                const ind = this.#route.rows.indexOf(id);
                this.#route.rows.splice(ind, 1);
                this.#route.length -= 1;
            }
        } else {
            if (this.#path) {
                fs.rmSync(`${this.#path}`, {recursive: true, force: true});

                if (this.#table_name && this.#database_name) {
                    delete this.#database[this.#database_name][this.#table_name];
                }
                if (!this.#table_name && this.#database_name) {
                    delete this.#database[this.#database_name];
                }
            }
        }
        
        this.#save_database();
    }

    sortby(value = null, second = null) {
        if(value) {
            this.#sort = (second === 'asc' || !second)
                ? [value, 'asc']
                : [value, 'desc'];
        }

        return this;
    }

}

module.exports = Database;
