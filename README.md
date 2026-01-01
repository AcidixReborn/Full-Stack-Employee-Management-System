# Full-Stack Employee Management System

A comprehensive full-stack web application for managing employee records. Built with Node.js, Express.js, and EJS as part of a Full-Stack Development Program. Features an admin dashboard, user authentication, REST API, and end-to-end testing with Cypress.

## Features

### Admin Panel
- Secure login with cookie-based session management
- Dashboard displaying employee statistics and recent hires
- Full CRUD operations: add, edit, and delete employee records
- View all employees in a sortable table format

### User System
- User registration with input validation
- Secure login with bcrypt password hashing
- Cookie-based session management (24-hour expiry)
- Public employee directory access

### Employee Management
- Complete CRUD operations via web UI and REST API
- Employee fields: name, designation, email, contact, department, joining date, location
- Email uniqueness validation (case-insensitive)
- Data persistence to JSON files using Node.js fs module

### Testing
- 41 Cypress end-to-end tests
- Coverage includes: admin authentication, user authentication, CRUD operations, API endpoints

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 14+ |
| Framework | Express.js | 4.18.2 |
| View Engine | EJS | 3.1.9 |
| Styling | Bootstrap | 5.3.2 |
| Icons | Bootstrap Icons | 1.11.1 |
| Security | bcrypt | 5.1.1 |
| Cookies | cookie-parser | 1.4.6 |
| Testing | Cypress | 13.6.0 |
| Data Storage | JSON files | (Node.js fs module) |

## Project Structure

```
Full-Stack-Employee-Management-System/
├── app.js                    # Express server entry point
├── package.json              # Dependencies and npm scripts
├── cypress.config.js         # Cypress test configuration
├── data/
│   ├── employees.json        # Employee records storage
│   └── users.json            # User accounts storage
├── routes/
│   ├── adminRoutes.js        # Admin panel routes (auth, dashboard, CRUD)
│   ├── userRoutes.js         # User authentication routes (signup, login)
│   └── employeeRoutes.js     # REST API endpoints
├── middleware/
│   └── authMiddleware.js     # Authentication guard middleware
├── utils/
│   ├── employeeStore.js      # Employee data persistence with indexing
│   └── userStore.js          # User data persistence with bcrypt
├── views/
│   ├── admin/                # Admin EJS templates
│   │   ├── login.ejs
│   │   ├── dashboard.ejs
│   │   ├── addEmployee.ejs
│   │   └── editEmployee.ejs
│   ├── user/                 # User EJS templates
│   │   ├── login.ejs
│   │   ├── signup.ejs
│   │   └── directory.ejs
│   ├── partials/             # Reusable components
│   │   ├── header.ejs
│   │   └── footer.ejs
│   └── error.ejs             # Error page template
├── public/
│   └── css/
│       └── styles.css        # Custom Bootstrap-based styling
└── cypress/
    ├── e2e/                  # Test specifications
    │   ├── admin.cy.js
    │   ├── employee.cy.js
    │   └── user.cy.js
    ├── support/              # Custom Cypress commands
    └── fixtures/             # Test data
```

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Full-Stack-Employee-Management-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The application will be available at: **http://localhost:3000**

## Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Users | Create via signup | - |

## Testing

### Run Cypress in interactive mode (Firefox)
```bash
npm run cypress
```

### Run Cypress headless
```bash
npm run test:headless
```

### Run full test suite (starts server automatically)
```bash
npm test
```

## API Endpoints

All API endpoints are available at `/api/employees` and return JSON responses.

### Get All Employees
```
GET /api/employees

Response: {
  "success": true,
  "count": 20,
  "data": [...]
}
```

### Get Employee by ID
```
GET /api/employees/:id

Response: {
  "success": true,
  "data": { "id": 1, "name": "...", ... }
}
```

### Create Employee
```
POST /api/employees
Content-Type: application/json

Body: {
  "name": "John Doe",
  "designation": "Software Engineer",
  "email": "john@company.com",
  "contact": "+1-555-0123",
  "department": "Engineering",
  "joiningDate": "2024-01-15",
  "location": "New York, NY"
}

Response: {
  "success": true,
  "data": { "id": 21, ... }
}
```

### Update Employee
```
PUT /api/employees/:id
Content-Type: application/json

Body: {
  "designation": "Senior Software Engineer"
}

Response: {
  "success": true,
  "data": { ... }
}
```

### Delete Employee
```
DELETE /api/employees/:id

Response: {
  "success": true,
  "message": "Employee deleted successfully"
}
```

### HTTP Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 500 | Server Error |

## Application Routes

### Public Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Employee directory |
| GET | `/signup` | User registration form |
| POST | `/signup` | Process registration |
| GET | `/login` | User login form |
| POST | `/login` | Process login |
| GET | `/logout` | Logout user |

### Admin Routes (require authentication)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/admin/login` | Admin login page |
| POST | `/admin/login` | Process admin login |
| GET | `/admin/dashboard` | Admin dashboard |
| GET | `/admin/employee/add` | Add employee form |
| POST | `/admin/employee/add` | Create employee |
| GET | `/admin/employee/edit/:id` | Edit employee form |
| POST | `/admin/employee/edit/:id` | Update employee |
| POST | `/admin/employee/delete/:id` | Delete employee |
| GET | `/admin/logout` | Logout admin |

## How It Works

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│                    HTTP Requests/Responses                       │
├─────────────────────────────────────────────────────────────────┤
│                      Express.js Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Middleware │──│   Routes    │──│    EJS View Engine      │  │
│  │  (Auth,     │  │  (Admin,    │  │    (Server-Side         │  │
│  │   Parser)   │  │   User,     │  │     Rendering)          │  │
│  │             │  │   API)      │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                          │                                       │
│                 ┌────────┴────────┐                              │
│                 │   Data Stores   │                              │
│                 │  (In-Memory +   │                              │
│                 │   JSON Files)   │                              │
│                 └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: Browser sends HTTP request (form submission or API call)
2. **Middleware Processing**: Express middleware parses cookies, JSON, and URL-encoded data
3. **Authentication Check**: Auth middleware verifies session cookies for protected routes
4. **Route Handler**: Appropriate route handler processes the request
5. **Data Layer**: Store utilities manage CRUD operations with JSON persistence
6. **Response**: EJS renders HTML template or API returns JSON response

### Authentication System

- **Cookie-based Sessions**: Authentication state stored in httpOnly cookies
- **Admin Token**: Static token string validates admin sessions
- **User Token**: JSON-encoded user data stored in cookie
- **Password Security**: User passwords hashed with bcrypt (10 salt rounds)
- **Session Expiry**: Cookies expire after 24 hours

### Data Persistence

- **Storage Format**: JSON files in the `data/` directory
- **In-Memory Caching**: Data loaded into memory at startup for fast access
- **Indexing**: Map-based indexes for O(1) lookups by ID and email/username
- **Debounced Writes**: File saves debounced (100ms) to prevent excessive disk I/O
- **Uniqueness Enforcement**: Email and username uniqueness validated case-insensitively

### Middleware Stack

1. `express.json()` - Parse JSON request bodies
2. `express.urlencoded()` - Parse form data
3. `cookieParser()` - Parse cookies for authentication
4. `express.static()` - Serve static files (CSS, images)
5. Custom logging middleware - Log requests with timestamps
6. Auth middleware - Protect routes based on authentication status

## File Descriptions

| File | Description |
|------|-------------|
| `app.js` | Main application entry point. Configures Express, middleware, routes, and error handlers. |
| `routes/adminRoutes.js` | Admin panel routes including login, dashboard, and employee CRUD via forms. |
| `routes/userRoutes.js` | User authentication routes (signup, login, logout) and public directory. |
| `routes/employeeRoutes.js` | RESTful API endpoints for employee CRUD operations. |
| `middleware/authMiddleware.js` | Authentication guards: isAdmin, isUser, isGuest, isAdminGuest. |
| `utils/employeeStore.js` | Employee data persistence with in-memory caching and JSON file storage. |
| `utils/userStore.js` | User data persistence with bcrypt password hashing. |
| `cypress.config.js` | Cypress test runner configuration. |

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start with auto-reload (--watch flag) |
| `npm run cypress` | Open Cypress in interactive mode |
| `npm run cypress:run` | Run Cypress tests headlessly |
| `npm test` | Start server and run Cypress tests |
| `npm run test:headless` | Start server and run headless tests |

## License

This project was created as part of a Full-Stack Development Program educational course.
