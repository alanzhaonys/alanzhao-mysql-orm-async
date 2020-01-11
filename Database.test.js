// Hack to make iconv load the encodings module, otherwise jest crashes. Compare
// https://github.com/sidorares/node-mysql2/issues/489
require('iconv-lite').encodingExists('foo');

databaseTest = async () => {

  require('dotenv').config();
  const Database = require('./Database');
  const DbTest = require('./DbTest');

  const dbEndpoint = process.env.DB_ENDPOINT;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = process.env.DB_PORT;
  const dbConnectTimeout = process.env.DB_CONNECT_TIMEOUT;

  if (!dbEndpoint || !dbUser || !dbPassword || !dbName) {
    throw new Error('Database credentials not found');
  }

  const dbConfigs = {
    'dbHost': dbEndpoint,
    'dbUser': dbUser,
    'dbPassword': dbPassword,
    'dbName': dbName,
    'dbPort': dbPort,
    'dbConnectTimeout': dbConnectTimeout
  };

  const database = new Database(dbConfigs);

  test('database.connect()', async () => {
    try {
      expect(await database.connect()).toBe(true);
    } catch (error) {
      throw new Exception(error.message);
    }
  });

  test('database.connect() exception', async () => {
    try {
      let thisDatabase = new Database({});
      await thisDatabase.connect();
    } catch (error) {
      expect(error.message).toContain('ECONNREFUSED');
    }
  });

  test('database getter methods', () => {
    expect(database.dbHost).toBe(dbConfigs.dbHost);
    expect(database.dbName).toBe(dbConfigs.dbName);
    expect(database.dbUser).toBe(dbConfigs.dbUser);
    expect(database.dbPassword).toBe(dbConfigs.dbPassword);
    expect(database.dbPort).toBe(dbConfigs.dbPort);
    expect(database.dbConnectTimeout).toBe(dbConfigs.dbConnectTimeout);
  });

  test('setEnvVar() and getEnvVar() methods', async () => {
    let envVarName = 'testEnvVar';
    let envVarValue = 1;
    expect(await database.setEnvVar(envVarName, envVarValue)).toBe(true);
    expect(await database.getEnvVar(envVarName)).toBe(envVarValue);
  });

  test('escape() method', () => {
    expect(database.escape('value')).toEqual("'value'");
  });

  test('escapeId() method', () => {
    expect(database.escapeId('value')).toEqual('`value`');
  });

  test('format() method', () => {
    let query = "SELECT * FROM ?? WHERE ?? = ?";
    let values = ['users', 'id', 10];
    expect(database.format(query, values))
      .toEqual('SELECT * FROM `users` WHERE `id` = 10');
  });

  // We will have a test table
  const testTable = 'test_table_1';

  test('query() method', async () => {
    let query = "CREATE TABLE `" + testTable + "` (";
    query += "`id` int(11) unsigned NOT NULL AUTO_INCREMENT,";
    query += "`field_char` varchar(255) DEFAULT NULL,";
    query += "`field_bool` tinyint(1) DEFAULT 0,";
    query += "`field_int` int(11) DEFAULT NULL,";
    query += "`field_decimal` double(10,4) DEFAULT 0.00,";
    query += "`field_text` text,";
    query += "`created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,";
    query += "`updated` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,";
    query += "PRIMARY KEY (`id`)";
    query += ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    let results = await database.query(query);

    expect(await database.tableExists(testTable)).toBe(true);
  });

  test('getTableColumns() method', async () => {
    database.clearCache('fake-cache-id');
    let results1 = await database.getTableColumns(testTable, ['created', 'updated']);
    let results2 = await database.getTableColumns(testTable);
    expect(results2[0]).toBe('id');
  });

  test('getTableColumnDataTypes() method', async () => {
    let results1 = await database.getTableColumnDataTypes(testTable, ['created', 'updated']);
    let results2 = await database.getTableColumnDataTypes(testTable);
    expect(results2.id).toBe('int(11) unsigned');
  });

  test('getTableColumnDefaultValues() method', async () => {
    let results1 = await database.getTableColumnDefaultValues(testTable, ['created', 'updated']);
    let results2 = await database.getTableColumnDefaultValues(testTable);
    expect(results1.field_bool).toBe('0');
    expect(results2.field_decimal).toBe('0.0000');
  });

  test('query() method', async () => {
    let query = "SELECT * FROM ?? WHERE ?? = ?";
    let values = [testTable, 'id', 1];
    let results = await database.query(query, values);
    expect(database.lastQuery).toBe(database.format(query, values));
  });

  test('execute() method', async () => {
    let query = "SELECT * FROM " + testTable + " WHERE id = ?";
    let values = [1];
    let results = await database.execute(query, values);
    expect(database.lastResults).not.toBe(null);
    expect(database.lastQuery).toBe(database.format(query, values));
  });

  test('insert() method', async () => {
    // Single insert
    let data = {
      field_char: 'This is a char field',
      field_bool: 1,
      field_int: 33,
      field_decimal: 55.5,
      field_text: 'This is a text field'
    };

    expect(await database.insert(testTable, data)).toBe(true);

    // Multiple insert
    let data2 = [{
        field_char: 'This is a char field',
        field_bool: 1,
        field_int: 33,
        field_decimal: 55.5,
        field_text: 'This is a text field'
      },
      {
        field_char: 'This is another char field',
        field_bool: 0,
        field_int: 77,
        field_decimal: 99.9,
        field_text: 'This is another text field'
      },
    ];

    expect(await database.insert(testTable, data2)).toBe(true);
    expect(database.insertedId).not.toBe(null);
  });

  test('update() method', async () => {
    let data = {
      field_char: 'This is updated char field',
      field_bool: 0,
      field_int: 55,
      field_decimal: 99.9,
      field_text: 'This is updated text field'
    };

    let results = await database.update(testTable, 1, data);
    expect(results).toBe(true);
    expect(database.changedRows).toBe(1);
  });

  test('exists() method', async () => {
    expect(await database.exists(testTable, 1)).toBe(true);
    expect(await database.existsBy(testTable, {
      id: 1
    }, 4)).toBe(true);
    expect(await database.exists(testTable, 4)).toBe(false);
  });

  test('get() method', async () => {
    let row = await database.get(testTable, 1);
    expect(row.id).toBe(1);
  });

  test('getAll() method', async () => {
    let results = await database.getAll(testTable, 'id DESC');
    expect(results.length).toBe(3);
  });

  test('getAllCount() method', async () => {
    expect(await database.getAllCount(testTable)).toBe(3);
  });

  test('array() method', async () => {
    let query = 'SELECT id FROM ' + testTable;
    // With 'key' param
    expect(await database.array(query, 'id')).toEqual(expect.arrayContaining([1, 2, 3]));

    // Without 'key' param
    expect(await database.array(query, null)).toEqual(expect.arrayContaining([1, 2, 3]));
  });

  test('kvObject() method', async () => {
    let query = 'SELECT id, field_bool FROM ' + testTable;
    let results = await database.kvObject(query, 'id', 'field_bool');
    expect(results)
      .toEqual(expect.objectContaining({
        '1': 0,
        '2': 1,
        '3': 0
      }));
  });

  test('row() method', async () => {
    let query = 'SELECT id FROM ' + testTable + ' ORDER BY id ASC';
    let results = await database.row(query);
    expect(results).toEqual(expect.objectContaining({
      id: 1
    }));
  });

  test('scalar() method', async () => {
    let query = 'SELECT id FROM ' + testTable + ' ORDER BY id ASC LIMIT 1';
    expect(await database.scalar(query)).toEqual(1);
  });

  test('bool() method', async () => {
    let query = 'SELECT field_bool FROM ' + testTable + ' WHERE ID = 1';
    expect(await database.bool(query)).toEqual(false);
  });

  test('integer() method', async () => {
    let query = 'SELECT field_int FROM ' + testTable + ' WHERE ID = 1';
    expect(await database.integer(query)).toEqual(55);
  });

  test('decimal() method', async () => {
    let query = 'SELECT field_decimal FROM ' + testTable + ' WHERE ID = 1';
    expect(await database.decimal(query, 3)).toEqual(99.900);
    expect(await database.decimal(query)).toEqual(99.90);
  });

  test('getDb() method on DbTest object', async () => {
    database.dbClasses = {
      'Test': DbTest
    };

    // An array of objects
    let args1 = [{
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
      },
      {
        entity: 'Missing',
        method: 'get',
      },
    ];

    // An object
    let args2 = {
      entity: 'Test',
      method: 'get',
      args: [
        // querying row # 1
        1
      ]
    };

    let results1 = await database.getDb(args1);
    let results2 = await database.getDb(args2);
    expect(results1.length).toBe(2);
  });

  test('delete() method', async () => {
    expect(await database.delete(testTable, 1)).toBe(true);
    expect(database.affectedRows).toBe(1);
  });

  test('truncate() method', async () => {
    expect(await database.truncate(testTable)).toBe(true);
  });

  test('transaction() commit', async () => {
    let queries = [];
    queries.push('INSERT INTO ' + testTable + ' (id) VALUES (1)');
    queries.push('UPDATE ' + testTable + ' SET id = 2');

    expect(await database.transaction(queries)).toBe(true);
    expect(await database.exists(testTable, 2)).toBe(true);
  });

  test('transaction() method', async () => {
    let queries = [];
    queries.push('INSERT INTO ' + testTable + ' (id) VALUES (1)');
    // Notice the typo
    queries.push('INSERT ONTO ' + testTable + ' (id) VALUES (2)');

    // Truncate the table to start
    expect(await database.truncate(testTable)).toBe(true);
    // Run transation
    expect(await database.transaction(queries)).toBe(true);

    // Transaction will rolled back due to error
    expect(await database.exists(testTable, 1)).toBe(false);
  });

  const testTableDup = 'test_table_duplicated';
  test('duplicateTable() method', async () => {
    expect(await database.duplicateTable(testTable, testTableDup)).toBe(true);
  });

  test('drop() method', async () => {
    expect(await database.drop(testTable)).toBe(true);
    expect(await database.drop(testTableDup)).toBe(true);
  });

  test('database.close()', async () => {
    expect(await database.close()).toBe(true);
  });

  function sleep(millis) {
    return new Promise(resolve => setTimeout(resolve, millis));
  }

};

try {
  databaseTest();
} catch (error) {
  console.log('Test database error: ' + error.message);
}
