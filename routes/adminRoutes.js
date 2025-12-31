const express = require('express');
const router = express.Router();
const { isAdmin, isAdminGuest, ADMIN_TOKEN } = require('../middleware/authMiddleware');
const employeeStore = require('../utils/employeeStore');

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

router.get('/login', isAdminGuest, (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null
  });
});

router.post('/login', isAdminGuest, (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.cookie('adminToken', ADMIN_TOKEN, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.redirect('/admin/dashboard');
  }

  return res.render('admin/login', {
    title: 'Admin Login',
    error: 'Invalid username or password'
  });
});

router.get('/dashboard', isAdmin, (req, res) => {
  const employees = employeeStore.getAll();
  const recentEmployees = employeeStore.getRecentEmployees(4);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    totalEmployees: employees.length,
    recentEmployees: recentEmployees,
    employees: employees
  });
});

router.get('/employee/add', isAdmin, (req, res) => {
  res.render('admin/addEmployee', {
    title: 'Add Employee',
    error: null,
    employee: {}
  });
});

router.post('/employee/add', isAdmin, async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.render('admin/addEmployee', {
        title: 'Add Employee',
        error: 'All fields are required',
        employee: req.body
      });
    }

    await employeeStore.add({
      name,
      designation,
      email,
      contact,
      department,
      joiningDate,
      location
    });

    return res.redirect('/admin/dashboard');
  } catch (error) {
    return res.render('admin/addEmployee', {
      title: 'Add Employee',
      error: error.message,
      employee: req.body
    });
  }
});

router.get('/employee/edit/:id', isAdmin, (req, res) => {
  const employee = employeeStore.getById(req.params.id);

  if (!employee) {
    return res.redirect('/admin/dashboard');
  }

  res.render('admin/editEmployee', {
    title: 'Edit Employee',
    error: null,
    employee: employee
  });
});

router.post('/employee/edit/:id', isAdmin, async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.render('admin/editEmployee', {
        title: 'Edit Employee',
        error: 'All fields are required',
        employee: { id: req.params.id, ...req.body }
      });
    }

    const updated = await employeeStore.update(req.params.id, {
      name,
      designation,
      email,
      contact,
      department,
      joiningDate,
      location
    });

    if (!updated) {
      return res.redirect('/admin/dashboard');
    }

    return res.redirect('/admin/dashboard');
  } catch (error) {
    return res.render('admin/editEmployee', {
      title: 'Edit Employee',
      error: error.message,
      employee: { id: req.params.id, ...req.body }
    });
  }
});

router.post('/employee/delete/:id', isAdmin, async (req, res) => {
  await employeeStore.delete(req.params.id);
  return res.redirect('/admin/dashboard');
});

router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  return res.redirect('/admin/login');
});

module.exports = router;
