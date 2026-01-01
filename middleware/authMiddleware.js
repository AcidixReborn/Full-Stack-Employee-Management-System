/**
 * authMiddleware.js - Authentication Guard Middleware
 *
 * Provides middleware functions to protect routes based on authentication status.
 * Uses cookie-based tokens for session management.
 *
 * Middleware Functions:
 * - isAdmin: Requires admin authentication
 * - isUser: Requires user authentication
 * - isGuest: Requires NOT being authenticated (for login/signup pages)
 * - isAdminGuest: Requires NOT being admin authenticated
 */

// Token values stored in cookies to indicate authenticated state
const ADMIN_TOKEN = 'admin_authenticated';  // Static token for admin sessions
const USER_TOKEN = 'user_authenticated';     // Not actively used (user token is JSON)

/**
 * isAdmin - Protect admin routes
 * Checks for valid admin token in cookies.
 * Redirects to login page if not authenticated.
 */
function isAdmin(req, res, next) {
  const adminToken = req.cookies.adminToken;

  if (adminToken === ADMIN_TOKEN) {
    return next();  // Authenticated, proceed to route handler
  }

  return res.redirect('/admin/login');  // Not authenticated, redirect to login
}

/**
 * isUser - Protect user-only routes
 * Checks for user token cookie and parses user data.
 * Attaches user object to req.user for use in route handlers.
 */
function isUser(req, res, next) {
  const userToken = req.cookies.userToken;

  if (userToken) {
    req.user = JSON.parse(userToken);  // Parse JSON token to get user data
    return next();
  }

  return res.redirect('/login');  // Not authenticated, redirect to login
}

/**
 * isGuest - Restrict access for authenticated users
 * Used on login/signup pages to redirect already logged-in users.
 * Prevents authenticated users from seeing auth forms.
 */
function isGuest(req, res, next) {
  const userToken = req.cookies.userToken;

  if (userToken) {
    return res.redirect('/');  // Already authenticated, redirect to home
  }

  return next();  // Not authenticated, proceed to show login/signup
}

/**
 * isAdminGuest - Restrict access for authenticated admins
 * Used on admin login page to redirect already logged-in admins.
 * Prevents admins from seeing login form when already authenticated.
 */
function isAdminGuest(req, res, next) {
  const adminToken = req.cookies.adminToken;

  if (adminToken === ADMIN_TOKEN) {
    return res.redirect('/admin/dashboard');  // Already admin, redirect to dashboard
  }

  return next();  // Not admin, proceed to show login form
}

module.exports = {
  isAdmin,
  isUser,
  isGuest,
  isAdminGuest,
  ADMIN_TOKEN,
  USER_TOKEN
};
