const ADMIN_TOKEN = 'admin_authenticated';
const USER_TOKEN = 'user_authenticated';

function isAdmin(req, res, next) {
  const adminToken = req.cookies.adminToken;

  if (adminToken === ADMIN_TOKEN) {
    return next();
  }

  return res.redirect('/admin/login');
}

function isUser(req, res, next) {
  const userToken = req.cookies.userToken;

  if (userToken) {
    req.user = JSON.parse(userToken);
    return next();
  }

  return res.redirect('/login');
}

function isGuest(req, res, next) {
  const userToken = req.cookies.userToken;

  if (userToken) {
    return res.redirect('/');
  }

  return next();
}

function isAdminGuest(req, res, next) {
  const adminToken = req.cookies.adminToken;

  if (adminToken === ADMIN_TOKEN) {
    return res.redirect('/admin/dashboard');
  }

  return next();
}

module.exports = {
  isAdmin,
  isUser,
  isGuest,
  isAdminGuest,
  ADMIN_TOKEN,
  USER_TOKEN
};
