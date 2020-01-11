/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

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

  // We will have a test table
  const testTable = 'test_table_2';

  test('query() method', async () => {
    let query = "CREATE TABLE `" + testTable + "` (";
    query += "`id` int(11) unsigned NOT NULL AUTO_INCREMENT,";
    query += "`field_char` varchar(255) DEFAULT NULL,";
    query += "`field_bool` tinyint(1) DEFAULT 0,";
    query += "`field_int` int(11) DEFAULT NULL,";
    query += "`field_decimal` double(10,4) DEFAULT 0.00,";
    query += "`field_text` text,";
    query += "`position` smallint(3) DEFAULT 0,";
    query += "`created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,";
    query += "`updated` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,";
    query += "PRIMARY KEY (`id`)";
    query += ") ENGINE=InnoDB DEFAULT CHARSET=utf8;";
    let results = await database.query(query);

    expect(await database.tableExists(testTable)).toBe(true);
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
    let values2 = [{
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

    expect(await database.insert(testTable, values2)).toBe(true);
  });

  const dbTest = new DbTest(database);
  dbTest.tableName = testTable;

  test('tableName getter method', () => {
    expect(dbTest.tableName).toBe(testTable);
  });

  test('getAll() method', async () => {
    const results = await dbTest.getAll();
    expect(results.length).toBe(3);
  });

  test('getAllCount() method', async () => {
    expect(await dbTest.getAllCount()).toBe(3);
  });

  test('find() method', async () => {
    const results = await dbTest.find({
      id: 1
    });
    expect(results.length).toBe(1);
  });

  test('findOne() method', async () => {
    const row = await dbTest.findOne({
      id: 1
    });
    expect(row.id).toBe(1);
  });

  test('create() method', async () => {
    // Single insert
    let values1 = {
      field_char: 'This is a char field',
      field_bool: 1,
      field_int: 33,
      field_decimal: 55.5,
      field_text: 'This is a text field'
    };

    expect(await dbTest.create(values1)).toBe(true);

    // Multiple insert
    let values2 = [{
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
      }
    ]

    expect(await dbTest.create(values2)).toBe(true);
  });

  test('update() method', async () => {
    let values = {
      field_char: 'This is updated char field',
      field_bool: 0,
      field_int: 55,
      field_decimal: 99.9,
      field_text: 'This is updated text field'
    };

    expect(await dbTest.update(1, values)).toBe(true);
  });

  test('updateBy() method', async () => {
    let values = {
      field_char: 'This is updated char field',
      field_bool: 0,
      field_int: 55,
      field_decimal: 99.9,
      field_text: 'This is updated text field'
    };

    expect(await dbTest.updateBy({
      id: 1
    }, values)).toBe(true);
  });

  test('delete() method', async () => {
    expect(await dbTest.delete(1)).toBe(true);
  });

  test('deleteBy() method', async () => {
    expect(await dbTest.deleteBy({
      id: 1
    })).toBe(true);
  });

  test('exists() method', async () => {
    expect(await dbTest.exists(1)).toBe(false);
  });

  test('existsBy() method', async () => {
    expect(await dbTest.existsBy({
      id: 1
    })).toBe(false);
  });

  test('updatePositionColumnById() method', async () => {
    expect(await dbTest.updatePositionColumnById({
      1: 1,
      2: 2,
      3: 3
    })).toBe(true);
    expect(await dbTest.findColumn({
      id: 2
    }, 'position')).toBe(2);
    expect(await dbTest.findColumn({
      id: 3
    }, 'position')).toBe(3);
  });

  test('cache methods', () => {
    const cacheId = 'fake-cache-id';
    const value = 'fake-value';
    expect(dbTest.saveCache(cacheId, value)).toBe(true);
    expect(dbTest.getCache(cacheId)).toBe(value);
    expect(dbTest.clearCache(cacheId)).toBe(true);
    expect(dbTest.getCache(cacheId)).toBe(undefined);
  });

  test('escape() method', () => {
    expect(dbTest.escape('value')).toBe("'value'");
  });

  test('escapeId() method', () => {
    expect(dbTest.escapeId('value')).toBe('`value`');
  });

  test('drop() method', async () => {
    expect(await database.drop(testTable)).toBe(true);
  });

  test('database.close()', async () => {
    expect(await database.close()).toBe(true);
  });

};

try {
  databaseTest();
} catch (error) {
  console.log('Test database error: ' + error.message);
}
