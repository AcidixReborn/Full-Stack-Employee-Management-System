Cypress.Commands.add('adminLogin', () => {
  cy.visit('/admin/login');
  cy.get('#username').type('admin');
  cy.get('#password').type('admin123');
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/admin/dashboard');
});

Cypress.Commands.add('adminLogout', () => {
  cy.visit('/admin/logout');
  cy.url().should('include', '/admin/login');
});

Cypress.Commands.add('userSignup', (username, password) => {
  cy.visit('/signup');
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('#confirmPassword').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('userLogin', (username, password) => {
  cy.visit('/login');
  cy.get('#username').type(username);
  cy.get('#password').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('userLogout', () => {
  cy.visit('/logout');
});
