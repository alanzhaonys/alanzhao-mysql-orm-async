# Usage

## main.js
```
main = async () => {
  // Parse your enviornment variables saved in .env file
  require('dotenv').config();

  // Main database class
  const Database = require('./Database');
  // DbUser extends from DbObject
  const DbUser = require('./DbUser');

 // Get enviornment variables from
  const dbEndpoint = process.env.DB_ENDPOINT;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT;
  const dbConnectTimeout = process.env.DB_CONNECT_TIMEOUT;

  // Check database credentials
  if (!dbEndpoint || !dbUser || !dbPassword || !dbName) {
    throw new Error('Database credential is missing');
  }

  // Construct database configs
  const dbConfigs = {
    'dbHost': dbEndpoint,
    'dbUser': dbUser,
    'dbPassword': dbPassword,
    'dbName': dbName,
    'dbPort': dbPort,
    'dbConnectTimeout': dbConnectTimeout
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
  const totalUsers = await database.getAllCount('users'));
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

try {
  main();
} catch (error) {
  // All errors will get caught here
  console.log('Main error: ' + error.message);
}
```

## DbUser.js
```
const DbObject = require('./DbObject');

module.exports = class DbUser extends DbObject {
  constructor(db) {
    super(db);

    // Users table
    this.tableName = 'users';
  }

  async getSomeVerySepcialUsers() {
    const query = "SELECT * FROM users WHERE status = 'special'";
    const users = await this.db.query(query);
    return users;
  }
}
```

## API

<a name="Database"></a>

## Database
**Kind**: global class  

* [Database](#Database)
    * [new Database()](#new_Database_new)
    * [._connection](#Database+_connection) : <code>Object</code>
    * [._defaultDbConnectTimeout](#Database+_defaultDbConnectTimeout) : <code>number</code>
    * [._defaultDbPort](#Database+_defaultDbPort) : <code>number</code>
    * [._lastQuery](#Database+_lastQuery) : <code>string</code>
    * [._lastResults](#Database+_lastResults) : <code>array</code>
    * [._cache](#Database+_cache) : <code>Object</code>
    * [._dbClasses](#Database+_dbClasses) : <code>Object</code>
    * [._dbHost](#Database+_dbHost) : <code>string</code>
    * [._dbName](#Database+_dbName) : <code>string</code>
    * [._dbUser](#Database+_dbUser) : <code>string</code>
    * [._dbPassword](#Database+_dbPassword) : <code>string</code>
    * [._dbPort](#Database+_dbPort) : <code>string</code>
    * [._dbConnectTimeout](#Database+_dbConnectTimeout) : <code>number</code>
    * [.dbClasses](#Database+dbClasses) ⇒ <code>void</code>
    * [.dbHost](#Database+dbHost)
    * [.insertedId](#Database+insertedId)
    * [.lastResults](#Database+lastResults)
    * [.lastQuery](#Database+lastQuery)
    * [.affectedRows](#Database+affectedRows)
    * [.changedRows](#Database+changedRows)
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
    * [.scalar(query)](#Database+scalar) ⇒ <code>string</code> \| <code>number</code> \| <code>boolean</code> \| <code>decimal</code>
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
    * [.clearConnection()](#Database+clearConnection) ⇒ <code>void</code>
    * [.getDb(args)](#Database+getDb) ⇒ <code>array</code>

<a name="new_Database_new"></a>

### new Database()
Construct database connection

<a name="Database+_connection"></a>

### database.\_connection : <code>Object</code>
Connection instance of the database

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_defaultDbConnectTimeout"></a>

### database.\_defaultDbConnectTimeout : <code>number</code>
Default database connection time out in miliseconds. Default is 10 seconds.

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_defaultDbPort"></a>

### database.\_defaultDbPort : <code>number</code>
Default database port. Default is 3306.

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_lastQuery"></a>

### database.\_lastQuery : <code>string</code>
Last query recorded

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_lastResults"></a>

### database.\_lastResults : <code>array</code>
Last result set recorded

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_cache"></a>

### database.\_cache : <code>Object</code>
Holds the cache

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbClasses"></a>

### database.\_dbClasses : <code>Object</code>
Holds the DbObject mapping

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbHost"></a>

### database.\_dbHost : <code>string</code>
Database host

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbName"></a>

### database.\_dbName : <code>string</code>
Database name

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbUser"></a>

### database.\_dbUser : <code>string</code>
Database user

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbPassword"></a>

### database.\_dbPassword : <code>string</code>
Database password

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbPort"></a>

### database.\_dbPort : <code>string</code>
Database port

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+_dbConnectTimeout"></a>

### database.\_dbConnectTimeout : <code>number</code>
Database connection timeout

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+dbClasses"></a>

### database.dbClasses ⇒ <code>void</code>
Set dbClasses

**Kind**: instance property of [<code>Database</code>](#Database)  

| Param | Type | Description |
| --- | --- | --- |
| dbClasses | <code>array</code> | The DbObject mapping to set |

**Example**  
```js
// Example for `dbClasses`
let dbClasses = {
  'User': DbUser,
  'Job': DbJob
};
```
<a name="Database+dbHost"></a>

### database.dbHost
Getter methods

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+insertedId"></a>

### database.insertedId
Get last inserted ID

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+lastResults"></a>

### database.lastResults
Get last results

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+lastQuery"></a>

### database.lastQuery
Get last query

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+affectedRows"></a>

### database.affectedRows
Get number of deleted rows

**Kind**: instance property of [<code>Database</code>](#Database)  
<a name="Database+changedRows"></a>

### database.changedRows
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
// Example for data parameter:
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
// Example for `args`
   let args = [
   {
     entity: 'Test',
     method: 'get',
     args: [
      // querying row # 1
      1
     ]
   },
   {
     entity: 'Test',
     method: 'get',
     args: [
      // querying row # 2
      2
     ]
   }
 ];
// or
 let args = {
     entity: 'Test',
     method: 'get',
     args: [
      // querying row # 1
      1
     ]
   };
```
