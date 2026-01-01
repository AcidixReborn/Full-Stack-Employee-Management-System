/**
 * employeeRoutes.js - REST API Endpoints for Employee Management
 *
 * Provides a RESTful API for CRUD operations on employee records.
 * All endpoints return JSON responses with a consistent format:
 * { success: boolean, data/error: ... }
 *
 * HTTP Status Codes:
 * - 200: Success (GET, PUT, DELETE)
 * - 201: Created (POST)
 * - 400: Bad Request (validation errors)
 * - 404: Not Found (employee doesn't exist)
 * - 409: Conflict (duplicate email)
 * - 500: Server Error
 */

const express = require('express');
const router = express.Router();
const employeeStore = require('../utils/employeeStore');

// Email validation regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/employees
 * Retrieve all employees
 * Response: { success: true, count: number, data: Employee[] }
 */
router.get('/', (req, res) => {
  const employees = employeeStore.getAll();
  res.json({
    success: true,
    count: employees.length,
    data: employees
  });
});

/**
 * GET /api/employees/:id
 * Retrieve a single employee by ID
 * Response: { success: true, data: Employee } or 404 error
 */
router.get('/:id', (req, res) => {
  const employee = employeeStore.getById(req.params.id);

  if (!employee) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

  res.json({
    success: true,
    data: employee
  });
});

/**
 * POST /api/employees
 * Create a new employee
 * Body: { name, designation, email, contact, department, joiningDate, location }
 * Response: { success: true, data: Employee } with status 201
 */
router.post('/', async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    // Validation: All fields required
    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, designation, email, contact, department, joiningDate, location'
      });
    }

    // Validation: Email format
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Add employee (store handles email uniqueness)
    const newEmployee = await employeeStore.add({
      name,
      designation,
      email,
      contact,
      department,
      joiningDate,
      location
    });

    res.status(201).json({
      success: true,
      data: newEmployee
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * PUT /api/employees/:id
 * Update an existing employee (partial updates supported)
 * Body: { field: newValue, ... }
 * Response: { success: true, data: Employee }
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    // Check if employee exists
    const existing = employeeStore.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    // Validate email format if provided
    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
    }

    // Update employee (store handles email uniqueness check)
    const updatedEmployee = await employeeStore.update(req.params.id, {
      name,
      designation,
      email,
      contact,
      department,
      joiningDate,
      location
    });

    res.json({
      success: true,
      data: updatedEmployee
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.message === 'Email already exists') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

/**
 * DELETE /api/employees/:id
 * Delete an employee by ID
 * Response: { success: true, message: "Employee deleted successfully" }
 */
router.delete('/:id', async (req, res) => {
  // Check if employee exists
  const existing = employeeStore.getById(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

  // Delete employee from store
  const deleted = await employeeStore.delete(req.params.id);

  if (!deleted) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete employee'
    });
  }

  res.json({
    success: true,
    message: 'Employee deleted successfully'
  });
});

module.exports = router;
