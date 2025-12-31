const express = require('express');
const router = express.Router();
const employeeStore = require('../utils/employeeStore');

router.get('/', (req, res) => {
  const employees = employeeStore.getAll();
  res.json({
    success: true,
    count: employees.length,
    data: employees
  });
});

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

router.post('/', async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: name, designation, email, contact, department, joiningDate, location'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

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

router.put('/:id', async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    const existing = employeeStore.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }
    }

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

router.delete('/:id', async (req, res) => {
  const existing = employeeStore.getById(req.params.id);

  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Employee not found'
    });
  }

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
