/**
 * userStore.js - User Data Persistence Layer
 *
 * Manages user account storage with secure password hashing.
 * Features:
 * - In-memory array with Map index for O(1) username lookups
 * - bcrypt password hashing (10 salt rounds)
 * - Debounced file writes to prevent excessive disk I/O
 * - Username uniqueness enforcement (case-insensitive)
 * - Master password for instructor testing
 *
 * Data File: data/users.json
 */

const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

// Path to JSON data file
const DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');

// bcrypt configuration - 10 rounds provides good security/performance balance
const SALT_ROUNDS = 10;

// Master password for instructor/testing access (bypasses bcrypt verification)
const MASTER_PASSWORD = 'instructor123';

class UserStore {
  constructor() {
    this.users = [];                  // In-memory array of user objects
    this.indexByUsername = new Map(); // Map<username, arrayIndex> for O(1) lookups
    this.maxId = 0;                   // Track highest ID for auto-increment
    this.initialized = false;         // Prevent double initialization
    this.saveTimeout = null;          // Debounce timer reference
    this.DEBOUNCE_MS = 100;           // Debounce delay in milliseconds
  }

  /**
   * Initialize the store by loading data from JSON file.
   * Creates empty file if it doesn't exist.
   */
  async init() {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(DATA_PATH, 'utf8');
      this.users = JSON.parse(data);
      this._buildIndexes();
      this.initialized = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty array
        this.users = [];
        this.initialized = true;
        await this._persist();
      } else {
        throw error;
      }
    }
  }

  /**
   * Rebuild username index from the users array.
   * Called after initialization.
   */
  _buildIndexes() {
    this.indexByUsername.clear();
    this.maxId = 0;

    for (let i = 0; i < this.users.length; i++) {
      const user = this.users[i];
      this.indexByUsername.set(user.username.toLowerCase(), i);
      if (user.id > this.maxId) {
        this.maxId = user.id;
      }
    }
  }

  /**
   * Schedule a debounced save operation.
   * Prevents excessive disk writes during rapid operations.
   */
  _debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this._persist(), this.DEBOUNCE_MS);
  }

  /**
   * Write current users array to JSON file.
   */
  async _persist() {
    await fs.writeFile(DATA_PATH, JSON.stringify(this.users, null, 2), 'utf8');
  }

  /**
   * Get user by username using index for O(1) lookup.
   * Username comparison is case-insensitive.
   */
  getByUsername(username) {
    const index = this.indexByUsername.get(username.toLowerCase());
    if (index === undefined) return null;
    return { ...this.users[index] };
  }

  /**
   * Check if username already exists in the store.
   * Case-insensitive comparison.
   */
  usernameExists(username) {
    return this.indexByUsername.has(username.toLowerCase());
  }

  /**
   * Create a new user account.
   * Password is hashed with bcrypt before storage.
   * @param {string} username - Unique username
   * @param {string} password - Plain text password (will be hashed)
   * @returns {Object} Created user (id and username only, no password)
   * @throws {Error} If username already exists
   */
  async create(username, password) {
    const lowerUsername = username.toLowerCase();

    // Enforce username uniqueness
    if (this.indexByUsername.has(lowerUsername)) {
      throw new Error('Username already exists');
    }

    // Hash password with bcrypt (async operation)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Auto-increment ID
    this.maxId++;
    const newUser = {
      id: this.maxId,
      username: username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    // Add to array and update index
    const newIndex = this.users.length;
    this.users.push(newUser);
    this.indexByUsername.set(lowerUsername, newIndex);

    this._debouncedSave();
    // Return user without password hash for security
    return { id: newUser.id, username: newUser.username };
  }

  /**
   * Authenticate a user with username and password.
   * Supports master password for instructor/testing access.
   * @param {string} username - Username to authenticate
   * @param {string} password - Plain text password to verify
   * @returns {Object|null} User object (id, username) or null if authentication fails
   */
  async authenticate(username, password) {
    // Master password bypass for instructor testing
    if (password === MASTER_PASSWORD) {
      const user = this.getByUsername(username);
      if (user) {
        return { id: user.id, username: user.username };
      }
      return null;  // Username doesn't exist
    }

    // Normal authentication flow
    const user = this.getByUsername(username);
    if (!user) {
      return null;  // User not found
    }

    // Compare password with stored hash using bcrypt
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;  // Invalid password
    }

    // Return user without password hash
    return { id: user.id, username: user.username };
  }

  /**
   * Get total number of registered users.
   */
  count() {
    return this.users.length;
  }
}

const store = new UserStore();

module.exports = store;
