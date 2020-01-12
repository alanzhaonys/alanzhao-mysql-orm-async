/**
 * This is the base class of a data table, to provide further abstraction
 * @author Alan Zhao <azhao6060@gmail.com>
 */
module.exports = class DbObject {
  /**
   * Construct the DbObject
   * @param {Objct} db The database object
   * @returns {void}
   * @constructor
   */
  constructor(db) {
    /**
     * The table name
     * @type {string}
     * @access private
     */
    this._tableName = null;

    /**
     * Holds the cache
     * @type {array}
     * @access private
     */
    this._cache = {};

    /**
     * Holds the database object
     * @type {Object}
     * @access private
     */
    this._db = db;
  }

  /**
   * Set tableName of this object
   * @params {string} tableName The table name
   * @returns {void}
   */
  set tableName(tableName) {
    this._tableName = tableName;
  }

  /**
   * Get tableName of this object
   * @returns {string} The table name
   */
  get tableName() {
    return this._tableName;
  }

  /**
   * Get entity by ID
   * @param {number} id The primary ID of entity
   * @return {array} The entity array
   */
  async get(id) {
    return await this._db.get(this._tableName, id);
  }

  /**
   * Get all entities
   * @param {string} [orderBy=null] The order by string
   * @returns {array} All the result sets as an array
   */
  async getAll(orderBy = null) {
    return await this._db.getAll(this._tableName, orderBy);
  }

  /**
   * Get all entity count
   * @returns {number} Total number of entities
   */
  async getAllCount() {
    return await this._db.getAllCount(this._tableName);
  }

  /**
   * Find entities
   * @param {Object} criteria The criteria
   * @example
   *  // Example for `criteria` parameter
   *  {
   *    id: 10,
   *    status: 'expired'
   *  }
   * @param {number} [limit=null] The number of results to return, optional
   * @param {string} [orderBy=null] The order by syntax, example "id DESC", optional
   * @returns {array} The result array
   */
  async find(criteria, limit = null, orderBy = null) {
    return await this._db.getBy(this._tableName, criteria, limit, orderBy);
  }

  /**
   * Find one entity
   * @param {Object} criteria The criteria
   * @param {string} [orderBy=null] The order by syntax, example "id DESC", optional
   * @returns {Object} The entity as object
   */
  async findOne(criteria, orderBy = null) {
    const results = await this._db.getBy(this._tableName, criteria, 1, orderBy);
    return results[0];
  }

  /**
   * Find a column from an entity
   * @param {Object} criteria The criteria. If multiple rows matching the criteria are found, only the first row will be used
   * @param {string} columnName The column to return
   * @param {string} [orderBy=null] The order by syntax, example "id DESC", optional
   * @returns {string|number|boolean} The column value
   */
  async findColumn(criteria, columnName, orderBy = null) {
    const row = await this.findOne(criteria);
    return row[columnName];
  }

  /**
   * Create an entity
   * @param {array|Object} values The data to insert as a single object or array of objects
   * @example
   * // Example for `values` parameter
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
   * @returns {boolean} Returns true on successful creation
   */
  async create(values) {
    return await this._db.insert(this._tableName, values);
  }

  /**
   * Update an entity by ID
   * @param {number} id The primary ID of the entity
   * @param {Object} values The data to update
   * @returns {boolean} Returns true on successful update
   */
  async update(id, values) {
    return await this._db.update(this._tableName, id, values);
  }

  /**
   * Update entity with multiple matching criteria
   * @param {Object} criteria The criteria used to match the record
   * @param {Object} values The data to update
   * @returns {boolean} Returns true on successful update
   */
  async updateBy(criteria, values) {
    return await this._db.updateBy(this._tableName, criteria, values);
  }

  /**
   * Delete an entity by ID
   * @param {number} id The primary ID of the record
   * @returns {boolean} Returns true on successful deletion
   */
  async delete(id) {
    return await this._db.delete(this._tableName, id);
  }

  /**
   * Delete entity with multiple matching criteria
   * @param {Object} criteria The criteria used to match the record
   * @returns {boolean} Returns true on successful delete
   */
  async deleteBy(criteria) {
    return await this._db.deleteBy(this._tableName, criteria);
  }

  /**
   * Does entity ID exist?
   * @param {number} id The primary ID of the record
   * @returns {boolean} Returns true if record exists
   */
  async exists(id) {
    return await this._db.exists(this._tableName, id);
  }

  /**
   * Does entity exists matching multiple criteria
   * @param {Object} criteria The criteria used to match the record
   * @param {number} [excludeId=null] The ID to exclude
   * @returns {boolean} Returns true if record exists
   */
  async existsBy(criteria, excludeId) {
    return await this._db.existsBy(this._tableName, criteria, excludeId);
  }

  /**
   * Update entities' position column
   * @param {Object} values The position values to update
   * @example
   * // Example for `values` parameter
   * {
   *   100: 5, // entity #100 gets a new `position` value of 5
   *   101: 6,
   *   102: 7,
   *   103: 8
   * }
   * @returns {boolean} Returns true on successful update
   */
  async updatePositionColumnById(values) {
    var entityIds = Object.keys(values);
    for (let i = 0; i < entityIds.length; i++) {
      let entityId = entityIds[i];
      let position = values[entityId];
      await this._db.update(this._tableName, entityId, {
        position: position
      });
    }

    return true;
  }

  /**
   * Save cache
   * @param {string} cacheId The cache ID
   * @param {string} value The value to cache
   * @returns {void}
   */
  saveCache(cacheId, value) {
    this._cache[cacheId] = value;
    return true;
  }

  /**
   * Clear cache
   * @param {string} cacheId The ID of the cache to clear
   * @returns {void}
   */
  clearCache(cacheId) {
    delete this._cache[cacheId];
    return true;
  }

  /**
   * Clear all cache
   * @returns {void}
   */
  clearAllCache() {
    this._cache = {};
  }

  /**
   * Get cache by ID
   * @param {string} cacheId The ID of the cache to get
   * @returns {array} Returns the cached result set
   */
  getCache(cacheId) {
    return this._cache[cacheId];
  }

  /**
   * Escape string value
   * @param {string} value Value to escape
   * @returns {string} Escaped value
   */
  escape(value) {
    return this._db.escape(value);
  }

  /**
   * Escape identifier(database/table/column name)
   * @param {string} value Value to escape
   * @returns {string} Escaped value
   */
  escapeId(value) {
    return this._db.escapeId(value);
  }
}
