This is the simple NoSQL database that built on the basis of files. Built on my previous nosql project but on class now. We have main folder *`core`* where all databases located as folders.\
The structure something like this:
```
core -> database_1 -> table_1 -> json files.
core -> database_1 -> table_2 -> json files.

core -> database_2 -> table_1 -> json files.
```
<br>

### How to use:
<br>

```javascript
const Database = require(path_to_database_folder); // connect database
const Database = require('./database');

const db = new Database("database_name"); // create database
```
```javascript
db.table("table_name").insert({}); // insert data to table

db.table("table_name").insert({
    id: "1234",
    name: "laptop",
    price: "40000",
});
// if id doesn't set then id will be start from 1
```
```javascript
db.table("table_name").remove(); // remove table
db.table("table_name").remove(id); // remove row by id
```
```javascript
db.table("table_name").find(); // filter data

db.table("books").find({
    "name": "book",
    "price": ">=1000"
}).get();
// find row where name equal `book` and price more or equal `1000`

db.table("laptops").find({
    "brand": "laptop",
    "price": ">=20000, <40000"
}).get();
// find row where brand equal `laptop` and price more or equal `20000` and less than `40000`
```
```javascript
db.table("table_name").sortby(value); // sort data by value
db.table("table_name").sortby("name").get(); // sort data by name
db.table("table_name").sortby("name", "desc").get(); // reverse sort data, default - asc
```
```javascript
db.table("table_name").get(offset, count);
db.table("table_name").get(4, 2); // get two records start from index 4
```
```javascript
Database.all(); // get data from all databases
```
