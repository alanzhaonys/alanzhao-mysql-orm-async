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
  async get(id) {
    return await this._db.get(this.tableName, id);
  }

  /**
   * Get all entities
   */
  async getAll(orderBy = null) {
    return await this._db.getAll(this.tableName, orderBy);
  }

  /**
   * Get all entity count
   */
  async getAllCount() {
    return await this._db.getAllCount(this.tableName);
  }

  /**
   * Find entities
   */
  async find(values, orderBy) {
    return await this._db.getBy(this.tableName, values, null, orderBy);
  }

  /**
   * Find one entity
   */
  async findOne(values) {
    return await this._db.getBy(this.tableName, values, 1, null);
  }

  /**
   * Create an entity
   */
  async create(values) {
    return await this._db.insert(this.tableName, values);
  }

  /**
   * Update an entity by ID
   */
  async update(id, values) {
    return await this._db.update(this.tableName, id, values);
  }

  /**
   * Update entity with multiple matching criteria
   */
  async updateBy(criteria, values) {
    return await this._db.updateBy(this.tableName, criteria, values);
  }

  /**
   * Delete an entity by ID
   */
  async delete(id) {
    return await this._db.delete(this.tableName, id);
  }

  /**
   * Delete entity with multiple matching criteria
   */
  async deleteBy(criteria) {
    return await this._db.deleteBy(this.tableName, criteria);
  }

  /**
   * Does entity ID exist?
   */
  async exists(id) {
    return await this._db.exists(this.tableName, id);
  }

  /**
   * Does entity exists matching multiple criteria
   */
  async existsBy(criteria, excludeId) {
    return await this._db.existsBy(this.tableName, criteria, excludeId);
  }

  /**
   * Update entities' position column
   */
  async updatePositioningById(data) {
    var entityIds = Object.keys(data);
    for (let i = 0; i < entityIds.length; i++) {
      let entityId = entityIds[i];
      let position = data[entityId];
      await this._db.update(this.tableName, entityId, {
        position: position
      });
    }
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

  /**
   * Get last query.
   */
  getLastQuery() {
    return this._db.lastQuery;
  }
}
