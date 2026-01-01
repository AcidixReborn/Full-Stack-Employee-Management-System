/**
 * adminRoutes.js - Admin Panel Route Handlers
 *
 * Handles all admin-related routes including authentication, dashboard,
 * and employee CRUD operations. All routes except login require admin authentication.
 */

const express = require('express');
const router = express.Router();
const { isAdmin, isAdminGuest, ADMIN_TOKEN } = require('../middleware/authMiddleware');
const employeeStore = require('../utils/employeeStore');

// Hardcoded admin credentials (for demo purposes - use environment variables in production)
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

/**
 * AUTHENTICATION ROUTES
 * Handles admin login/logout with cookie-based session management
 */

// GET /admin/login - Display login form (redirects to dashboard if already logged in)
router.get('/login', isAdminGuest, (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
    error: null
  });
});

// POST /admin/login - Process login credentials and set auth cookie
router.post('/login', isAdminGuest, (req, res) => {
  const { username, password } = req.body;

  // Validate credentials against hardcoded values
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    // Set httpOnly cookie to prevent XSS attacks, expires in 24 hours
    res.cookie('adminToken', ADMIN_TOKEN, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    return res.redirect('/admin/dashboard');
  }

  // Re-render login with error message on failed authentication
  return res.render('admin/login', {
    title: 'Admin Login',
    error: 'Invalid username or password'
  });
});

/**
 * DASHBOARD ROUTE
 * Main admin view showing employee statistics and full employee list
 */

// GET /admin/dashboard - Display admin dashboard with employee data
router.get('/dashboard', isAdmin, (req, res) => {
  const employees = employeeStore.getAll();
  const recentEmployees = employeeStore.getRecentEmployees(4);  // Get 4 most recent hires

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    totalEmployees: employees.length,
    recentEmployees: recentEmployees,
    employees: employees
  });
});

/**
 * EMPLOYEE CRUD ROUTES
 * Create, Read, Update, Delete operations for employee records
 */

// GET /admin/employee/add - Display empty form for adding new employee
router.get('/employee/add', isAdmin, (req, res) => {
  res.render('admin/addEmployee', {
    title: 'Add Employee',
    error: null,
    employee: {}
  });
});

// POST /admin/employee/add - Process form submission to create new employee
router.post('/employee/add', isAdmin, async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    // Server-side validation - all fields required
    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.render('admin/addEmployee', {
        title: 'Add Employee',
        error: 'All fields are required',
        employee: req.body  // Preserve form data for re-display
      });
    }

    // Add employee to store (will throw error if email already exists)
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
    // Handle duplicate email or other errors
    return res.render('admin/addEmployee', {
      title: 'Add Employee',
      error: error.message,
      employee: req.body
    });
  }
});

// GET /admin/employee/edit/:id - Display form pre-filled with employee data
router.get('/employee/edit/:id', isAdmin, (req, res) => {
  const employee = employeeStore.getById(req.params.id);

  // Redirect if employee not found
  if (!employee) {
    return res.redirect('/admin/dashboard');
  }

  res.render('admin/editEmployee', {
    title: 'Edit Employee',
    error: null,
    employee: employee
  });
});

// POST /admin/employee/edit/:id - Process form submission to update employee
router.post('/employee/edit/:id', isAdmin, async (req, res) => {
  try {
    const { name, designation, email, contact, department, joiningDate, location } = req.body;

    // Server-side validation - all fields required
    if (!name || !designation || !email || !contact || !department || !joiningDate || !location) {
      return res.render('admin/editEmployee', {
        title: 'Edit Employee',
        error: 'All fields are required',
        employee: { id: req.params.id, ...req.body }
      });
    }

    // Update employee in store (handles email uniqueness check)
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
    // Handle duplicate email or other errors
    return res.render('admin/editEmployee', {
      title: 'Edit Employee',
      error: error.message,
      employee: { id: req.params.id, ...req.body }
    });
  }
});

// POST /admin/employee/delete/:id - Delete employee and redirect to dashboard
router.post('/employee/delete/:id', isAdmin, async (req, res) => {
  await employeeStore.delete(req.params.id);
  return res.redirect('/admin/dashboard');
});

// GET /admin/logout - Clear auth cookie and redirect to login
router.get('/logout', (req, res) => {
  res.clearCookie('adminToken');
  return res.redirect('/admin/login');
});

module.exports = router;
