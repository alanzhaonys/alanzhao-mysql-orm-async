/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

const mysql = require('mysql');

const dbClasses = {};

class DatabaseError extends Error {}

/**
 * A database wrapper for npm 'mysql' package
 */
module.exports = class Database {
  /**
   * Construct database connection
   */
  constructor(configs) {
    this._connection = null;
    this._connectionError = null;
    this._lastResults = null;
    this._defaultConnectTimeout = 10000;
    this._defaultDbPort = 3306;
    this._logError = true;
    this._cache = {};

    this._dbHost = configs.dbHost;
    this._dbName = configs.dbName;
    this._dbUser = configs.dbUser;
    this._dbPassword = configs.dbPassword;
    this._dbPort = configs.dbPort ?
      configs.dbPort : this._defaultDbPort;
    this._connectTimeout = configs.connectTimeout ?
      configs.connectTimeout : this._defaultConnectTimeout;
  }

  /**
   * Connect to database
   */
  connect(callback, ssl = false, sslCertPath = null) {
    if (!this._connection) {
      var options = {
        host: this._dbHost,
        port: this._dbPort,
        user: this._dbUser,
        password: this._dbPassword,
        database: this._dbName,
        connectTimeout: this._connectTimeout,
        dateStrings: true,
        multipleStatements: true
      };

      if (ssl) {
        if (sslCertPath === 'Amazon RDS') {
          options['ssl'] = 'Amazon RDS';
        } else {
          const fs = require('fs');
          options['ssl'] = {
            ca: fs.readFileSync(sslCertPath + '/ca.pem'),
            cert: fs.readFileSync(sslCertPath + '/client-cert.pem'),
            key: fs.readFileSync(sslCertPath + '/client-key.pem')
          };
        }
      }

      this._connection = mysql.createConnection(options);

      this._connection.connect(error => {
        if (error) {
          //this._connectionError = error.toString();
          this._connectionError = new DatabaseError('Unable to connect.');
        } else {
          this._connectionError = null;
        }
        // Callback with error
        return callback(this._connectionError);
      });
    } else {
      //console.log('Re-using database connection...');
      // Callback with error if any
      return callback(this._connectionError);
    }
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
   * Run a query
   */
  query(query, values = [], callback = null) {
    if (values.length > 0) {
      this._connection.query(query, values, (error, results, fields) => {
        this._lastResults = results;
        let errorMessage = error ? error.sqlMessage + ', ' + error.sql : null;

        if (errorMessage && this._logError) {
          console.error(errorMessage);
          console.error(query);
        }

        if (callback) {
          return callback(results, errorMessage);
        }
      });
    } else {
      this._connection.query(query, (error, results, fields) => {
        this._lastResults = results;
        let errorMessage = null;

        if (error) {
          if (error.sqlMessage) {
            errorMessage = error.sqlMessage + ', ' + error.sql;
          } else {
            errorMessage = error.toString();
          }
        }

        if (errorMessage && this._logError) {
          console.error(errorMessage);
          console.error(query);
        }

        if (callback) {
          return callback(results, errorMessage);
        }
      });
    }
  }

  /**
   * Get one record by ID
   */
  get(table, id, callback) {
    return this.getBy(table, {
      id: id
    }, 1, null, callback);
  }

  /**
   * Get all records from a table
   */
  getAll(table, orderBy = null, callback) {
    return this.getBy(
      table,
      {},
      null,
      orderBy,
      callback
    );
  }

  /**
   * Get all record count of a table
   */
  getAllCount(table, callback) {
    var query = 'SELECT COUNT(id) FROM ' + this.escapeId(table);
    this.integer(query, (count, error) => {
      return callback(count, error);
    });
  }

  /**
   * Construct a SELECT query with multiple matching criteria
   */
  getBy(table, values, limit = null, orderBy = null, callback) {
    var where = [];
    for (let key in values) {
      let value = values[key];
      if (typeof value === 'string'
          && value.match('ENCRYPT\((.+)\)')) {
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

    if (limit > 0) {
      query += ' LIMIT ' + limit;
    }

    this.query(query, [], (results, error) => {
      if (!results) {
        return callback(null, error);
      }

      if (results.length === 0) {
        return callback([], null);
      }

      if (limit === 1) {
        return callback(this.export(results[0]), null);
      }

      return callback(this.export(results), null);
    });
  }

  /**
   * Construct single or multiple INSERT queries
   */
  insert(table, data, callback = null) {
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
        if (typeof value === 'string'
          && value.match('ENCRYPT\((.+)\)')) {
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

    if (queries.length === 0) {
      return callback(false, 'Nothing to insert');
    }

    this.query(queries.join('; '), [], (results, error) => {
      if (callback) {
        if (!results) {
          return callback(false, error);
        }
        // multiple insert
        if (queries.length > 1) {
          return callback(true, null);
        } else {
          // single insert
          return callback(results.insertId, null);
        }
      }
    });
  }

  /**
   * Construct an UPDATE query by ID
   */
  update(table, id, values, callback = null) {
    this.updateBy(table, {
      id: id
    }, values, callback);
  }

  /**
   * Construct an UPDATE query with multiple matching criteria
   */
  updateBy(table, criteria, values, callback = null) {
    var where = [];
    var criteriaKeys = Object.keys(criteria);

    criteriaKeys.forEach(key => {
      let value = criteria[key];
      where.push(this.escapeId(key) + ' = ' + this.escape(value));
    });

    var set = [];
    var valueKeys = Object.keys(values);

    valueKeys.forEach(key => {
      let value = values[key];
      set.push(this.escapeId(key) + ' = ' + this.escape(value));
    });

    var query = 'UPDATE ' + this.escapeId(table) + ' SET ';
    query += set.join(', ');
    query += ' WHERE ' + where.join(' AND ');

    this.query(query, [], (results, error) => {
      if (callback) {
        if (!results) {
          return callback(false, error);
        }
        return callback(true, null);
      }
    });
  }

  /**
   * Construct delete query by ID
   */
  delete(table, id, callback = null) {
    this.deleteBy(table, {
      id: id
    }, callback);
  }

  /**
   * Construct delete query with multiple matching criteria
   */
  deleteBy(table, values, callback = null) {
    var where = [];
    for (let key in values) {
      let value = values[key];
      where.push(this.escapeId(key) + ' = ' + this.escape(value));
    }

    var query =
      'DELETE FROM ' + this.escapeId(table) + ' WHERE ' + where.join(' AND ');

    this.query(query, [], (results, error) => {
      if (!results) {
        return callback(false, error);
      }
      return callback(true, null);
    });
  }

  /**
   * If a record exists by ID
   */
  exists(table, id, callback = null) {
    this.existsBy(table, {
      id: id
    }, null, callback);
  }

  /**
   * If a record exist by matching multiple critera
   */
  existsBy(table, values, excludeId = null, callback) {
    var where = [];
    for (let key in values) {
      let value = values[key];
      where.push(this.escapeId(key) + ' = ' + this.escape(value));
    }

    var query =
      'SELECT COUNT(id) FROM ' +
      this.escapeId(table) +
      ' WHERE ' +
      where.join(' AND ');

    if (excludeId) {
      query += ' AND id != ' + this.escape(excludeId);
    }

    this.integer(query, (count, error) => {
      if (count > 0) {
        return callback(true, null);
      }
      return callback(false, error);
    });
  }

  /**
   * Return results as array
   */
  array(query, key = null, callback) {
    this.query(query, [], (results, error) => {
      var array = [];
      results.forEach(result => {
        if (key) {
          array.push(result[key]);
        } else {
          array.push(result[Object.keys(result)[0]]);
        }
      });
      return callback(array, error);
    });
  }

  /**
   * Return results with custom key and values
   */
  kvObject(query, key, value, callback) {
    this.query(query, [], (results, error) => {
      var object = {};
      results.forEach(result => {
        object[result[key]] = result[value];
      });
      return callback(object, error);
    });
  }

  /**
   * Return first row of result set
   */
  row(query, callback) {
    this.query(query, [], (results, error) => {
      if (!results) {
        return callback(null, error);
      }
      if (results[0]) {
        var row = this.export(results[0]);
        return callback(row, null);
      }
      return callback(null, 'row is not found');
    });
  }

  /**
   * Return scalar value
   */
  scalar(query, callback) {
    this.query(query, [], (results, error) => {
      if (!results) {
        return callback(null, error);
      }
      if (results[0]) {
        var result = results[0];
        var value = result[Object.keys(result)[0]];
        return callback(value, null);
      }
      return callback(null, 'value is not found');
    });
  }

  /**
   * Return boolean value
   */
  bool(query, callback) {
    this.query(query, [], (results, error) => {
      // Don't care about 'results', return boolean value instead
      return callback(error ? false : true, error);
    });
  }

  /**
   * Return integer value
   */
  integer(query, callback) {
    this.scalar(query, (value, error) => {
      if (value !== '' && value !== null) {
        return callback(parseInt(value), null);
      }
      return callback(null, error);
    });
  }

  /**
   * Return decimal value
   */
  decimal(query, decimal = 2, callback) {
    this.scalar(query, (value, error) => {
      if (value !== '' && value !== null) {
        return callback(parseFloat(value.toFixed(decimal)), null);
      }
      return callback(null, error);
    });
  }

  /**
   * Run queries in transaction
   */
  transaction(queries, callback) {
    this._connection.beginTransaction(error => {
      if (error) {
        return callback(error);
      }

      this.query(queries, [], (results, queryError) => {
        if (queryError) {
          this._connection.rollback(() => {
            return callback(queryError);
          });
        } else {
          this._connection.commit(commitError => {
            if (commitError) {
              this._connection.rollback(() => {
                return callback(commitError);
              });
            }
            return callback(null);
          });
        }
      });
    });
  }

  /**
   * Export results
   */
  export (results) {
    // JSON manipulation to remove unwanted mysql methods
    return !results ? null : JSON.parse(JSON.stringify(results));
  }

  /**
   * Close database connection
   */
  close(callback = null) {
    if (this._connection) {
      this._connection.end(error => {
        if (callback) {
          return callback(error === undefined ? null : error);
        }
        this.clearConnection();
      });
    }
  }

  /**
   * Duplicate a table
   */
  duplicateTable(from, to, callback = null) {
    var fromTable = this.escapeId(from);
    var toTable = this.escapeId(to);
    var query =
      'CREATE TABLE ' +
      toTable +
      ' LIKE ' +
      fromTable +
      '; INSERT ' +
      toTable +
      ' SELECT * FROM ' +
      fromTable;
    this.bool(query, (bool, error) => {
      if (callback) {
        callback(bool, error);
      }
    });
  }

  /**
   * Truncate a table, useful for testing
   */
  truncate(table, callback = null) {
    var query = 'TRUNCATE TABLE ' + this.escapeId(table);
    this.bool(query, (bool, error) => {
      if (callback) {
        callback(bool, error);
      }
    });
  }

  /**
   * Drop a table, useful for testing
   */
  drop(table, callback = null) {
    var query = 'DROP TABLE ' + this.escapeId(table);
    this.bool(query, (bool, error) => {
      if (callback) {
        callback(bool, error);
      }
    });
  }

  /**
   * Set an environment variable
   */
  setEnvVar(name, value, callback) {
    this.query('SET @' + name + ' = ' + this.escape(value), [], (results, error) => {
      callback(results, error);
    });
  }

  /**
   * Get an environment variable
   */
  getEnvVar(name, callback) {
    this.scalar('SELECT @' + name, (scalar, error) => {
      callback(scalar, error);
    });
  }

  /**
   * Get table columns
   */
  getTableColumns(table, ignoreColumns = [], callback) {
    var cacheId = 'table-columns-for-' + table;
    if (this._cache[cacheId]) {
      return callback(this._cache[cacheId]);
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

    this.array(query, 'COLUMN_NAME', (results, error) => {
      if (error) {
        return callback(null, error);
      } else {
        var columns = this.export(results);
        this.saveCache(cacheId, columns);
        return callback(columns, null);
      }
    });
  }

  /**
   * Get column default values
   */
  getTableColumnDefaultValues(table, ignoreColumns = [], callback) {
    var cacheId = 'table-column-default-values-for-' + table;
    if (this._cache[cacheId]) {
      return callback(this._cache[cacheId]);
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

    this.kvObject(query, 'COLUMN_NAME', 'COLUMN_DEFAULT', (results, error) => {
      if (error) {
        return callback(null, error);
      } else {
        var types = this.export(results);
        this.saveCache(cacheId, types);
        return callback(this.export(types), null);
      }
    });
  }

  /**
   * Get column data types
   */
  getTableColumnDataTypes(table, ignoreColumns = [], callback) {
    var cacheId = 'table-column-data-types-for-' + table;
    if (this._cache[cacheId]) {
      return callback(this._cache[cacheId]);
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

    this.kvObject(query, 'COLUMN_NAME', 'COLUMN_TYPE', (results, error) => {
      if (error) {
        return callback(null, error);
      } else {
        var types = this.export(results);
        this.saveCache(cacheId, types);
        return callback(this.export(types), null);
      }
    });
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
   * Call method(s) of a DbObject
   */
  getDb(args, callback) {
    var self = this;
    var results = [];
    var completedCount = 0;

    if (!Array.isArray(args)) {
      args = [args];
    }

    args.forEach((arg, argCount) => {
      let entity = arg.entity;
      let method = arg.method;
      // Get a copy of the 'args' array
      let vars = arg.args ? arg.args.slice(0) : [];
      let dbObject = dbClasses[entity];

      //console.log(argCount + ': ' + entity + ' -> ' + method);
      //console.log('args: ' + JSON.stringify(vars));

      if (!dbObject) {
        return callback(null, 'Database object "' + entity + '" is not found');
      }
      let obj = new dbObject(self);

      let dbCallback = (result, error) => {
        if (error) {
          return callback(null, error);
        }

        // Add to results
        results[argCount] = result;

        if (++completedCount === args.length) {
          if (args.length === 1) {
            return callback(results[0], null);
          }
          return callback(results, null);
        }
      };

      vars.push(dbCallback);
      obj[method](...vars);
    });
  }

  /**
   * Turn log error on/off
   */
  set logError(bool) {
    this._logError = bool;
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
