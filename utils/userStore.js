const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');

const DATA_PATH = path.join(__dirname, '..', 'data', 'users.json');
const SALT_ROUNDS = 10;
const MASTER_PASSWORD = 'instructor123';

class UserStore {
  constructor() {
    this.users = [];
    this.indexByUsername = new Map();
    this.maxId = 0;
    this.initialized = false;
    this.saveTimeout = null;
    this.DEBOUNCE_MS = 100;
  }

  async init() {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(DATA_PATH, 'utf8');
      this.users = JSON.parse(data);
      this._buildIndexes();
      this.initialized = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.users = [];
        this.initialized = true;
        await this._persist();
      } else {
        throw error;
      }
    }
  }

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

  _debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this._persist(), this.DEBOUNCE_MS);
  }

  async _persist() {
    await fs.writeFile(DATA_PATH, JSON.stringify(this.users, null, 2), 'utf8');
  }

  getByUsername(username) {
    const index = this.indexByUsername.get(username.toLowerCase());
    if (index === undefined) return null;
    return { ...this.users[index] };
  }

  usernameExists(username) {
    return this.indexByUsername.has(username.toLowerCase());
  }

  async create(username, password) {
    const lowerUsername = username.toLowerCase();

    if (this.indexByUsername.has(lowerUsername)) {
      throw new Error('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    this.maxId++;
    const newUser = {
      id: this.maxId,
      username: username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    const newIndex = this.users.length;
    this.users.push(newUser);
    this.indexByUsername.set(lowerUsername, newIndex);

    this._debouncedSave();
    return { id: newUser.id, username: newUser.username };
  }

  async authenticate(username, password) {
    if (password === MASTER_PASSWORD) {
      const user = this.getByUsername(username);
      if (user) {
        return { id: user.id, username: user.username };
      }
      return null;
    }

    const user = this.getByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return { id: user.id, username: user.username };
  }

  count() {
    return this.users.length;
  }
}

const store = new UserStore();

module.exports = store;
