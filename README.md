# Usage

## Summary
Running sequential SQL statements in NODEJS is not as straightforward and easy to read as using the procedural programing language 
such as PHP. Using nested callbacks or Promises clutters up your code. This is where Async/Await comes to the rescue.

To further clean and speed up the database query procedures, I added two database abstraction layers that wrap all the NPM `mysql2` functionality.
`Database.js` provides the common methods for all database needs. `DbObject.js` further abstracts the methods to provide one-to-one mapping of a database table to an object.

## Example: main.js

    main = async () => {
      // Parse your enviornment variables saved in .env file
      require('dotenv').config();

      // Main database class
      const Database = require('./Database');
      
      // DbUser extends from DbObject
      const DbUser = require('./DbUser');

      // Construct database configs
      const dbConfigs = {
        'dbHost': process.env.DB_ENDPOINT,
        'dbUser': process.env.DB_USER,
        'dbPassword': process.env.DB_PASSWORD,
        'dbName': process.env.DB_NAME,
        'dbPort': process.env.DB_PORT,
        'dbConnectTimeout': process.env.DB_CONNECT_TIMEOUT
      };

      // Instantiate database
      const database = new Database(dbConfigs);
      
      // Connect to database
      await database.connect();

      //
      // Examples on using the main Database class
      //

      // Basic query
      const query = 'SELECT * FROM users ORDER BY ID ASC';
      const users = await database.query(query);

      for (let i = 0; i < users.length; i++) {
        let user = users[i];
        console.log(user.firstName + ' ' + user.lastName);
      }

      // Output total users in Database
      const totalUsers = await database.getAllCount('users');
      console.log('Total users: ' + totalUsers);

      // Delete user ID of 10
      await database.delete('users', 10);
      console.log('Deleted a user #10');

      //
      // Examples on using the DbObject extended class
      //

      // Instantiate DbUser, pass the database connection
      const dbUser = new DbUser(database);

      // Call method on the DbUser
      const specialUsers = await dbUser.getSomeVerySpecialUsers();
      for (let i = 0; i < specialUsers.length; i++) {
        let user = users[i];
        console.log(user.firstName + ' ' + user.lastName);
      }

      // Use the inherited methods

      // User ID #10 exists?
      const userExists = await dbUser.exists(10);
      console.log('User #10 exists: ' + userExists);

      // Update an user
      await dbUser.update(10, { firstName: 'New First Name', lastName: 'New Last Name' });
      console.log('User #10 has been updated');
    }

    main().catch(error => {
        // All errors will get caught here
        console.log('Main error: ' + error.message);
    });

## Example: DbUser.js

    const DbObject = require('./DbObject');

    module.exports = class DbUser extends DbObject {
      constructor(db) {
        super(db);

        // Users table
        this.tableName = 'users';
      }

      async getSomeVerySpecialUsers() {
        const query = "SELECT * FROM users WHERE status = 'special'";
        const users = await this._db.query(query);
        return users;
      }
    }

## API

<a name="Database"></a>

### Database
**Kind**: global class  
**Params**: <code>array</code> configs The database connection configurations  

* [Database](#Database)
    * [new Database()](#new_Database_new)
    * [.dbClasses](#Database+dbClasses) ⇒ <code>void</code>
    * [.dbHost](#Database+dbHost) ⇒ <code>string</code>
    * [.dbPort](#Database+dbPort) ⇒ <code>number</code>
    * [.dbConnectTimeout](#Database+dbConnectTimeout) ⇒ <code>number</code>
    * [.dbUser](#Database+dbUser) ⇒ <code>string</code>
    * [.dbPassword](#Database+dbPassword) ⇒ <code>string</code>
    * [.dbName](#Database+dbName) ⇒ <code>string</code>
    * [.insertedId](#Database+insertedId) ⇒ <code>number</code>
    * [.lastResults](#Database+lastResults) ⇒ <code>array</code>
    * [.lastQuery](#Database+lastQuery) ⇒ <code>string</code>
    * [.affectedRows](#Database+affectedRows) ⇒ <code>number</code>
    * [.changedRows](#Database+changedRows) ⇒ <code>number</code>
    * [.connect(ssl, sslCerts)](#Database+connect) ⇒ <code>boolean</code>
    * [.close()](#Database+close) ⇒ <code>boolean</code>
    * [.escape(value)](#Database+escape) ⇒ <code>string</code>
    * [.escapeId(value)](#Database+escapeId) ⇒ <code>string</code>
    * [.format(query, values)](#Database+format) ⇒ <code>string</code>
    * [.execute(query, values)](#Database+execute) ⇒ <code>array</code>
    * [.query(query, [values])](#Database+query) ⇒ <code>array</code>
    * [.get(table, id)](#Database+get) ⇒ <code>Object</code>
    * [.getAll(table, orderBy)](#Database+getAll) ⇒ <code>array</code>
    * [.getAllCount(table)](#Database+getAllCount) ⇒ <code>integer</code>
    * [.getBy(table, criteria, [limit], [orderBy])](#Database+getBy) ⇒ <code>array</code>
    * [.insert(table, values)](#Database+insert) ⇒ <code>boolean</code>
    * [.update(table, id, values)](#Database+update) ⇒ <code>boolean</code>
    * [.updateBy(table, criteria, values)](#Database+updateBy) ⇒ <code>boolean</code>
    * [.delete(table, id)](#Database+delete) ⇒ <code>boolean</code>
    * [.deleteBy(table, criteria)](#Database+deleteBy) ⇒ <code>boolean</code>
    * [.exists(table, id)](#Database+exists) ⇒ <code>boolean</code>
    * [.existsBy(table, criteria, [excludeId])](#Database+existsBy) ⇒ <code>boolean</code>
    * [.array(query, [column])](#Database+array) ⇒ <code>array</code>
    * [.kvObject(query, key, value)](#Database+kvObject) ⇒ <code>Object</code>
    * [.row(query)](#Database+row) ⇒ <code>array</code>
    * [.scalar(query)](#Database+scalar) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code>
    * [.bool(query)](#Database+bool) ⇒ <code>boolean</code>
    * [.integer(query)](#Database+integer) ⇒ <code>number</code>
    * [.decimal(query, [decimal])](#Database+decimal) ⇒ <code>number</code>
    * [.tableExists(The)](#Database+tableExists) ⇒ <code>boolean</code>
    * [.transaction(queries)](#Database+transaction) ⇒ <code>boolean</code>
    * [.duplicateTable(from, to)](#Database+duplicateTable) ⇒ <code>boolean</code>
    * [.truncate(table)](#Database+truncate) ⇒ <code>boolean</code>
    * [.drop(table)](#Database+drop) ⇒ <code>boolean</code>
    * [.setEnvVar(name, value)](#Database+setEnvVar) ⇒ <code>boolean</code>
    * [.getEnvVar(name)](#Database+getEnvVar) ⇒ <code>array</code>
    * [.getTableColumns(name, [ignoreColumns])](#Database+getTableColumns) ⇒ <code>array</code>
    * [.getTableColumnDefaultValues(name, [ignoreColumns])](#Database+getTableColumnDefaultValues) ⇒ <code>Object</code>
    * [.getTableColumnDataTypes(name, [ignoreColumns])](#Database+getTableColumnDataTypes) ⇒ <code>Object</code>
    * [.export(results)](#Database+export) ⇒ <code>array</code>
    * [.saveCache(cacheId, value)](#Database+saveCache) ⇒ <code>void</code>
    * [.clearCache(cacheId)](#Database+clearCache) ⇒ <code>void</code>
    * [.clearAllCache()](#Database+clearAllCache) ⇒ <code>void</code>
    * [.getCache(cacheId)](#Database+getCache) ⇒ <code>array</code>
    * [.clearConnection()](#Database+clearConnection) ⇒ <code>void</code>
    * [.getDb(args)](#Database+getDb) ⇒ <code>array</code>

<a name="new_Database_new"></a>

### new Database()
Construct database connection

<a name="Database+dbClasses"></a>

### database.dbClasses ⇒ <code>void</code>
Set dbClasses

**Kind**: instance property of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| dbClasses | <code>array</code> | The DbObject mapping to set |

**Example**  
```js
// Example for `dbClasses` parameter
let dbClasses = {
  'User': DbUser,
  'Job': DbJob
};
```
<a name="Database+dbHost"></a>

### database.dbHost ⇒ <code>string</code>
Get dbHost variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbPort"></a>

### database.dbPort ⇒ <code>number</code>
Get dbPort variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbConnectTimeout"></a>

### database.dbConnectTimeout ⇒ <code>number</code>
Get dbConnectTimeout variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbUser"></a>

### database.dbUser ⇒ <code>string</code>
Get dbUser variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbPassword"></a>

### database.dbPassword ⇒ <code>string</code>
Get dbPassword variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbName"></a>

### database.dbName ⇒ <code>string</code>
Get dbName variable

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+insertedId"></a>

### database.insertedId ⇒ <code>number</code>
Get last inserted ID

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+lastResults"></a>

### database.lastResults ⇒ <code>array</code>
Get last results

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+lastQuery"></a>

### database.lastQuery ⇒ <code>string</code>
Get last query

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+affectedRows"></a>

### database.affectedRows ⇒ <code>number</code>
Get number of affected rows

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+changedRows"></a>

### database.changedRows ⇒ <code>number</code>
Get number of updated rows

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+connect"></a>

### database.connect(ssl, sslCerts) ⇒ <code>boolean</code>
Connect to database

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful connection  
**Throws**:

- Database connection error


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ssl | <code>boolean</code> | <code>false</code> | Using SSL connection? |
| sslCerts | <code>array</code> | <code></code> | The SSL certificate paths |

<a name="Database+close"></a>

### database.close() ⇒ <code>boolean</code>
Close database connection

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful close  
**Throws**:

- Database close error

<a name="Database+escape"></a>

### database.escape(value) ⇒ <code>string</code>
Escape string value

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>string</code> - Escaped value  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | Value to escape |

<a name="Database+escapeId"></a>

### database.escapeId(value) ⇒ <code>string</code>
Escape identifier(database/table/column name)

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>string</code> - Escaped value  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | Value to escape |

<a name="Database+format"></a>

### database.format(query, values) ⇒ <code>string</code>
Prepare a query with multiple insertion points,
utilizing the proper escaping for ids and values

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>string</code> - The formatted query  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | Query to format |
| values | <code>array</code> | The array of values |

**Example**  
```js
var query = "SELECT * FROM ?? WHERE ?? = ?";
var values = ['users', 'id', userId];
db.format(query, values);
```
<a name="Database+execute"></a>

### database.execute(query, values) ⇒ <code>array</code>
Prepare and run query
Differences between execute() and query():

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Results of query  
**See**: https://github.com/sidorares/node-mysql2/issues/382  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | Query to execute |
| values | <code>array</code> | The values of the query |

**Example**  
```js
var query = "SELECT * FROM ?? WHERE ?? = ?";
var values = ['users', 'id', userId];
await db.execute(query, values);
```
<a name="Database+query"></a>

### database.query(query, [values]) ⇒ <code>array</code>
Run a query

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Results of query  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>string</code> |  | Query to execute |
| [values] | <code>array</code> | <code>[]</code> | The values of the query, optional |

**Example**  
```js
var query = "SELECT * FROM ?? WHERE ?? = ?";
var values = ['users', 'id', userId];
await db.query(query, values);
// or
var query = "SELECT * FROM users WHERE id = 10";
await db.query(query);
```
<a name="Database+get"></a>

### database.get(table, id) ⇒ <code>Object</code>
Get one record by ID

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Object</code> - The row as an object  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| id | <code>number</code> | The primary ID |

<a name="Database+getAll"></a>

### database.getAll(table, orderBy) ⇒ <code>array</code>
Get all records from a table

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - The result array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| table | <code>string</code> |  | The table name |
| orderBy | <code>string</code> | <code>null</code> | The order by syntax, example "id DESC" |

<a name="Database+getAllCount"></a>

### database.getAllCount(table) ⇒ <code>integer</code>
Get all record count of a table

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>integer</code> - The total count of the table  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |

<a name="Database+getBy"></a>

### database.getBy(table, criteria, [limit], [orderBy]) ⇒ <code>array</code>
Construct a SELECT query and execute it

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - The result array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| table | <code>string</code> |  | The table name |
| criteria | <code>Object</code> |  | The criteria, example:   {     id: 10,     status: 'expired'   } |
| [limit] | <code>number</code> | <code></code> | The number of results to return, optional |
| [orderBy] | <code>string</code> | <code>null</code> | The order by syntax, example "id DESC", optional |

<a name="Database+insert"></a>

### database.insert(table, values) ⇒ <code>boolean</code>
Construct single or multiple INSERT queries and execute

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful insertion  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| values | <code>array</code> \| <code>Object</code> | The data to insert as a single object or array of objects |

**Example**  
```js
// Example for `values` parameter
{
  id: 10,
  firstName: 'John',
  lastName: 'Doe',
  status: 'active'
}
// or
[{
  id: 10,
  firstName: 'John',
  lastName: 'Doe',
  status: 'active'
}, ... ]
```
<a name="Database+update"></a>

### database.update(table, id, values) ⇒ <code>boolean</code>
Construct an UPDATE by ID query and execute

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful update  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| id | <code>number</code> | The primary ID of the record |
| values | <code>Object</code> | The data to update |

<a name="Database+updateBy"></a>

### database.updateBy(table, criteria, values) ⇒ <code>boolean</code>
Construct an update by criteria query and execute

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful update  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| criteria | <code>Object</code> | The criteria used to match the record |
| values | <code>Object</code> | The data to update |

<a name="Database+delete"></a>

### database.delete(table, id) ⇒ <code>boolean</code>
Construct delete by ID query and execute

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful deletion  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| id | <code>number</code> | The primary ID of the record |

<a name="Database+deleteBy"></a>

### database.deleteBy(table, criteria) ⇒ <code>boolean</code>
Construct delete by criteria query and execute

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true on successful delete  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| criteria | <code>Object</code> | The criteria used to match the record |

<a name="Database+exists"></a>

### database.exists(table, id) ⇒ <code>boolean</code>
Check if a record exists by the ID

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if record exists  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table name |
| id | <code>number</code> | The primary ID of the record |

<a name="Database+existsBy"></a>

### database.existsBy(table, criteria, [excludeId]) ⇒ <code>boolean</code>
Check if a record matching the criteria exists

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if record exists  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| table | <code>string</code> |  | The table name |
| criteria | <code>Object</code> |  | The criteria used to match the record |
| [excludeId] | <code>number</code> | <code></code> | The ID to exclude |

<a name="Database+array"></a>

### database.array(query, [column]) ⇒ <code>array</code>
Execute a query and return column result as array

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns the result as array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>string</code> |  | The query to execute |
| [column] | <code>string</code> | <code>null</code> | The column of the result set. If not provided, first column will be used |

<a name="Database+kvObject"></a>

### database.kvObject(query, key, value) ⇒ <code>Object</code>
Return results as custom key and value pair object

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Object</code> - Returns the result as object  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The query to execute |
| key | <code>string</code> | The column of the result to use as key of the object |
| value | <code>string</code> | The column of the result to use as value of the object |

<a name="Database+row"></a>

### database.row(query) ⇒ <code>array</code>
Return first row of the result set

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns the result as array  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The query to execute |

<a name="Database+scalar"></a>

### database.scalar(query) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code> \| <code>decimal</code>
Return scalar value

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>string</code> \| <code>number</code> \| <code>boolean</code> \| <code>decimal</code> - Returns the result as scalar  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The query to execute |

<a name="Database+bool"></a>

### database.bool(query) ⇒ <code>boolean</code>
Return boolean value

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns the result as boolean  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The query to execute |

<a name="Database+integer"></a>

### database.integer(query) ⇒ <code>number</code>
Return integer value

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>number</code> - Returns the result as integer  

| Param | Type | Description |
| --- | --- | --- |
| query | <code>string</code> | The query to execute |

<a name="Database+decimal"></a>

### database.decimal(query, [decimal]) ⇒ <code>number</code>
Return decimal value

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>number</code> - Returns the result as decimal  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| query | <code>string</code> |  | The query to execute |
| [decimal] | <code>number</code> | <code>2</code> | The number of decimal places |

<a name="Database+tableExists"></a>

### database.tableExists(The) ⇒ <code>boolean</code>
Whether or not a table exists

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if table exists  

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |

<a name="Database+transaction"></a>

### database.transaction(queries) ⇒ <code>boolean</code>
Run queries in transaction

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if transaction is successful  

| Param | Type | Description |
| --- | --- | --- |
| queries | <code>array</code> | An array of queries to run in transaction |

<a name="Database+duplicateTable"></a>

### database.duplicateTable(from, to) ⇒ <code>boolean</code>
Duplicate content to a new table

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if duplication is successful  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>string</code> | The table to copy from |
| to | <code>string</code> | The table to copy to |

<a name="Database+truncate"></a>

### database.truncate(table) ⇒ <code>boolean</code>
Truncate a table

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if table is truncated  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table to truncate |

<a name="Database+drop"></a>

### database.drop(table) ⇒ <code>boolean</code>
Drop a table

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if table is dropped  

| Param | Type | Description |
| --- | --- | --- |
| table | <code>string</code> | The table to drop |

<a name="Database+setEnvVar"></a>

### database.setEnvVar(name, value) ⇒ <code>boolean</code>
Set an environment variable

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>boolean</code> - Returns true if table is truncated  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the environment variable |
| value | <code>string</code> | Value of the environment variable |

<a name="Database+getEnvVar"></a>

### database.getEnvVar(name) ⇒ <code>array</code>
Get an environment variable

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns true if table is truncated  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Name of the environment variable to get |

<a name="Database+getTableColumns"></a>

### database.getTableColumns(name, [ignoreColumns]) ⇒ <code>array</code>
Get table columns

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns names of the table as array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of the table |
| [ignoreColumns] | <code>string</code> | <code>null</code> | Columns to ignore |

<a name="Database+getTableColumnDefaultValues"></a>

### database.getTableColumnDefaultValues(name, [ignoreColumns]) ⇒ <code>Object</code>
Get column default values

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Object</code> - Returns an object with column names and their default values  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of the table |
| [ignoreColumns] | <code>string</code> | <code>null</code> | Columns to ignore |

<a name="Database+getTableColumnDataTypes"></a>

### database.getTableColumnDataTypes(name, [ignoreColumns]) ⇒ <code>Object</code>
Get column data types

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>Object</code> - Returns an object with column names and their data types  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of the table |
| [ignoreColumns] | <code>string</code> | <code>null</code> | Columns to ignore |

<a name="Database+export"></a>

### database.export(results) ⇒ <code>array</code>
Export results

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns cleaned up results  

| Param | Type | Description |
| --- | --- | --- |
| results | <code>array</code> | Results to export |

<a name="Database+saveCache"></a>

### database.saveCache(cacheId, value) ⇒ <code>void</code>
Save value to cache

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The cache ID |
| value | <code>string</code> | The value to cache |

<a name="Database+clearCache"></a>

### database.clearCache(cacheId) ⇒ <code>void</code>
Clear a cache

**Kind**: instance method of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The ID of the cache to clear |

<a name="Database+clearAllCache"></a>

### database.clearAllCache() ⇒ <code>void</code>
Clear all cache

**Kind**: instance method of [<code>Database</code>](#Database)  
<a name="Database+getCache"></a>

### database.getCache(cacheId) ⇒ <code>array</code>
Get cache by ID

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns the cached result set  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The ID of the cache to get |

<a name="Database+clearConnection"></a>

### database.clearConnection() ⇒ <code>void</code>
Clear connection

**Kind**: instance method of [<code>Database</code>](#Database)  
<a name="Database+getDb"></a>

### database.getDb(args) ⇒ <code>array</code>
Call method(s) on multiple DbObjects at the same time

**Kind**: instance method of [<code>Database</code>](#Database)  
**Returns**: <code>array</code> - Returns an array of results  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>array</code> \| <code>Object</code> | The arguments |

**Example**  
```js
// Example for `args` parameter
let args = [{
  entity: 'User',
  method: 'get',
  args: [
    // querying row # 1
    1
  ]
}, {
  entity: 'User',
  method: 'get',
  args: [
    // querying row # 2
    2
  ]
}];
// or
let args = {
  entity: 'User',
  method: 'get',
  args: [
    // querying row # 1
    1
  ]
};
```



<a name="DbObject"></a>

### DbObject
**Kind**: global class  

* [DbObject](#DbObject)
    * [new DbObject(db)](#new_DbObject_new)
    * [.tableName](#DbObject+tableName) ⇒ <code>void</code>
    * [.tableName](#DbObject+tableName) ⇒ <code>string</code>
    * [.get(id)](#DbObject+get) ⇒ <code>array</code>
    * [.getAll([orderBy])](#DbObject+getAll) ⇒ <code>array</code>
    * [.getAllCount()](#DbObject+getAllCount) ⇒ <code>number</code>
    * [.find(criteria, [limit], [orderBy])](#DbObject+find) ⇒ <code>array</code>
    * [.findOne(criteria, [orderBy])](#DbObject+findOne) ⇒ <code>Object</code>
    * [.findColumn(criteria, columnName, [orderBy])](#DbObject+findColumn) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code>
    * [.create(values)](#DbObject+create) ⇒ <code>boolean</code>
    * [.update(id, values)](#DbObject+update) ⇒ <code>boolean</code>
    * [.updateBy(criteria, values)](#DbObject+updateBy) ⇒ <code>boolean</code>
    * [.delete(id)](#DbObject+delete) ⇒ <code>boolean</code>
    * [.deleteBy(criteria)](#DbObject+deleteBy) ⇒ <code>boolean</code>
    * [.exists(id)](#DbObject+exists) ⇒ <code>boolean</code>
    * [.existsBy(criteria, [excludeId])](#DbObject+existsBy) ⇒ <code>boolean</code>
    * [.updatePositionColumnById(values)](#DbObject+updatePositionColumnById) ⇒ <code>boolean</code>
    * [.saveCache(cacheId, value)](#DbObject+saveCache) ⇒ <code>void</code>
    * [.clearCache(cacheId)](#DbObject+clearCache) ⇒ <code>void</code>
    * [.clearAllCache()](#DbObject+clearAllCache) ⇒ <code>void</code>
    * [.getCache(cacheId)](#DbObject+getCache) ⇒ <code>array</code>
    * [.escape(value)](#DbObject+escape) ⇒ <code>string</code>
    * [.escapeId(value)](#DbObject+escapeId) ⇒ <code>string</code>

<a name="new_DbObject_new"></a>

### new DbObject(db)
Construct the DbObject


| Param | Type | Description |
| --- | --- | --- |
| db | <code>Objct</code> | The database object |

<a name="DbObject+tableName"></a>

### dbObject.tableName ⇒ <code>void</code>
Set tableName of this object

**Kind**: instance property of [<code>DbObject</code>](#DbObject)  
**Params**: <code>string</code> tableName The table name  
<a name="DbObject+tableName"></a>

### dbObject.tableName ⇒ <code>string</code>
Get tableName of this object

**Kind**: instance property of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>string</code> - The table name  
<a name="DbObject+get"></a>

### dbObject.get(id) ⇒ <code>array</code>
Get entity by ID

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>array</code> - The entity array  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The primary ID of entity |

<a name="DbObject+getAll"></a>

### dbObject.getAll([orderBy]) ⇒ <code>array</code>
Get all entities

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>array</code> - All the result sets as an array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [orderBy] | <code>string</code> | <code>null</code> | The order by string |

<a name="DbObject+getAllCount"></a>

### dbObject.getAllCount() ⇒ <code>number</code>
Get all entity count

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>number</code> - Total number of entities  
<a name="DbObject+find"></a>

### dbObject.find(criteria, [limit], [orderBy]) ⇒ <code>array</code>
Find entities

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>array</code> - The result array  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| criteria | <code>Object</code> |  | The criteria |
| [limit] | <code>number</code> | <code></code> | The number of results to return, optional |
| [orderBy] | <code>string</code> | <code>null</code> | The order by syntax, example "id DESC", optional |

**Example**  
```js
// Example for `criteria` parameter
 {
   id: 10,
   status: 'expired'
 }
```
<a name="DbObject+findOne"></a>

### dbObject.findOne(criteria, [orderBy]) ⇒ <code>Object</code>
Find one entity

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>Object</code> - The entity as object  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| criteria | <code>Object</code> |  | The criteria |
| [orderBy] | <code>string</code> | <code>null</code> | The order by syntax, example "id DESC", optional |

<a name="DbObject+findColumn"></a>

### dbObject.findColumn(criteria, columnName, [orderBy]) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code>
Find a column from an entity

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>string</code> \| <code>number</code> \| <code>boolean</code> - The column value  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| criteria | <code>Object</code> |  | The criteria. If multiple rows matching the criteria are found, only the first row will be used |
| columnName | <code>string</code> |  | The column to return |
| [orderBy] | <code>string</code> | <code>null</code> | The order by syntax, example "id DESC", optional |

<a name="DbObject+create"></a>

### dbObject.create(values) ⇒ <code>boolean</code>
Create an entity

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful creation  

| Param | Type | Description |
| --- | --- | --- |
| values | <code>array</code> \| <code>Object</code> | The data to insert as a single object or array of objects |

**Example**  
```js
// Example for `values` parameter
{
  id: 10,
  firstName: 'John',
  lastName: 'Doe',
  status: 'active'
}
// or
[{
  id: 10,
  firstName: 'John',
  lastName: 'Doe',
  status: 'active'
}, ... ]
```
<a name="DbObject+update"></a>

### dbObject.update(id, values) ⇒ <code>boolean</code>
Update an entity by ID

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful update  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The primary ID of the entity |
| values | <code>Object</code> | The data to update |

<a name="DbObject+updateBy"></a>

### dbObject.updateBy(criteria, values) ⇒ <code>boolean</code>
Update entity with multiple matching criteria

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful update  

| Param | Type | Description |
| --- | --- | --- |
| criteria | <code>Object</code> | The criteria used to match the record |
| values | <code>Object</code> | The data to update |

<a name="DbObject+delete"></a>

### dbObject.delete(id) ⇒ <code>boolean</code>
Delete an entity by ID

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful deletion  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The primary ID of the record |

<a name="DbObject+deleteBy"></a>

### dbObject.deleteBy(criteria) ⇒ <code>boolean</code>
Delete entity with multiple matching criteria

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful delete  

| Param | Type | Description |
| --- | --- | --- |
| criteria | <code>Object</code> | The criteria used to match the record |

<a name="DbObject+exists"></a>

### dbObject.exists(id) ⇒ <code>boolean</code>
Does entity ID exist?

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true if record exists  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The primary ID of the record |

<a name="DbObject+existsBy"></a>

### dbObject.existsBy(criteria, [excludeId]) ⇒ <code>boolean</code>
Does entity exists matching multiple criteria

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true if record exists  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| criteria | <code>Object</code> |  | The criteria used to match the record |
| [excludeId] | <code>number</code> | <code></code> | The ID to exclude |

<a name="DbObject+updatePositionColumnById"></a>

### dbObject.updatePositionColumnById(values) ⇒ <code>boolean</code>
Update entities' position column

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>boolean</code> - Returns true on successful update  

| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object</code> | The position values to update |

**Example**  
```js
// Example for `values` parameter
{
  100: 5, // entity #100 gets a new `position` value of 5
  101: 6,
  102: 7,
  103: 8
}
```
<a name="DbObject+saveCache"></a>

### dbObject.saveCache(cacheId, value) ⇒ <code>void</code>
Save cache

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The cache ID |
| value | <code>string</code> | The value to cache |

<a name="DbObject+clearCache"></a>

### dbObject.clearCache(cacheId) ⇒ <code>void</code>
Clear cache

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The ID of the cache to clear |

<a name="DbObject+clearAllCache"></a>

### dbObject.clearAllCache() ⇒ <code>void</code>
Clear all cache

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
<a name="DbObject+getCache"></a>

### dbObject.getCache(cacheId) ⇒ <code>array</code>
Get cache by ID

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>array</code> - Returns the cached result set  

| Param | Type | Description |
| --- | --- | --- |
| cacheId | <code>string</code> | The ID of the cache to get |

<a name="DbObject+escape"></a>

### dbObject.escape(value) ⇒ <code>string</code>
Escape string value

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>string</code> - Escaped value  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | Value to escape |

<a name="DbObject+escapeId"></a>

### dbObject.escapeId(value) ⇒ <code>string</code>
Escape identifier(database/table/column name)

**Kind**: instance method of [<code>DbObject</code>](#DbObject)  
**Returns**: <code>string</code> - Escaped value  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | Value to escape |
