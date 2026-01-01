/**
 * employeeStore.js - Employee Data Persistence Layer
 *
 * Manages employee data storage using JSON file persistence with in-memory caching.
 * Features:
 * - In-memory array with Map indexes for O(1) lookups by ID and email
 * - Debounced file writes to prevent excessive disk I/O
 * - Email uniqueness enforcement (case-insensitive)
 * - Auto-incrementing IDs
 *
 * Data File: data/employees.json
 */

const fs = require('fs').promises;
const path = require('path');

// Path to JSON data file
const DATA_PATH = path.join(__dirname, '..', 'data', 'employees.json');

class EmployeeStore {
  constructor() {
    this.employees = [];              // In-memory array of employee objects
    this.indexById = new Map();       // Map<id, arrayIndex> for O(1) ID lookups
    this.indexByEmail = new Map();    // Map<email, arrayIndex> for O(1) email lookups
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
      this.employees = JSON.parse(data);
      this._buildIndexes();
      this.initialized = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, start with empty array
        this.employees = [];
        this.initialized = true;
        await this._persist();
      } else {
        throw error;
      }
    }
  }

  /**
   * Rebuild all indexes from the employees array.
   * Called after initialization and after deletions.
   */
  _buildIndexes() {
    this.indexById.clear();
    this.indexByEmail.clear();
    this.maxId = 0;

    for (let i = 0; i < this.employees.length; i++) {
      const emp = this.employees[i];
      this.indexById.set(emp.id, i);
      this.indexByEmail.set(emp.email.toLowerCase(), i);
      if (emp.id > this.maxId) {
        this.maxId = emp.id;
      }
    }
  }

  /**
   * Schedule a debounced save operation.
   * Prevents excessive disk writes during rapid updates.
   */
  _debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this._persist(), this.DEBOUNCE_MS);
  }

  /**
   * Write current employees array to JSON file.
   */
  async _persist() {
    await fs.writeFile(DATA_PATH, JSON.stringify(this.employees, null, 2), 'utf8');
  }

  /**
   * Get all employees.
   * Returns a shallow copy to prevent external mutation.
   */
  getAll() {
    return [...this.employees];
  }

  /**
   * Get most recently hired employees sorted by joining date.
   * @param {number} limit - Maximum number of employees to return
   */
  getRecentEmployees(limit = 4) {
    return [...this.employees]
      .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
      .slice(0, limit);
  }

  /**
   * Get employee by ID using index for O(1) lookup.
   * Returns a copy to prevent external mutation.
   */
  getById(id) {
    const numId = Number(id);
    const index = this.indexById.get(numId);
    if (index === undefined) return null;
    return { ...this.employees[index] };
  }

  /**
   * Get employee by email using index for O(1) lookup.
   * Email comparison is case-insensitive.
   */
  getByEmail(email) {
    const index = this.indexByEmail.get(email.toLowerCase());
    if (index === undefined) return null;
    return { ...this.employees[index] };
  }

  /**
   * Check if email already exists in the store.
   * @param {string} email - Email to check
   * @param {number|null} excludeId - Exclude this employee ID from check (for updates)
   */
  emailExists(email, excludeId = null) {
    const index = this.indexByEmail.get(email.toLowerCase());
    if (index === undefined) return false;
    if (excludeId !== null && this.employees[index].id === Number(excludeId)) {
      return false;  // Same employee, not a conflict
    }
    return true;
  }

  /**
   * Add a new employee to the store.
   * Throws error if email already exists.
   * @param {Object} employeeData - Employee data object
   * @returns {Object} Created employee with assigned ID
   */
  async add(employeeData) {
    const email = employeeData.email.toLowerCase();

    // Enforce email uniqueness
    if (this.indexByEmail.has(email)) {
      throw new Error('Email already exists');
    }

    // Auto-increment ID
    this.maxId++;
    const newEmployee = {
      id: this.maxId,
      name: employeeData.name,
      designation: employeeData.designation,
      email: employeeData.email,
      contact: employeeData.contact,
      department: employeeData.department,
      joiningDate: employeeData.joiningDate,
      location: employeeData.location
    };

    // Add to array and update indexes
    const newIndex = this.employees.length;
    this.employees.push(newEmployee);
    this.indexById.set(newEmployee.id, newIndex);
    this.indexByEmail.set(email, newIndex);

    this._debouncedSave();
    return { ...newEmployee };
  }

  /**
   * Update an existing employee.
   * Supports partial updates - only provided fields are changed.
   * Throws error if new email conflicts with another employee.
   * @param {number} id - Employee ID to update
   * @param {Object} updateData - Fields to update
   * @returns {Object|null} Updated employee or null if not found
   */
  async update(id, updateData) {
    const numId = Number(id);
    const index = this.indexById.get(numId);

    if (index === undefined) {
      return null;
    }

    const employee = this.employees[index];

    // Handle email change - check for conflicts and update index
    if (updateData.email && updateData.email.toLowerCase() !== employee.email.toLowerCase()) {
      if (this.indexByEmail.has(updateData.email.toLowerCase())) {
        throw new Error('Email already exists');
      }
      // Update email index
      this.indexByEmail.delete(employee.email.toLowerCase());
      this.indexByEmail.set(updateData.email.toLowerCase(), index);
    }

    // Merge update data with existing employee (nullish coalescing for partial updates)
    const updatedEmployee = {
      ...employee,
      name: updateData.name ?? employee.name,
      designation: updateData.designation ?? employee.designation,
      email: updateData.email ?? employee.email,
      contact: updateData.contact ?? employee.contact,
      department: updateData.department ?? employee.department,
      joiningDate: updateData.joiningDate ?? employee.joiningDate,
      location: updateData.location ?? employee.location
    };

    this.employees[index] = updatedEmployee;
    this._debouncedSave();
    return { ...updatedEmployee };
  }

  /**
   * Delete an employee by ID.
   * Rebuilds indexes after deletion to maintain consistency.
   * @param {number} id - Employee ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  async delete(id) {
    const numId = Number(id);
    const index = this.indexById.get(numId);

    if (index === undefined) {
      return false;
    }

    const employee = this.employees[index];
    this.indexById.delete(numId);
    this.indexByEmail.delete(employee.email.toLowerCase());

    // Remove from array and rebuild indexes (array indexes shift after removal)
    this.employees = this.employees.filter((_, i) => i !== index);
    this._buildIndexes();

    this._debouncedSave();
    return true;
  }

  /**
   * Get total number of employees.
   */
  count() {
    return this.employees.length;
  }
}

const store = new EmployeeStore();

module.exports = store;
