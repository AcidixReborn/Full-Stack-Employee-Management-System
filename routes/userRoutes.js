/**
 * userRoutes.js - User Authentication and Public Routes
 *
 * Handles user registration, login/logout, and the public employee directory.
 * Uses cookie-based sessions with bcrypt password hashing via userStore.
 */

const express = require('express');
const router = express.Router();
const { isUser, isGuest } = require('../middleware/authMiddleware');
const employeeStore = require('../utils/employeeStore');
const userStore = require('../utils/userStore');

/**
 * PUBLIC ROUTES
 * Accessible to all users (authenticated or not)
 */

// GET / - Display employee directory (public homepage)
router.get('/', (req, res) => {
  const employees = employeeStore.getAll();
  const userToken = req.cookies.userToken;
  let user = null;

  // Parse user token if present to show logout button
  if (userToken) {
    try {
      user = JSON.parse(userToken);
    } catch (e) {
      user = null;  // Invalid token, treat as guest
    }
  }

  res.render('user/directory', {
    title: 'Employee Directory',
    employees: employees,
    user: user  // Pass user for conditional UI (show logout if logged in)
  });
});

/**
 * USER REGISTRATION ROUTES
 * Signup flow with validation and password hashing
 */

// GET /signup - Display registration form (redirect if already logged in)
router.get('/signup', isGuest, (req, res) => {
  res.render('user/signup', {
    title: 'Sign Up',
    error: null
  });
});

// POST /signup - Process registration with validation
router.post('/signup', isGuest, async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    // Validation: Required fields
    if (!username || !password) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Username and password are required'
      });
    }

    // Validation: Username minimum length
    if (username.length < 3) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Username must be at least 3 characters'
      });
    }

    // Validation: Password minimum length
    if (password.length < 6) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Password must be at least 6 characters'
      });
    }

    // Validation: Password confirmation match
    if (password !== confirmPassword) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Passwords do not match'
      });
    }

    // Create user (password hashed in userStore with bcrypt)
    const user = await userStore.create(username, password);

    // Set session cookie and redirect to directory
    res.cookie('userToken', JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    });

    return res.redirect('/');
  } catch (error) {
    // Handle duplicate username or other errors
    return res.render('user/signup', {
      title: 'Sign Up',
      error: error.message
    });
  }
});

/**
 * USER LOGIN/LOGOUT ROUTES
 * Authentication with bcrypt password verification
 */

// GET /login - Display login form (redirect if already logged in)
router.get('/login', isGuest, (req, res) => {
  res.render('user/login', {
    title: 'User Login',
    error: null
  });
});

// POST /login - Authenticate user credentials
router.post('/login', isGuest, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation: Required fields
    if (!username || !password) {
      return res.render('user/login', {
        title: 'User Login',
        error: 'Username and password are required'
      });
    }

    // Authenticate via userStore (bcrypt comparison)
    const user = await userStore.authenticate(username, password);

    if (!user) {
      return res.render('user/login', {
        title: 'User Login',
        error: 'Invalid username or password'
      });
    }

    // Set session cookie and redirect to directory
    res.cookie('userToken', JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000  // 24 hours
    });

    return res.redirect('/');
  } catch (error) {
    return res.render('user/login', {
      title: 'User Login',
      error: 'An error occurred during login'
    });
  }
});

// GET /logout - Clear session cookie and redirect to directory
router.get('/logout', (req, res) => {
  res.clearCookie('userToken');
  return res.redirect('/');
});

module.exports = router;
