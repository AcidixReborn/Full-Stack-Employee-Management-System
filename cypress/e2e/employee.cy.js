describe('Employee CRUD Operations', () => {
  beforeEach(() => {
    cy.adminLogin();
  });

  it('should add a new employee', () => {
    cy.fixture('testData').then((data) => {
      cy.contains('+ Add Employee').click();
      cy.url().should('include', '/admin/employee/add');

      cy.get('#name').type(data.newEmployee.name);
      cy.get('#designation').type(data.newEmployee.designation);
      cy.get('#email').type(data.newEmployee.email);
      cy.get('#contact').type(data.newEmployee.contact);
      cy.get('#department').select(data.newEmployee.department);
      cy.get('#joiningDate').type(data.newEmployee.joiningDate);
      cy.get('#location').type(data.newEmployee.location);

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/admin/dashboard');
      cy.contains(data.newEmployee.name).should('be.visible');
    });
  });

  it('should require all fields when adding employee', () => {
    cy.contains('+ Add Employee').click();
    cy.get('#name').should('have.attr', 'required');
    cy.get('#designation').should('have.attr', 'required');
    cy.get('#email').should('have.attr', 'required');
    cy.get('#contact').should('have.attr', 'required');
    cy.get('#department').should('have.attr', 'required');
    cy.get('#joiningDate').should('have.attr', 'required');
    cy.get('#location').should('have.attr', 'required');
  });

  it('should edit an existing employee', () => {
    cy.fixture('testData').then((data) => {
      cy.get('table tbody tr').first().find('a.btn-primary').click();
      cy.url().should('include', '/admin/employee/edit');

      cy.get('#name').clear().type(data.updatedEmployee.name);
      cy.get('#designation').clear().type(data.updatedEmployee.designation);

      cy.get('button[type="submit"]').click();

      cy.url().should('include', '/admin/dashboard');
      cy.contains(data.updatedEmployee.name).should('be.visible');
    });
  });

  it('should navigate back from edit page to dashboard', () => {
    cy.get('table tbody tr').first().find('a.btn-primary').click();
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/admin/dashboard');
  });

  it('should delete an employee', () => {
    cy.get('table tbody tr').then(($rows) => {
      const initialCount = $rows.length;

      cy.get('table tbody tr').last().find('button.btn-danger').click();

      cy.get('table tbody tr').should('have.length', initialCount - 1);
    });
  });

  it('should display employee details in cards', () => {
    cy.get('.card').contains('Designation:').should('be.visible');
    cy.get('.card').contains('Email:').should('be.visible');
    cy.get('.card').contains('Contact:').should('be.visible');
    cy.get('.card').contains('Department:').should('be.visible');
  });
});

describe('Employee API Endpoints', () => {
  it('should get all employees via API', () => {
    cy.request('GET', '/api/employees').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
    });
  });

  it('should get single employee by ID via API', () => {
    cy.request('GET', '/api/employees/1').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('id', 1);
    });
  });

  it('should return 404 for non-existent employee', () => {
    cy.request({
      method: 'GET',
      url: '/api/employees/99999',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body).to.have.property('success', false);
    });
  });

  it('should create a new employee via API', () => {
    const newEmployee = {
      name: 'API Test Employee',
      designation: 'Tester',
      email: `api.test.${Date.now()}@company.com`,
      contact: '+1-111-111-1111',
      department: 'Engineering',
      joiningDate: '2024-01-01',
      location: 'Test City, TC'
    };

    cy.request('POST', '/api/employees', newEmployee).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('name', newEmployee.name);
    });
  });

  it('should update an employee via API', () => {
    cy.request('PUT', '/api/employees/2', {
      name: 'Updated Name Via API'
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('name', 'Updated Name Via API');
    });
  });

  it('should validate email format via API', () => {
    const invalidEmployee = {
      name: 'Test',
      designation: 'Test',
      email: 'invalid-email',
      contact: '+1-111-111-1111',
      department: 'Engineering',
      joiningDate: '2024-01-01',
      location: 'Test'
    };

    cy.request({
      method: 'POST',
      url: '/api/employees',
      body: invalidEmployee,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('error', 'Invalid email format');
    });
  });
});
