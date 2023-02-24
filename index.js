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
    #temp_arr = [];

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
        this.#path = `${PATH_TO_DATABASE_FOLDER}\\${name}`;

        if (!this.#check_available_database(name)) {
            this.#database[name] = {};
            this.#save_database();
            this.#create_folder();
        }
    }

    #create_table() {
        if (!this.#check_available_table(this.#table_name)) {
            this.#database[this.#database_name][this.#table_name] = {
                rows: [],
                length: 0,
            };
            this.#save_database();
            this.#create_folder();
        }
        this.#route = this.#database[this.#database_name][this.#table_name];
        this.#temp_arr = [...this.#route.rows];
    }

    #create_folder() {
        console.log(this.#path);
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
        this.#path = `${PATH_TO_DATABASE_FOLDER}\\${this.#database_name}\\${name}`;
        this.#sort = [];

        if (name) {
            this.#create_table();
        }

        return this;
    }

    insert(data = null) {
        if (
            data &&
            typeof data === 'object' &&
            !Array.isArray(data) &&
            Object.keys(data).length > 0
        ) {
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
        if (id !== null && id !== '') {
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

            const [param, type] = this.#sort;
            const data = this.#temp_arr.reduce((arr, filename) => {
                const file_data = fs.readFileSync(`${this.#path}\\${filename}.json`);
                const json = JSON.parse(file_data);
                const value = json[param];

                if(value) {
                    const data = [value, filename];
                    arr.push(data);
                }

                return arr;
            }, []);

            data.sort((a, b) => {
                const condition = (type === 'desc')
                    ? b[0] > a[0]
                    : a[0] > b[0];

                return (condition)
                    ? 1
                    : -1;
            });
            
            if(data.length) {
                this.#temp_arr = data.map(info => info[1]);
            }
        }

        return this;
    }

    find(object = {}) {
        let object_keys = (object)
            ? Object.keys(object)
            : [];

        if(object_keys.length > 0 && !Array.isArray(object)) {
            let data = [];
            data = this.#temp_arr.reduce((arr, file) => {
                const file_info = fs.readFileSync(`${this.#path}\\${file}.json`);
                const json = JSON.parse(file_info);

                let found = true;
                object_keys.forEach(key => {
                    if(Object.hasOwn(json, key) && object[key]) {
                        if(json[key].toString().indexOf(object[key]) === -1) {
                            found = false;
                        }

                        if (/(<|>|=)\s?[0-9]/.test(object[key])) {
                            const conditions = object[key].split(/,\s?/);
                            
                            for (let condition of conditions) {
                                const data_num = condition.match(/[0-9]+/);
                                const regex_data_number = /^\s?([>|<|=]{1,2})?\s?[0-9]+\s?$/;
                                const symbol_str = condition.match(regex_data_number);

                                if(symbol_str) {
                                    const compare = {
                                        '>': function(num1, num2) {
                                            return this._(num1, num2) > 0;
                                        },
                                        '<': function(num1, num2) {
                                            return this._(num1, num2) < 0;
                                        },
                                        '>=': function(num1, num2) {
                                            return this._(num1, num2) >= 0;
                                        },
                                        '<=': function(num1, num2) {
                                            return this._(num1, num2) <= 0;
                                        },
                                        _(num1, num2) {
                                            return parseInt(num1) - parseInt(num2);
                                        }
                                    }

                                    const num_from_file = json[key];
                                    const num_from_object = data_num;
                                    if(Object.hasOwn(compare, symbol_str[1])) {
                                        found = compare[symbol_str[1]](num_from_file, num_from_object);
                                    }
                                }

                                if (!found) break;
                            }
                        }
                    }
                });

                if(found) {
                    arr.push(file);
                }

                return arr;
            }, []);

            this.#temp_arr = [...data];
        }

        return this;
    }

    get(offset = null, count = null) {
        let rows = this.#temp_arr;
        let data = [];

        if(!isNaN(parseInt(offset)) && offset >= 0) {
            if(count > 0) {
                rows = rows.slice(offset, offset + count);
            }else {
                rows = rows.slice(0, offset);
            }
        }
        
        if(rows.length) {
            data = rows.reduce((arr, filename) => {
                const path_to_file = `${this.#path}\\${filename}.json`;
                const file = fs.readFileSync(path_to_file);
                const file_data = JSON.parse(file);

                arr.push(file_data);
                return arr;
            }, []);
        }

        return data;
    }

}

module.exports = Database;
