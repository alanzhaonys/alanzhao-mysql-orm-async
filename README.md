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
A database wrapper for npm 'mysql2' package

**Kind**: global class

* [Database](#Database)
    * [new Database()](#new_Database_new)
    * [.dbClasses](#Database+dbClasses)
    * [.dbHost](#Database+dbHost)
    * [.insertedId](#Database+insertedId)
    * [.lastResults](#Database+lastResults)
    * [.lastQuery](#Database+lastQuery)
    * [.affectedRows](#Database+affectedRows)
    * [.changedRows](#Database+changedRows)
    * [.connect(Using, The)](#Database+connect) ⇒ <code>boolean</code>
    * [.close()](#Database+close) ⇒ <code>boolean</code>
    * [.escape(Value)](#Database+escape) ⇒ <code>string</code>
    * [.escapeId(Value)](#Database+escapeId) ⇒ <code>string</code>
    * [.format(Query, The)](#Database+format) ⇒ <code>string</code>
    * [.execute(Query, The)](#Database+execute) ⇒ <code>array</code>
    * [.query(Query, The)](#Database+query) ⇒ <code>array</code>
    * [.get(The, The)](#Database+get) ⇒ <code>Object</code>
    * [.getAll(The, The)](#Database+getAll) ⇒ <code>array</code>
    * [.getAllCount(The)](#Database+getAllCount) ⇒ <code>integer</code>
    * [.getBy(The, The, The, The)](#Database+getBy) ⇒ <code>array</code>
    * [.insert(The, The)](#Database+insert) ⇒ <code>boolean</code>
    * [.update()](#Database+update)
    * [.updateBy()](#Database+updateBy)
    * [.delete()](#Database+delete)
    * [.deleteBy()](#Database+deleteBy)
    * [.exists()](#Database+exists)
    * [.existsBy()](#Database+existsBy)
    * [.array()](#Database+array)
    * [.kvObject()](#Database+kvObject)
    * [.row()](#Database+row)
    * [.scalar()](#Database+scalar)
    * [.bool()](#Database+bool)
    * [.integer()](#Database+integer)
    * [.decimal()](#Database+decimal)
    * [.tableExists()](#Database+tableExists)
    * [.transaction()](#Database+transaction)
    * [.duplicateTable()](#Database+duplicateTable)
    * [.truncate()](#Database+truncate)
    * [.drop()](#Database+drop)
    * [.setEnvVar()](#Database+setEnvVar)
    * [.getEnvVar()](#Database+getEnvVar)
    * [.getTableColumns()](#Database+getTableColumns)
    * [.getTableColumnDefaultValues()](#Database+getTableColumnDefaultValues)
    * [.getTableColumnDataTypes()](#Database+getTableColumnDataTypes)
    * [.export()](#Database+export)
    * [.saveCache()](#Database+saveCache)
    * [.clearCache()](#Database+clearCache)
    * [.clearAllCache()](#Database+clearAllCache)
    * [.clearConnection()](#Database+clearConnection)
    * [.getDb()](#Database+getDb)

<a name="new_Database_new"></a>

### new Database()
Construct database connection

<a name="Database+dbClasses"></a>

### database.dbClasses
Set dbClasses

**Kind**: instance property of [<code>Database</code>](#Database)
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

### database.connect(Using, The) ⇒ <code>boolean</code>
Connect to database

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>boolean</code> - Returns true on successful connection
**Throws**:

- Database connection error


| Param | Type | Description |
| --- | --- | --- |
| Using | <code>boolean</code> | SSL? |
| The | <code>array</code> | SSL certificate paths |

<a name="Database+close"></a>

### database.close() ⇒ <code>boolean</code>
Close database connection

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>boolean</code> - Returns true on successful close
**Throws**:

- Database close error

<a name="Database+escape"></a>

### database.escape(Value) ⇒ <code>string</code>
Escape string value

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>string</code> - Escaped value

| Param | Type | Description |
| --- | --- | --- |
| Value | <code>string</code> | to escape |

<a name="Database+escapeId"></a>

### database.escapeId(Value) ⇒ <code>string</code>
Escape identifier(database/table/column name)

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>string</code> - Escaped value

| Param | Type | Description |
| --- | --- | --- |
| Value | <code>string</code> | to escape |

<a name="Database+format"></a>

### database.format(Query, The) ⇒ <code>string</code>
Prepare a query with multiple insertion points,
utilizing the proper escaping for ids and values

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>string</code> - The formatted query
**Example:**: var query = "SELECT * FROM ?? WHERE ?? = ?";
   var values = ['users', 'id', userId];
   db.format(query, values);

| Param | Type | Description |
| --- | --- | --- |
| Query | <code>string</code> | to format |
| The | <code>array</code> | array of values |

<a name="Database+execute"></a>

### database.execute(Query, The) ⇒ <code>array</code>
Prepare and run query
Differences between execute() and query():

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>array</code> - Results of query
**See**: https://github.com/sidorares/node-mysql2/issues/382

| Param | Type | Description |
| --- | --- | --- |
| Query | <code>string</code> | to execute |
| The | <code>array</code> | values of the query |

**Example**
```js
var query = "SELECT * FROM ?? WHERE ?? = ?";
   var values = ['users', 'id', userId];
   await db.execute(query, values);
```
<a name="Database+query"></a>

### database.query(Query, The) ⇒ <code>array</code>
Run a query

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>array</code> - Results of query

| Param | Type | Description |
| --- | --- | --- |
| Query | <code>string</code> | to execute |
| The | <code>array</code> | values of the query, optional |

**Example**
```js
var query = "SELECT * FROM ?? WHERE ?? = ?";
   var values = ['users', 'id', userId];
   await db.query(query, values);
or
   var query = "SELECT * FROM users WHERE id = 10";
   await db.query(query);
```
<a name="Database+get"></a>

### database.get(The, The) ⇒ <code>Object</code>
Get one record by ID

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>Object</code> - The row as an object

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |
| The | <code>number</code> | primary ID |

<a name="Database+getAll"></a>

### database.getAll(The, The) ⇒ <code>array</code>
Get all records from a table

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>array</code> - The result array

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |
| The | <code>string</code> | order by syntax, example "id DESC" |

<a name="Database+getAllCount"></a>

### database.getAllCount(The) ⇒ <code>integer</code>
Get all record count of a table

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>integer</code> - The total count of the table

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |

<a name="Database+getBy"></a>

### database.getBy(The, The, The, The) ⇒ <code>array</code>
Construct a SELECT query and execute it

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>array</code> - The result array

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |
| The | <code>array</code> | criteria as an array, example:   {     id: 10,     status: 'expired'   } |
| The | <code>number</code> | number of results to return, optional |
| The | <code>string</code> | order by syntax, example "id DESC", optional |

<a name="Database+insert"></a>

### database.insert(The, The) ⇒ <code>boolean</code>
Construct single or multiple INSERT queries and execute

**Kind**: instance method of [<code>Database</code>](#Database)
**Returns**: <code>boolean</code> - Returns true on successful insertion

| Param | Type | Description |
| --- | --- | --- |
| The | <code>string</code> | table name |
| The | <code>array</code> \| <code>Object</code> | data to insert as a single object or array of objects Example:   {     id: 10,     firstName: 'John',     lastName: 'Doe',     status: 'active'   }   or   [{     id: 10,     firstName: 'John',     lastName: 'Doe',     status: 'active'   }, ... ] |

<a name="Database+update"></a>

### database.update()
Construct an UPDATE by ID query

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+updateBy"></a>

### database.updateBy()
Construct an update by criteria query

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+delete"></a>

### database.delete()
Construct delete by ID query

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+deleteBy"></a>

### database.deleteBy()
Construct delete by criteria query

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+exists"></a>

### database.exists()
If a record exists by ID

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+existsBy"></a>

### database.existsBy()
Whether or not a record exists by matching critera

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+array"></a>

### database.array()
Return result as array

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+kvObject"></a>

### database.kvObject()
Return results with custom key and values

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+row"></a>

### database.row()
Return first row of the result set

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+scalar"></a>

### database.scalar()
Return scalar value

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+bool"></a>

### database.bool()
Return boolean value

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+integer"></a>

### database.integer()
Return integer value

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+decimal"></a>

### database.decimal()
Return decimal value

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+tableExists"></a>

### database.tableExists()
Whether or not a table exists

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+transaction"></a>

### database.transaction()
Run queries in transaction

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+duplicateTable"></a>

### database.duplicateTable()
Duplicate a table

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+truncate"></a>

### database.truncate()
Truncate a table, useful for testing

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+drop"></a>

### database.drop()
Drop a table, useful for testing

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+setEnvVar"></a>

### database.setEnvVar()
Set an environment variable

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+getEnvVar"></a>

### database.getEnvVar()
Get an environment variable

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+getTableColumns"></a>

### database.getTableColumns()
Get table columns

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+getTableColumnDefaultValues"></a>

### database.getTableColumnDefaultValues()
Get column default values

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+getTableColumnDataTypes"></a>

### database.getTableColumnDataTypes()
Get column data types

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+export"></a>

### database.export()
Export results

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+saveCache"></a>

### database.saveCache()
Save cache

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+clearCache"></a>

### database.clearCache()
Clear cache

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+clearAllCache"></a>

### database.clearAllCache()
Clear all cache

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+clearConnection"></a>

### database.clearConnection()
Clear connection

**Kind**: instance method of [<code>Database</code>](#Database)
<a name="Database+getDb"></a>

### database.getDb()
Call method(s) on multiple DbObjects at the same time

**Kind**: instance method of [<code>Database</code>](#Database)
