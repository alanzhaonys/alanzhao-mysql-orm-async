/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

const DbObject = require('./DbObject');

module.exports = class DbTest extends DbObject {
  constructor(db) {
    super(db);

    this.tableName = 'test_table_1';
  }
}
