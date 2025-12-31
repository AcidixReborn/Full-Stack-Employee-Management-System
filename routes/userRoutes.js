const express = require('express');
const router = express.Router();
const { isUser, isGuest } = require('../middleware/authMiddleware');
const employeeStore = require('../utils/employeeStore');
const userStore = require('../utils/userStore');

router.get('/', (req, res) => {
  const employees = employeeStore.getAll();
  const userToken = req.cookies.userToken;
  let user = null;

  if (userToken) {
    try {
      user = JSON.parse(userToken);
    } catch (e) {
      user = null;
    }
  }

  res.render('user/directory', {
    title: 'Employee Directory',
    employees: employees,
    user: user
  });
});

router.get('/signup', isGuest, (req, res) => {
  res.render('user/signup', {
    title: 'Sign Up',
    error: null
  });
});

router.post('/signup', isGuest, async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;

    if (!username || !password) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Username and password are required'
      });
    }

    if (username.length < 3) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 6) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Password must be at least 6 characters'
      });
    }

    if (password !== confirmPassword) {
      return res.render('user/signup', {
        title: 'Sign Up',
        error: 'Passwords do not match'
      });
    }

    const user = await userStore.create(username, password);

    res.cookie('userToken', JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.redirect('/');
  } catch (error) {
    return res.render('user/signup', {
      title: 'Sign Up',
      error: error.message
    });
  }
});

router.get('/login', isGuest, (req, res) => {
  res.render('user/login', {
    title: 'User Login',
    error: null
  });
});

router.post('/login', isGuest, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('user/login', {
        title: 'User Login',
        error: 'Username and password are required'
      });
    }

    const user = await userStore.authenticate(username, password);

    if (!user) {
      return res.render('user/login', {
        title: 'User Login',
        error: 'Invalid username or password'
      });
    }

    res.cookie('userToken', JSON.stringify({ id: user.id, username: user.username }), {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    return res.redirect('/');
  } catch (error) {
    return res.render('user/login', {
      title: 'User Login',
      error: 'An error occurred during login'
    });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('userToken');
  return res.redirect('/');
});

module.exports = router;
