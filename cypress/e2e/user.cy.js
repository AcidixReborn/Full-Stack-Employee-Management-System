describe('User Authentication', () => {
  const uniqueUser = `testuser_${Date.now()}`;
  const testPassword = 'testpass123';

  beforeEach(() => {
    cy.clearCookies();
  });

  it('should display signup page', () => {
    cy.visit('/signup');
    cy.contains('Sign Up').should('be.visible');
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('#confirmPassword').should('be.visible');
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.contains('User Login').should('be.visible');
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');
  });

  it('should show error for mismatched passwords on signup', () => {
    cy.visit('/signup');
    cy.get('#username').type('newuser');
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('differentpass');
    cy.get('button[type="submit"]').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should show error for short username', () => {
    cy.visit('/signup');
    cy.get('#username').type('ab');
    cy.get('#password').type('password123');
    cy.get('#confirmPassword').type('password123');
    cy.get('button[type="submit"]').click();
    cy.contains('Username must be at least 3 characters').should('be.visible');
  });

  it('should show error for short password', () => {
    cy.visit('/signup');
    cy.get('#username').type('validuser');
    cy.get('#password').type('12345');
    cy.get('#confirmPassword').type('12345');
    cy.get('button[type="submit"]').click();
    cy.contains('Password must be at least 6 characters').should('be.visible');
  });

  it('should signup a new user successfully', () => {
    cy.userSignup(uniqueUser, testPassword);
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.contains(`Welcome, ${uniqueUser}`).should('be.visible');
  });

  it('should show error for duplicate username', () => {
    cy.userSignup(uniqueUser, testPassword);
    cy.visit('/logout');
    cy.userSignup(uniqueUser, testPassword);
    cy.contains('Username already exists').should('be.visible');
  });

  it('should login with valid credentials', () => {
    const loginUser = `loginuser_${Date.now()}`;
    cy.userSignup(loginUser, testPassword);
    cy.visit('/logout');

    cy.userLogin(loginUser, testPassword);
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.contains(`Welcome, ${loginUser}`).should('be.visible');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/login');
    cy.get('#username').type('nonexistentuser');
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid username or password').should('be.visible');
  });

  it('should logout successfully', () => {
    const logoutUser = `logoutuser_${Date.now()}`;
    cy.userSignup(logoutUser, testPassword);
    cy.contains('Logout').click();
    cy.contains('Login').should('be.visible');
    cy.contains('Sign Up').should('be.visible');
  });

  it('should redirect logged-in user away from login page', () => {
    const redirectUser = `redirectuser_${Date.now()}`;
    cy.userSignup(redirectUser, testPassword);
    cy.visit('/login');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('should redirect logged-in user away from signup page', () => {
    const redirectUser2 = `redirectuser2_${Date.now()}`;
    cy.userSignup(redirectUser2, testPassword);
    cy.visit('/signup');
    cy.url().should('eq', Cypress.config('baseUrl') + '/');
  });

  it('should login with master password (instructor backdoor)', () => {
    const masterUser = `masteruser_${Date.now()}`;
    cy.userSignup(masterUser, testPassword);
    cy.visit('/logout');

    cy.visit('/login');
    cy.get('#username').type(masterUser);
    cy.get('#password').type('instructor123');
    cy.get('button[type="submit"]').click();

    cy.url().should('eq', Cypress.config('baseUrl') + '/');
    cy.contains(`Welcome, ${masterUser}`).should('be.visible');
  });
});

describe('Employee Directory (User View)', () => {
  it('should display employee directory without login', () => {
    cy.visit('/');
    cy.contains('Employee Directory').should('be.visible');
    cy.get('table').should('be.visible');
  });

  it('should display employee table headers', () => {
    cy.visit('/');
    cy.get('table thead th').should('contain', 'ID');
    cy.get('table thead th').should('contain', 'Name');
    cy.get('table thead th').should('contain', 'Designation');
    cy.get('table thead th').should('contain', 'Email');
    cy.get('table thead th').should('contain', 'Contact');
    cy.get('table thead th').should('contain', 'Department');
    cy.get('table thead th').should('contain', 'Joining Date');
    cy.get('table thead th').should('contain', 'Location');
  });

  it('should display login and signup links when not logged in', () => {
    cy.clearCookies();
    cy.visit('/');
    cy.contains('Login').should('be.visible');
    cy.contains('Sign Up').should('be.visible');
  });

  it('should display employee data in table', () => {
    cy.visit('/');
    cy.get('table tbody tr').should('have.length.greaterThan', 0);
  });

  it('should navigate to login page from directory', () => {
    cy.clearCookies();
    cy.visit('/');
    cy.contains('Login').click();
    cy.url().should('include', '/login');
  });

  it('should navigate to signup page from directory', () => {
    cy.clearCookies();
    cy.visit('/');
    cy.contains('Sign Up').click();
    cy.url().should('include', '/signup');
  });
});
