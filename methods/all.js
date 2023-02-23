const fs = require('fs');
const { PATH_TO_DATABASE_FILE, PATH_TO_DATABASE_FOLDER } = require('./../defaults');

module.exports = function () {
    try {
        const json_database = fs.readFileSync(PATH_TO_DATABASE_FILE, {encoding: 'utf8'});
        let data = [];

        if (json_database) {
            const json = JSON.parse(json_database);

            data = recursive_object( json )
                .filter(item => item.value)
                .filter(item => item.path.indexOf('length') === -1)
                .reduce((paths, current) => {
                    current.value.forEach(row => {
                        const split_path = current.path.split('\\');
                        const database = split_path[0];
                        const table = split_path[1];
                        const path = `${database}\\${table}\\${row}.json`;

                        let file_data = fs.readFileSync(`${PATH_TO_DATABASE_FOLDER}\\${path}`);

                        file_data = (file_data)
                            ? JSON.parse(file_data)
                            : [];

                        paths.push({
                            database,
                            table,
                            row,
                            data: file_data,
                        });
                    });

                    return paths;
                }, []);
        }

        return data;
    } catch(e) {
        return [];
    }
}

function recursive_object(o, arr = [], n = 0, chain = []) {
    const keys = Object.keys(o);
    chain.push(keys[n]);
  
    if (typeof o[keys[n]] === 'object' && !Array.isArray(o[keys[n]])) {
        recursive_object(o[keys[n]], arr, 0, chain);
    } else {
        arr.push({
            path: chain.join('\\'),
            value: o[keys[n]]
        });
    }

    if (n < keys.length - 1) {
        chain.splice(-1);
        n++;
        recursive_object(o, arr, n, chain);
    } else {
        chain.splice(-1);
    }

    return arr;
}
