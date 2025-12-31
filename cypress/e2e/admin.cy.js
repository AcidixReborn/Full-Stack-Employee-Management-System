describe('Admin Authentication', () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it('should display admin login page', () => {
    cy.visit('/admin/login');
    cy.contains('Admin Login').should('be.visible');
    cy.get('#username').should('be.visible');
    cy.get('#password').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Login');
  });

  it('should show error with invalid credentials', () => {
    cy.visit('/admin/login');
    cy.get('#username').type('wronguser');
    cy.get('#password').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid username or password').should('be.visible');
    cy.url().should('include', '/admin/login');
  });

  it('should login successfully with valid credentials', () => {
    cy.adminLogin();
    cy.contains('Welcome, Admin!').should('be.visible');
    cy.contains('Total Employees').should('be.visible');
  });

  it('should redirect to login if accessing dashboard without auth', () => {
    cy.visit('/admin/dashboard');
    cy.url().should('include', '/admin/login');
  });

  it('should logout successfully', () => {
    cy.adminLogin();
    cy.contains('Logout').click();
    cy.url().should('include', '/admin/login');
  });

  it('should redirect logged-in admin away from login page', () => {
    cy.adminLogin();
    cy.visit('/admin/login');
    cy.url().should('include', '/admin/dashboard');
  });
});

describe('Admin Dashboard', () => {
  beforeEach(() => {
    cy.adminLogin();
  });

  it('should display employee count', () => {
    cy.contains('Total Employees:').should('be.visible');
  });

  it('should display Add Employee button', () => {
    cy.contains('+ Add Employee').should('be.visible');
  });

  it('should display recent employees section', () => {
    cy.contains('Recent Employees').should('be.visible');
  });

  it('should display all employees table', () => {
    cy.contains('All Employees').should('be.visible');
    cy.get('table').should('be.visible');
    cy.get('table thead th').should('have.length', 9);
  });

  it('should navigate to Add Employee page', () => {
    cy.contains('+ Add Employee').click();
    cy.url().should('include', '/admin/employee/add');
    cy.contains('Add Employee').should('be.visible');
  });
});
