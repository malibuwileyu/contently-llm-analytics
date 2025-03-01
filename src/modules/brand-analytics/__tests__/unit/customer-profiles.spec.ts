import {
  customerProfiles,
  getCustomerById,
  getCustomersByInterest,
  generatePersonalizedQueries,
} from '../../data/customer-profiles';

describe('Customer Profiles', () => {
  test('should have valid customer profiles data', () => {
    expect(customerProfiles).toBeDefined();
    expect(Array.isArray(customerProfiles)).toBe(true);
    expect(customerProfiles.length).toBeGreaterThan(0);

    // Check structure of a customer profile
    const profile = customerProfiles[0];
    expect(profile).toHaveProperty('id');
    expect(profile).toHaveProperty('name');
    expect(profile).toHaveProperty('interests');
    expect(profile).toHaveProperty('persona');

    // Check that interests is an array
    expect(Array.isArray(profile.interests)).toBe(true);
    expect(profile.interests.length).toBeGreaterThan(0);

    // Check structure of an interest
    const interest = profile.interests[0];
    expect(interest).toHaveProperty('category');
    expect(interest).toHaveProperty('level');
  });

  test('should get customer by ID correctly', () => {
    // Test with valid ID
    const customer = getCustomerById('customer_1');
    expect(customer).toBeDefined();
    expect(customer?.id).toBe('customer_1');

    // Test with invalid ID
    const nonExistentCustomer = getCustomerById('nonexistent_id');
    expect(nonExistentCustomer).toBeUndefined();
  });

  test('should get customers by interest correctly', () => {
    // Test with valid category
    const runningShoeCustomers = getCustomersByInterest('Running Shoes');
    expect(runningShoeCustomers).toBeDefined();
    expect(Array.isArray(runningShoeCustomers)).toBe(true);
    expect(runningShoeCustomers.length).toBeGreaterThan(0);

    // Test with valid category and interest level
    const highInterestCustomers = getCustomersByInterest(
      'Running Shoes',
      'high',
    );
    expect(highInterestCustomers).toBeDefined();
    expect(Array.isArray(highInterestCustomers)).toBe(true);

    // All returned customers should have high interest in running shoes
    highInterestCustomers.forEach(customer => {
      const interest = customer.interests.find(
        i => i.category === 'Running Shoes',
      );
      expect(interest).toBeDefined();
      expect(interest?.level).toBe('high');
    });

    // Test with invalid category
    const nonExistentCategoryCustomers = getCustomersByInterest(
      'NonExistentCategory',
    );
    expect(nonExistentCategoryCustomers).toEqual([]);
  });

  test('should generate personalized queries correctly', () => {
    // Test with valid customer ID
    const queries = generatePersonalizedQueries('customer_1', 3);
    expect(queries).toBeDefined();
    expect(Array.isArray(queries)).toBe(true);
    expect(queries.length).toBeGreaterThanOrEqual(3);

    // Queries should be strings
    queries.forEach(query => {
      expect(typeof query).toBe('string');
      expect(query.length).toBeGreaterThan(0);
    });

    // Test with invalid customer ID
    const emptyQueries = generatePersonalizedQueries('nonexistent_id', 3);
    expect(emptyQueries).toEqual([]);
  });
});
