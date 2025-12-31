const fs = require('fs').promises;
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'employees.json');

class EmployeeStore {
  constructor() {
    this.employees = [];
    this.indexById = new Map();
    this.indexByEmail = new Map();
    this.maxId = 0;
    this.initialized = false;
    this.saveTimeout = null;
    this.DEBOUNCE_MS = 100;
  }

  async init() {
    if (this.initialized) return;

    try {
      const data = await fs.readFile(DATA_PATH, 'utf8');
      this.employees = JSON.parse(data);
      this._buildIndexes();
      this.initialized = true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.employees = [];
        this.initialized = true;
        await this._persist();
      } else {
        throw error;
      }
    }
  }

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

  _debouncedSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this._persist(), this.DEBOUNCE_MS);
  }

  async _persist() {
    await fs.writeFile(DATA_PATH, JSON.stringify(this.employees, null, 2), 'utf8');
  }

  getAll() {
    return [...this.employees];
  }

  getRecentEmployees(limit = 4) {
    return [...this.employees]
      .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
      .slice(0, limit);
  }

  getById(id) {
    const numId = Number(id);
    const index = this.indexById.get(numId);
    if (index === undefined) return null;
    return { ...this.employees[index] };
  }

  getByEmail(email) {
    const index = this.indexByEmail.get(email.toLowerCase());
    if (index === undefined) return null;
    return { ...this.employees[index] };
  }

  emailExists(email, excludeId = null) {
    const index = this.indexByEmail.get(email.toLowerCase());
    if (index === undefined) return false;
    if (excludeId !== null && this.employees[index].id === Number(excludeId)) {
      return false;
    }
    return true;
  }

  async add(employeeData) {
    const email = employeeData.email.toLowerCase();

    if (this.indexByEmail.has(email)) {
      throw new Error('Email already exists');
    }

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

    const newIndex = this.employees.length;
    this.employees.push(newEmployee);
    this.indexById.set(newEmployee.id, newIndex);
    this.indexByEmail.set(email, newIndex);

    this._debouncedSave();
    return { ...newEmployee };
  }

  async update(id, updateData) {
    const numId = Number(id);
    const index = this.indexById.get(numId);

    if (index === undefined) {
      return null;
    }

    const employee = this.employees[index];

    if (updateData.email && updateData.email.toLowerCase() !== employee.email.toLowerCase()) {
      if (this.indexByEmail.has(updateData.email.toLowerCase())) {
        throw new Error('Email already exists');
      }
      this.indexByEmail.delete(employee.email.toLowerCase());
      this.indexByEmail.set(updateData.email.toLowerCase(), index);
    }

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

  async delete(id) {
    const numId = Number(id);
    const index = this.indexById.get(numId);

    if (index === undefined) {
      return false;
    }

    const employee = this.employees[index];
    this.indexById.delete(numId);
    this.indexByEmail.delete(employee.email.toLowerCase());

    this.employees = this.employees.filter((_, i) => i !== index);
    this._buildIndexes();

    this._debouncedSave();
    return true;
  }

  count() {
    return this.employees.length;
  }
}

const store = new EmployeeStore();

module.exports = store;
