/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

const mysql = require('mysql2/promise');

/**
 * A database wrapper for npm 'mysql2' package
 */
module.exports = class Database {
  /**
   * Construct database connection
   */
  constructor(configs) {
    this._connection = null;
    this._defaultDbConnectTimeout = 10000;
    this._defaultDbPort = 3306;
    this._lastQuery = null;
    this._lastResults = null;
    this._cache = {};
    this._dbClasses = {};

    this._dbHost = configs.dbHost;
    this._dbName = configs.dbName;
    this._dbUser = configs.dbUser;
    this._dbPassword = configs.dbPassword;
    this._dbPort = configs.dbPort ?
      configs.dbPort : this._defaultDbPort;
    this._dbConnectTimeout = configs.dbConnectTimeout ?
      configs.dbConnectTimeout : this._defaultDbConnectTimeout;
  }

  /**
   * Connect to database
   */
  async connect(ssl = false, sslCerts = null) {
    var options = {
      host: this._dbHost,
      port: this._dbPort,
      user: this._dbUser,
      password: this._dbPassword,
      database: this._dbName,
      connectTimeout: this._dbConnectTimeout,
      dateStrings: true,
      multipleStatements: true
    };

    if (ssl) {
      if (Array.isArray(sslCerts)) {
        const fs = require('fs');
        options['ssl'] = {
          ca: fs.readFileSync(sslCerts.ca),
          cert: fs.readFileSync(sslCerts.client),
          key: fs.readFileSync(sslCerts.key)
        };
      } else if (typeof sslCerts === 'string' &&
        sslCerts === 'Amazon RDS') {
        options['ssl'] = 'Amazon RDS';
      }
    }

    this._connection = await mysql.createConnection(options);

    return true;
  }

  /**
   * Close database connection
   */
  async close() {
    await this._connection.end();
    this.clearConnection();
    this.clearAllCache();

    return true;
  }

  /**
   * Escape string value
   */
  escape(value) {
    return this._connection.escape(value);
  }

  /**
   * Escape identifier(database/table/column name)
   */
  escapeId(key) {
    return this._connection.escapeId(key);
  }

  /**
   * Prepare a query with multiple insertion points,
   * utilizing the proper escaping for ids and values
   *
   * Example:
   *    var sql = "SELECT * FROM ?? WHERE ?? = ?";
   *    var inserts = ['users', 'id', userId];
   *    db.format(sql, insert);
   */
  format(query, values = []) {
    return mysql.format(query, values);
  }

  /**
   * Prepare and run query
   * Differences between execute() and query():
   * https://github.com/sidorares/node-mysql2/issues/382
   */
  async execute(query, values = []) {
    const [results, fields] = await this._connection.execute(query, values);
    this._lastResults = results;
    this._lastQuery = query;
    return results;
  }

  /**
   * Run a query
   */
  async query(query, values = []) {
    const [results, fields] = await this._connection.query(query, values);
    this._lastResults = results;
    this._lastQuery = query;
    return results;
  }

  /**
   * Get one record by ID
   */
  async get(table, id) {
    const rows = await this.getBy(table, {
      id: id
    }, 1);
    return rows[0];
  }

  /**
   * Get all records from a table
   */
  async getAll(table, orderBy = null) {
    return await this.getBy(table, {}, null, orderBy);
  }

  /**
   * Get all record count of a table
   */
  async getAllCount(table) {
    const query = 'SELECT COUNT(id) FROM ' + this.escapeId(table);
    return await this.integer(query);
  }

  /**
   * Construct a SELECT query
   */
  async getBy(table, values, limit = null, orderBy = null) {
    var where = [];
    for (let key in values) {
      let value = values[key];
      if (typeof value === 'string' &&
        value.match('ENCRYPT\((.+)\)')) {
        where.push(this.escapeId(key) + ' = ' + value);
      } else {
        where.push(this.escapeId(key) + ' = ' + this.escape(value));
      }
    }

    var query = 'SELECT * FROM ' + this.escapeId(table);

    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }

    if (orderBy) {
      query += ' ORDER BY ' + orderBy;
    }

    if (Number.isInteger(limit) && limit > 0) {
      query += ' LIMIT ' + limit;
    }

    const results = await this.query(query);
    return this.export(results);
  }

  /**
   * Construct single or multiple INSERT queries
   */
  async insert(table, data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    var queries = [];

    for (let i = 0; i < data.length; i++) {
      let thisData = data[i];
      let keys = [];
      let values = [];

      for (var key in thisData) {
        let value = thisData[key];
        keys.push(this.escapeId(key));
        if (typeof value === 'string' &&
          value.match('ENCRYPT\((.+)\)')) {
          values.push(value);
        } else {
          values.push(this.escape(value));
        }
      }

      queries.push(
        'INSERT INTO ' +
        this.escapeId(table) +
        ' (' +
        keys.join(', ') +
        ') VALUES (' +
        values.join(', ') +
        ')'
      );
    }

    return (await this.query(queries.join('; '))) ? true : false;
  }

  /**
   * Construct an UPDATE by ID query
   */
  async update(table, id, values) {
    return await this.updateBy(table, {
      id: id
    }, values);
  }

  /**
   * Construct an update by criteria query
   */
  async updateBy(table, criteria, values) {
    var where = [];
    for (let key in criteria) {
      let value = criteria[key];
      if (typeof value === 'string' &&
        value.match('ENCRYPT\((.+)\)')) {
        where.push(this.escapeId(key) + ' = ' + value);
      } else {
        where.push(this.escapeId(key) + ' = ' + this.escape(value));
      }
    }

    var set = [];
    for (let key in values) {
      let value = values[key];
      if (typeof value === 'string' &&
        value.match('ENCRYPT\((.+)\)')) {
        set.push(this.escapeId(key) + ' = ' + value);
      } else {
        set.push(this.escapeId(key) + ' = ' + this.escape(value));
      }
    }

    var query = 'UPDATE ' + this.escapeId(table) + ' SET ';
    query += set.join(', ');
    query += ' WHERE ' + where.join(' AND ');

    return (await this.query(query)) ? true : false;
  }

  /**
   * Construct delete by ID query
   */
  async delete(table, id) {
    return await this.deleteBy(table, {
      id: id
    });
  }

  /**
   * Construct delete by criteria query
   */
  async deleteBy(table, criteria) {
    var where = [];
    for (let key in criteria) {
      let value = criteria[key];
      if (typeof value === 'string' &&
        value.match('ENCRYPT\((.+)\)')) {
        where.push(this.escapeId(key) + ' = ' + value);
      } else {
        where.push(this.escapeId(key) + ' = ' + this.escape(value));
      }
    }

    const query =
      'DELETE FROM ' + this.escapeId(table) + ' WHERE ' + where.join(' AND ');

    return (await this.query(query)) ? true : false;
  }

  /**
   * If a record exists by ID
   */
  async exists(table, id) {
    return await this.existsBy(table, {
      id: id
    });
  }

  /**
   * Whether or not a record exists by matching critera
   */
  async existsBy(table, criteria, excludeId = null) {
    var where = [];
    for (let key in criteria) {
      let value = criteria[key];
      if (typeof value === 'string' &&
        value.match('ENCRYPT\((.+)\)')) {
        where.push(this.escapeId(key) + ' = ' + value);
      } else {
        where.push(this.escapeId(key) + ' = ' + this.escape(value));
      }
    }

    const query =
      'SELECT COUNT(id) FROM ' +
      this.escapeId(table) +
      ' WHERE ' +
      where.join(' AND ');

    if (excludeId) {
      query += ' AND id != ' + this.escape(excludeId);
    }

    return (await this.integer(query) > 0) ? true : false;
  }

  /**
   * Return result as array
   */
  async array(query, key = null) {
    var array = [];
    const results = await this.query(query);

    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      if (key) {
        array.push(result[key]);
      } else {
        array.push(result[Object.keys(result)[0]]);
      }
    }

    return array;
  }

  /**
   * Return results with custom key and values
   */
  async kvObject(query, key, value) {
    var object = {};
    const results = await this.query(query);

    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      object[result[key]] = result[value];
    }

    return object;
  }

  /**
   * Return first row of the result set
   */
  async row(query) {
    const results = await this.query(query);

    if (Array.isArray(results) && results[0]) {
      return this.export(results[0]);
    }

    return null;
  }

  /**
   * Return scalar value
   */
  async scalar(query) {
    const results = await this.query(query);

    if (Array.isArray(results) && results[0]) {
      var result = results[0];
      var value = result[Object.keys(result)[0]];
      return value;
    }

    return null;
  }

  /**
   * Return boolean value
   */
  async bool(query) {
    const value = await this.scalar(query);
    switch (value.toLowerCase()) {
      case "true":
      case "yes":
      case "y":
      case "1":
        return true;
      case "false":
      case "no":
      case "n":
      case "0":
        return false;
      default:
        return null;
    }
  }

  /**
   * Return integer value
   */
  async integer(query) {
    const value = await this.scalar(query);
    return (value !== null && value !== '') ? parseInt(value) : null;
  }

  /**
   * Return decimal value
   */
  async decimal(query, decimal = 2) {
    const value = await this.scalar(query);
    return (value !== null && value !== '') ?
      parseFloat(value.toFixed(decimal)) : null;
  }

  /**
   * Whether or not a table exists
   */
     async tableExists(table) {
       const query = 'SHOW TABLES LIKE "' + table + '"';
       return (await this.scalar(query) === table) ? true : false;
     }

  /**
   * Run queries in transaction
   */
  async transaction(queries) {
    await this._connection.beginTransaction();
    try {
      const query = Array.isArray(queries) ? queries.join(';') : queries;
      await this.query(query);
      await this._connection.commit();
      return true;
    } catch (error) {
      this._connection.rollback();
    }
    return true;
  }

  /**
   * Duplicate a table
   */
  async duplicateTable(from, to) {
    var fromTable = this.escapeId(from);
    var toTable = this.escapeId(to);
    const query =
      'CREATE TABLE ' +
      toTable +
      ' LIKE ' +
      fromTable +
      '; INSERT ' +
      toTable +
      ' SELECT * FROM ' +
      fromTable;

    return (await this.query(query)) ? true : false;
  }

  /**
   * Truncate a table, useful for testing
   */
  async truncate(table) {
    const query = 'TRUNCATE TABLE ' + this.escapeId(table);
    return (await this.query(query)) ? true : false;
  }

  /**
   * Drop a table, useful for testing
   */
  async drop(table) {
    const query = 'DROP TABLE ' + this.escapeId(table);
    return (await this.query(query)) ? true : false;

  }

  /**
   * Set an environment variable
   */
  async setEnvVar(name, value) {
    const query = 'SET @' + name + ' = ' + this.escape(value);
    return (await this.query(query)) ? true : false;
  }

  /**
   * Get an environment variable
   */
  async getEnvVar(name) {
    const query = 'SELECT @' + name;
    return await this.scalar(query);
  }

  /**
   * Get table columns
   */
  async getTableColumns(table, ignoreColumns = []) {
    var cacheId = 'table-columns-for-' + table;
    if (this._cache[cacheId]) {
      return this._cache[cacheId];
    }

    var database = this.dbName;

    var query =
      'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS ' +
      'WHERE TABLE_SCHEMA = ' +
      this.escape(database) +
      ' AND TABLE_NAME = ' +
      this.escape(table);

    if (ignoreColumns.length > 0) {
      query += " AND COLUMN_NAME NOT IN ('" + ignoreColumns.join("', '") + "')";
    }

    const columns = await this.array(query, 'COLUMN_NAME');
    this.saveCache(cacheId, columns);
    return columns;
  }

  /**
   * Get column default values
   */
  async getTableColumnDefaultValues(table, ignoreColumns = []) {
    var cacheId = 'table-column-default-values-for-' + table;
    if (this._cache[cacheId]) {
      return this._cache[cacheId];
    }

    var database = this.dbName;

    var columns = [
      'COLUMN_NAME',
      'COLUMN_TYPE',
      'IS_NULLABLE',
      'COLUMN_DEFAULT',
      'COLUMN_KEY',
      'EXTRA'
    ];

    var query =
      'SELECT ' +
      columns.join(', ') +
      ' ' +
      'FROM INFORMATION_SCHEMA.COLUMNS ' +
      "WHERE TABLE_SCHEMA = '" +
      database +
      "' " +
      "AND TABLE_NAME = '" +
      table +
      "'";

    if (ignoreColumns.length > 0) {
      query += " AND COLUMN_NAME NOT IN ('" + ignoreColumns.join("', '") + "')";
    }

    query += ' ORDER BY COLUMN_NAME ASC';

    const object = await this.kvObject(query, 'COLUMN_NAME', 'COLUMN_DEFAULT');
    if (typeof object === 'object' && object !== null) {
      var types = this.export(object);
      this.saveCache(cacheId, types);
      return this.export(types);
    }

    return null;
  }

  /**
   * Get column data types
   */
  async getTableColumnDataTypes(table, ignoreColumns = []) {
    var cacheId = 'table-column-data-types-for-' + table;
    if (this._cache[cacheId]) {
      return this._cache[cacheId];
    }

    var database = this.dbName;

    var columns = [
      'COLUMN_NAME',
      'COLUMN_TYPE'
    ];
    
    var query =
      'SELECT ' +
      columns.join(', ') +
      ' ' +
      'FROM INFORMATION_SCHEMA.COLUMNS ' +
      "WHERE TABLE_SCHEMA = '" +
      database +
      "' " +
      "AND TABLE_NAME = '" +
      table +
      "'";

    if (ignoreColumns.length > 0) {
      query += " AND COLUMN_NAME NOT IN ('" + ignoreColumns.join("', '") + "')";
    }

    query += ' ORDER BY COLUMN_NAME ASC';

    const kvObject = await this.kvObject(query, 'COLUMN_NAME', 'COLUMN_TYPE');
    if (typeof kvObject === 'object' && kvObject !== null) {
      this.saveCache(cacheId, kvObject);
      return this.export(kvObject);
    }

    return null;
  }

  /**
   * Export results
   */
  export (results) {
    // JSON manipulation to remove unwanted mysql methods
    return !results ? null : JSON.parse(JSON.stringify(results));
  }

  /**
   * Save cache
   */
  saveCache(cacheId, value) {
    this._cache[cacheId] = value;
  }

  /**
   * Clear cache
   */
  clearCache(cacheId) {
    delete this._cache[cacheId];
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    this._cache = {};
  }

  /**
   * Clear connection
   */
  clearConnection() {
    this._connection = null;
  }

  /**
   * Call method(s) on multiple DbObjects at the same time
   */
  async getDb(args) {
    var self = this;
    var results = [];

    if (!Array.isArray(args)) {
      args = [args];
    }

    for (let argCount = 0; argCount < args.length; argCount++) {
      let arg = args[argCount];
      let entity = arg.entity;
      // Has to be a ASYNC method on the object
      let method = arg.method;
      // Get a copy of the 'args' array
      let vars = arg.args ? arg.args.slice(0) : [];
      let dbObject = this._dbClasses[entity];

      //console.log(argCount + ': ' + entity + ' -> ' + method);
      //console.log('args: ' + JSON.stringify(vars));

      if (!dbObject) {
        continue;
      }

      let obj = new dbObject(self);
      const thisResults = await obj[method](...vars);
      results[argCount] = thisResults;
    }

    return results;
  }

  /**
   * Set dbClasses
   */
  set dbClasses(dbClasses) {
    this._dbClasses = dbClasses;
  }

  /**
   * Getter methods
   */
  get dbHost() {
    return this._dbHost;
  }

  get dbPort() {
    return this._dbPort;
  }

  get dbConnectTimeout() {
    return this._dbConnectTimeout;
  }

  get dbUser() {
    return this._dbUser;
  }

  get dbPassword() {
    return this._dbPassword;
  }

  get dbName() {
    return this._dbName;
  }

  /**
   * Get last inserted ID
   */
  get insertedId() {
    return this._lastResults.insertId;
  }

  /**
   * Get last results
   */
  get lastResults() {
    return this._lastResults;
  }

  /**
   * Get last query
   */
  get lastQuery() {
    return this._lastQuery;
  }

  /**
   * Get number of deleted rows
   */
  get affectedRows() {
    return this._lastResults.affectedRows;
  }

  /**
   * Get number of updated rows
   */
  get changedRows() {
    return this._lastResults.changedRows;
  }
}
