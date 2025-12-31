const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const employeeStore = require('./utils/employeeStore');
const userStore = require('./utils/userStore');

const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

app.use('/admin', adminRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/', userRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    status: 404
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    status: 500
  });
});

async function startServer() {
  try {
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
