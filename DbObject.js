/**
 * @author Alan Zhao <azhao6060@gmail.com>
 */

/**
 * This is the base class of a data table, to provide further abstraction
 */
module.exports = class DbObject {
  constructor(db) {
    this._tableName = null;
    this._cache = {};
    this._db = db;
  }

  /**
   * Set tableName of this object
   */
  set tableName(tableName) {
    this._tableName = tableName;
  }

  /**
   * Get tableName of this object
   */
  get tableName() {
    return this._tableName;
  }

  /**
   * Get entity by ID
   */
  async get(id) {
    return await this._db.get(this._tableName, id);
  }

  /**
   * Get all entities
   */
  async getAll(orderBy = null) {
    return await this._db.getAll(this._tableName, orderBy);
  }

  /**
   * Get all entity count
   */
  async getAllCount() {
    return await this._db.getAllCount(this._tableName);
  }

  /**
   * Find entities
   */
  async find(criteria, limit = null, orderBy = null) {
    return await this._db.getBy(this._tableName, criteria, limit, orderBy);
  }

  /**
   * Find one entity
   */
  async findOne(criteria) {
    const results = await this._db.getBy(this._tableName, criteria, 1);
    return results[0];
  }

  /**
   * Find a column fron an entity
   */
  async findColumn(criteria, columnName) {
    const row = await this.findOne(criteria);
    return row[columnName];
  }

  /**
   * Create an entity
   */
  async create(values) {
    return await this._db.insert(this._tableName, values);
  }

  /**
   * Update an entity by ID
   */
  async update(id, values) {
    return await this._db.update(this._tableName, id, values);
  }

  /**
   * Update entity with multiple matching criteria
   */
  async updateBy(criteria, values) {
    return await this._db.updateBy(this._tableName, criteria, values);
  }

  /**
   * Delete an entity by ID
   */
  async delete(id) {
    return await this._db.delete(this._tableName, id);
  }

  /**
   * Delete entity with multiple matching criteria
   */
  async deleteBy(criteria) {
    return await this._db.deleteBy(this._tableName, criteria);
  }

  /**
   * Does entity ID exist?
   */
  async exists(id) {
    return await this._db.exists(this._tableName, id);
  }

  /**
   * Does entity exists matching multiple criteria
   */
  async existsBy(criteria, excludeId) {
    return await this._db.existsBy(this._tableName, criteria, excludeId);
  }

  /**
   * Update entities' position column
   */
  async updatePositionColumnById(data) {
    var entityIds = Object.keys(data);
    for (let i = 0; i < entityIds.length; i++) {
      let entityId = entityIds[i];
      let position = data[entityId];
      await this._db.update(this._tableName, entityId, {
        position: position
      });
    }
   
    return true;
  }

  /**
   * Save cache
   */
  saveCache(cacheId, value) {
    this._cache[cacheId] = value;
    return true;
  }

  /**
   * Clear cache
   */
  clearCache(cacheId) {
    delete this._cache[cacheId];
    return true;
  }

  /**
   * Get cache by ID
   */
  getCache(cacheId) {
    return this._cache[cacheId];
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
