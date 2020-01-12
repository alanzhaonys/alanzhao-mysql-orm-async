//const mysql = require('mysql2/promise');

/**
 * A database wrapper for npm 'mysql2' package
 * @author Alan Zhao <azhao6060@gmail.com>
 */
//module.exports =
  class Database {
  /**
   * Construct database connection
   * @constructor
   */
  constructor(configs) {

    /**
     * Connection instance of the database
     * @type {Object}
     */
    this._connection = null;

    /**
     * Default database connection time out in miliseconds. Default is 10 seconds.
     * @type {number}
     */
    this._defaultDbConnectTimeout = 10000;

    /**
     * Default database port. Default is 3306.
     * @type {number}
     */
    this._defaultDbPort = 3306;

    /**
     * Last query recorded
     * @type {string}
     */
    this._lastQuery = null;

    /**
     * Last result set recorded
     * @type {array}
     */
    this._lastResults = null;

    /**
     * Holds the cache
     * @type {Object}
     */
    this._cache = {};

    /**
     * Holds the DbObject mapping
     * @type {Object}
     */
    this._dbClasses = {};

    /**
     * Database host
     * @type {string}
     */
    this._dbHost = configs.dbHost;

    /**
     * Database name
     * @type {string}
     */
    this._dbName = configs.dbName;

    /**
     * Database user
     * @type {string}
     */
    this._dbUser = configs.dbUser;

    /**
     * Database password
     * @type {string}
     */
    this._dbPassword = configs.dbPassword;

    /**
     * Database port
     * @type {string}
     */
    this._dbPort = configs.dbPort ?
      configs.dbPort : this._defaultDbPort;

    /**
     * Database connection timeout
     * @type {number}
     */
    this._dbConnectTimeout = configs.dbConnectTimeout ?
      configs.dbConnectTimeout : this._defaultDbConnectTimeout;
  }

  /**
   * Connect to database
   * @param {boolean} ssl Using SSL connection?
   * @param {array} sslCerts The SSL certificate paths
   * @returns {boolean} Returns true on successful connection
   * @throws Database connection error
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
   * @returns {boolean} Returns true on successful close
   * @throws Database close error
   */
  async close() {
    await this._connection.end();
    this.clearConnection();
    this.clearAllCache();

    return true;
  }

  /**
   * Escape string value
   * @param {string} value Value to escape
   * @returns {string} Escaped value
   */
  escape(value) {
    return this._connection.escape(value);
  }

  /**
   * Escape identifier(database/table/column name)
   * @param {string} value Value to escape
   * @returns {string} Escaped value
   */
  escapeId(key) {
    return this._connection.escapeId(key);
  }

  /**
   * Prepare a query with multiple insertion points,
   * utilizing the proper escaping for ids and values
   * @example
   * var query = "SELECT * FROM ?? WHERE ?? = ?";
   * var values = ['users', 'id', userId];
   * db.format(query, values);
   * @param {string} query Query to format
   * @param {array} values The array of values
   * @returns {string} The formatted query
   */
  format(query, values) {
    return mysql.format(query, values);
  }

  /**
   * Prepare and run query
   * Differences between execute() and query():
   * @see https://github.com/sidorares/node-mysql2/issues/382
   * @example
   * var query = "SELECT * FROM ?? WHERE ?? = ?";
   * var values = ['users', 'id', userId];
   * await db.execute(query, values);
   * @param {string} query Query to execute
   * @param {array} values The values of the query
   * @returns {array} Results of query
   */
  async execute(query, values) {
    const [results, fields] = await this._connection.execute(query, values);
    this._lastResults = results;
    this._lastQuery = this.format(query, values);
    return results;
  }

  /**
   * Run a query
   * @example
   * var query = "SELECT * FROM ?? WHERE ?? = ?";
   * var values = ['users', 'id', userId];
   * await db.query(query, values);
   * // or
   * var query = "SELECT * FROM users WHERE id = 10";
   * await db.query(query);
   * @param {string} query Query to execute
   * @param {array} [values=[]] The values of the query, optional
   * @returns {array} Results of query
   */
  async query(query, values = []) {
    const [results, fields] = await this._connection.query(query, values);
    this._lastResults = results;
    this._lastQuery = this.format(query, values);
    return results;
  }

  /**
   * Get one record by ID
   * @param {string} table The table name
   * @param {number} id The primary ID
   * @returns {Object} The row as an object
   */
  async get(table, id) {
    const rows = await this.getBy(table, {
      id: id
    }, 1);
    return rows[0];
  }

  /**
   * Get all records from a table
   * @param {string} table The table name
   * @param {string} orderBy The order by syntax, example "id DESC"
   * @returns {array} The result array
   */
  async getAll(table, orderBy = null) {
    return await this.getBy(table, {}, null, orderBy);
  }

  /**
   * Get all record count of a table
   * @param {string} table The table name
   * @returns {integer} The total count of the table
   */
  async getAllCount(table) {
    const query = 'SELECT COUNT(id) FROM ' + this.escapeId(table);
    return await this.integer(query);
  }

  /**
   * Construct a SELECT query and execute it
   * @param {string} table The table name
   * @param {Object} criteria The criteria, example:
   *   {
   *     id: 10,
   *     status: 'expired'
   *   }
   * @param {number} [limit=null] The number of results to return, optional
   * @param {string} [orderBy=null] The order by syntax, example "id DESC", optional
   * @returns {array} The result array
   */
  async getBy(table, criteria, limit = null, orderBy = null) {
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
   * Construct single or multiple INSERT queries and execute
   * @param {string} table The table name
   * @param {array|Object} values The data to insert as a single object or array of objects
   * @example
   * // Example for data parameter:
   * {
   *   id: 10,
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   status: 'active'
   * }
   * // or
   * [{
   *   id: 10,
   *   firstName: 'John',
   *   lastName: 'Doe',
   *   status: 'active'
   * }, ... ]
   * @returns {boolean} Returns true on successful insertion
   */
  async insert(table, values) {
    if (!Array.isArray(values)) {
      values = [values];
    }

    var queries = [];

    for (let i = 0; i < values.length; i++) {
      let thisValue = values[i];
      let keys = [];
      let insertValues = [];

      for (var key in thisValue) {
        let value = thisValue[key];
        keys.push(this.escapeId(key));
        if (typeof value === 'string' &&
          value.match('ENCRYPT\((.+)\)')) {
          insertValues.push(value);
        } else {
          insertValues.push(this.escape(value));
        }
      }

      queries.push(
        'INSERT INTO ' +
        this.escapeId(table) +
        ' (' +
        keys.join(', ') +
        ') VALUES (' +
        insertValues.join(', ') +
        ')'
      );
    }

    return (await this.query(queries.join('; '))) ? true : false;
  }

  /**
   * Construct an UPDATE by ID query and execute
   * @param {string} table The table name
   * @param {number} id The primary ID of the record
   * @param {Object} values The data to update
   * @returns {boolean} Returns true on successful update
   */
  async update(table, id, values) {
    return await this.updateBy(table, {
      id: id
    }, values);
  }

  /**
   * Construct an update by criteria query and execute
   * @param {string} table The table name
   * @param {Object} criteria The criteria used to match the record
   * @param {Object} values The data to update
   * @returns {boolean} Returns true on successful update
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
   * Construct delete by ID query and execute
   * @param {string} table The table name
   * @param {number} id The primary ID of the record
   * @returns {boolean} Returns true on successful deletion
   */
  async delete(table, id) {
    return await this.deleteBy(table, {
      id: id
    });
  }

  /**
   * Construct delete by criteria query and execute
   * @param {string} table The table name
   * @param {Object} criteria The criteria used to match the record
   * @returns {boolean} Returns true on successful delete
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
   * Check if a record exists by the ID
   * @param {string} table The table name
   * @param {number} id The primary ID of the record
   * @returns {boolean} Returns true if record exists
   */
  async exists(table, id) {
    return await this.existsBy(table, {
      id: id
    });
  }

  /**
   * Check if a record matching the criteria exists
   * @param {string} table The table name
   * @param {Object} criteria The criteria used to match the record
   * @param {number} [excludeId=null] The ID to exclude
   * @returns {boolean} Returns true if record exists
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

    var query =
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
   * Execute a query and return column result as array
   * @param {string} query The query to execute
   * @param {string} [column=null] The column of the result set. If not provided, first column will be used
   * @returns {array} Returns the result as array
   */
  async array(query, column = null) {
    var array = [];
    const results = await this.query(query);

    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      if (column) {
        array.push(result[column]);
      } else {
        array.push(result[Object.keys(result)[0]]);
      }
    }

    return array;
  }

  /**
   * Return results as custom key and value pair object
   * @param {string} query The query to execute
   * @param {string} key The column of the result to use as key of the object
   * @param {string} value The column of the result to use as value of the object
   * @returns {Object} Returns the result as object
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
   * @param {string} query The query to execute
   * @returns {array} Returns the result as array
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
   * @param {string} query The query to execute
   * @returns {string|number|boolean|decimal} Returns the result as scalar
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
   * @param {string} query The query to execute
   * @returns {boolean} Returns the result as boolean
   */
  async bool(query) {
    const value = await this.scalar(query);
    switch (value.toString().toLowerCase()) {
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
   * @param {string} query The query to execute
   * @returns {number} Returns the result as integer
   */
  async integer(query) {
    const value = await this.scalar(query);
    return (value !== null && value !== '') ? parseInt(value) : null;
  }

  /**
   * Return decimal value
   * @param {string} query The query to execute
   * @param {number} [decimal=2] The number of decimal places
   * @returns {number} Returns the result as decimal
   */
  async decimal(query, decimal = 2) {
    const value = await this.scalar(query);
    return (value !== null && value !== '') ?
      parseFloat(value.toFixed(decimal)) : null;
  }

  /**
   * Whether or not a table exists
   * @param {string} The table name
   * @returns {boolean} Returns true if table exists
   */
  async tableExists(table) {
    const query = 'SHOW TABLES LIKE "' + table + '"';
    return (await this.scalar(query) === table) ? true : false;
  }

  /**
   * Run queries in transaction
   * @param {array} queries An array of queries to run in transaction
   * @returns {boolean} Returns true if transaction is successful
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
   * Duplicate content to a new table
   * @param {string} from The table to copy from
   * @param {string} to The table to copy to
   * @returns {boolean} Returns true if duplication is successful
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
   * Truncate a table
   * @param {string} table The table to truncate
   * @returns {boolean} Returns true if table is truncated
   */
  async truncate(table) {
    const query = 'TRUNCATE TABLE ' + this.escapeId(table);
    return (await this.query(query)) ? true : false;
  }

  /**
   * Drop a table
   * @param {string} table The table to drop
   * @returns {boolean} Returns true if table is dropped
   */
  async drop(table) {
    const query = 'DROP TABLE ' + this.escapeId(table);
    return (await this.query(query)) ? true : false;

  }

  /**
   * Set an environment variable
   * @param {string} name Name of the environment variable
   * @param {string} value Value of the environment variable
   * @returns {boolean} Returns true if table is truncated
   */
  async setEnvVar(name, value) {
    const query = 'SET @' + name + ' = ' + this.escape(value);
    return (await this.query(query)) ? true : false;
  }

  /**
   * Get an environment variable
   * @param {string} name Name of the environment variable to get
   * @returns {array} Returns true if table is truncated
   */
  async getEnvVar(name) {
    const query = 'SELECT @' + name;
    return await this.scalar(query);
  }

  /**
   * Get table columns
   * @param {string} name Name of the table
   * @param {string} [ignoreColumns=null] Columns to ignore
   * @returns {array} Returns names of the table as array
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
   * @param {string} name Name of the table
   * @param {string} [ignoreColumns=null] Columns to ignore
   * @returns {Object} Returns an object with column names and their default values
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
   * @param {string} name Name of the table
   * @param {string} [ignoreColumns=null] Columns to ignore
   * @returns {Object} Returns an object with column names and their data types
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
   * @param {array} results Results to export
   * @returns {array} Returns cleaned up results
   */
  export (results) {
    // JSON manipulation to remove unwanted mysql methods
    return results ? JSON.parse(JSON.stringify(results)) : null;
  }

  /**
   * Save value to cache
   * @param {string} cacheId The cache ID
   * @param {string} value The value to cache
   * @returns {void}
   */
  saveCache(cacheId, value) {
    this._cache[cacheId] = value;
  }

  /**
   * Clear a cache
   * @param {string} cacheId The ID of the cache to clear
   * @returns {void}
   */
  clearCache(cacheId) {
    delete this._cache[cacheId];
  }

  /**
   * Clear all cache
   * @returns {void}
   */
  clearAllCache() {
    this._cache = {};
  }

  /**
   * Clear connection
   * @returns {void}
   */
  clearConnection() {
    this._connection = null;
  }

  /**
   * Call method(s) on multiple DbObjects at the same time
   * @param {array|Object} args The arguments
   * @example
   * // Example for `args`
   *    let args = [
   *    {
   *      entity: 'Test',
   *      method: 'get',
   *      args: [
   *       // querying row # 1
   *       1
   *      ]
   *    },
   *    {
   *      entity: 'Test',
   *      method: 'get',
   *      args: [
   *       // querying row # 2
   *       2
   *      ]
   *    }
   *  ];
   * // or
   *  let args = {
   *      entity: 'Test',
   *      method: 'get',
   *      args: [
   *       // querying row # 1
   *       1
   *      ]
   *    };
   * @returns {array} Returns an array of results
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
   * @param {array} dbClasses The DbObject mapping to set
   * @example
   * // Example for `dbClasses`
   * let dbClasses = {
   *   'User': DbUser,
   *   'Job': DbJob
   * };
   * @returns {void}
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
