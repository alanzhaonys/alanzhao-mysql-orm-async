const DbObject = require('./DbObject');

module.exports = class DbExample extends DbObject {
  constructor(db) {
    super(db);

    this.tableName = 'dbexample';
  }
}
