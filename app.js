/**
 * app.js - Main Express Application Entry Point
 *
 * This file initializes and configures the Express server, sets up middleware,
 * mounts route handlers, and starts the application.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

// Data store utilities for managing employee and user data persistence
const employeeStore = require('./utils/employeeStore');
const userStore = require('./utils/userStore');

// Route handlers for different parts of the application
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// View Engine Configuration - EJS for server-side rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/**
 * Middleware Stack Configuration
 * Order matters: parsers first, then static files, then logging
 */
app.use(express.json());                                    // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));            // Parse URL-encoded form data
app.use(cookieParser());                                    // Parse cookies for authentication
app.use(express.static(path.join(__dirname, 'public')));    // Serve static files (CSS, images)

// Request logging middleware - logs timestamp, HTTP method, and URL for debugging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

/**
 * Route Mounting
 * - /admin/*         -> Admin panel (login, dashboard, employee management)
 * - /api/employees/* -> REST API endpoints for CRUD operations
 * - /*               -> Public routes (directory, user auth)
 */
app.use('/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/', userRoutes);

// 404 Error Handler - catches all unmatched routes
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    status: 404
  });
});

// Global Error Handler - catches all uncaught errors in route handlers
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    status: 500
  });
});

/**
 * Server Initialization
 * Initializes data stores before starting the HTTP server.
 * Data stores load JSON files into memory for fast access.
 */
async function startServer() {
  try {
    // Initialize data stores - loads JSON files and builds indexes
    await employeeStore.init();
    await userStore.init();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Admin login: http://localhost:${PORT}/admin/login`);
      console.log(`User signup: http://localhost:${PORT}/signup`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
