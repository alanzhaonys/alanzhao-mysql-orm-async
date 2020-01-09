/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

/**
 * This is the base class of a data table, to provide further abstraction
 */
module.exports = class DbObject {
  constructor(db) {
    this.tableName = null;
    this._cache = {};
    this._db = db;
  }

  /**
   * Get entity by ID
   */
  get(id, callback) {
    return this._db.get(this.tableName, id, callback);
  }

  /**
   * Get all entities
   */
  getAll(orderBy = null, callback) {
    return this._db.getAll(this.tableName, orderBy, callback);
  }

  /**
   * Get all entity count
   */
  getAllCount(callback) {
    return this._db.getAllCount(this.tableName, callback);
  }

  /**
   * Find entities
   */
  find(values, orderBy, callback) {
    return this._db.getBy(this.tableName, values, null, orderBy, callback);
  }

  /**
   * Find one entity
   */
  findOne(values, callback) {
    return this._db.getBy(this.tableName, values, 1, null, callback);
  }

  /**
   * Create an entity
   */
  create(values, callback = null) {
    return this._db.insert(this.tableName, values, callback);
  }

  /**
   * Update an entity by ID
   */
  update(id, values, callback = null) {
    return this._db.update(this.tableName, id, values, callback);
  }

  /**
   * Update entity with multiple matching criteria
   */
  updateBy(table, criteria, values, callback = null) {
    return this._db.updateBy(this.tableName, criteria, values, callback);
  }

  /**
   * Delete an entity by ID
   */
  delete(id, callback = null) {
    return this._db.delete(this.tableName, id, callback);
  }

  /**
   * Delete entity with multiple matching criteria
   */
  deleteBy(table, criteria, values, callback = null) {
    return this._db.deleteBy(this.tableName, criteria, values, callback);
  }

  /**
   * Does entity ID exist?
   */
  exists(id, callback) {
    return this._db.exists(this.tableName, id, callback);
  }

  /**
   * Does entity exists matching multiple criteria
   */
  existsBy(criteria, values, excludeId, callback = null) {
    return this._db.existsBy(this.tableName, criteria, values, excludeId, callback);
  }

  /**
   * Update entities' position column
   */
  updatePositioningById(data, callback) {
    var entityIds = Object.keys(data);
    var processedCount = 0;
    entityIds.forEach(entityId => {
      let position = data[entityId];
      this._db.update(this.tableName, entityId, {
        position: position
      }, () => {
        processedCount++;
        if (processedCount === entityIds.length) {
          return callback();
        }
      });
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
   * Escape string value
   */
  escape(value) {
    return this._db.escape(value);
  }

  /**
   * Escape identifier(database/table/column name)
   */
  escapeId(value) {
    return this._db.escapeId(value);
  }
}
