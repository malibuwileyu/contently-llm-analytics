import {
  businessCategories,
  getFlattenedBusinessCategories,
  competitors,
  getAllCompetitors,
  getCompetitorsByCategory,
  placeholderValues,
  getPlaceholderValues,
  getRandomPlaceholderValue,
  fillTemplateWithRandomValues,
  generatedQueries,
  allQueries,
} from '../../data';

describe('Brand Analytics Seed Data', () => {
  describe('Business Categories', () => {
    test('should have valid business categories data', () => {
      expect(businessCategories).toBeDefined();
      expect(Array.isArray(businessCategories)).toBe(true);
      expect(businessCategories.length).toBeGreaterThan(0);

      // Check structure of a business category
      const category = businessCategories[0];
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('keywords');
      expect(category).toHaveProperty('synonyms');

      // Check that keywords and synonyms are arrays
      expect(Array.isArray(category.keywords)).toBe(true);
      expect(Array.isArray(category.synonyms)).toBe(true);
    });

    test('should flatten business categories correctly', () => {
      const flattened = getFlattenedBusinessCategories();
      expect(flattened).toBeDefined();
      expect(Array.isArray(flattened)).toBe(true);

      // Flattened array should be longer than original (includes subcategories)
      expect(flattened.length).toBeGreaterThan(businessCategories.length);

      // Check that subcategories have parent references
      const subcategories = flattened.filter(cat => cat.parentCategory);
      expect(subcategories.length).toBeGreaterThan(0);

      // Verify parent-child relationships
      const athleticShoes = flattened.find(
        cat => cat.name === 'Athletic Shoes',
      );
      const runningShoes = flattened.find(cat => cat.name === 'Running Shoes');

      expect(athleticShoes).toBeDefined();
      expect(runningShoes).toBeDefined();
      expect(runningShoes?.parentCategory).toBe('Athletic Shoes');
    });
  });

  describe('Competitors', () => {
    test('should have valid competitors data', () => {
      expect(competitors).toBeDefined();
      expect(typeof competitors).toBe('object');

      // Check that competitors are organized by category
      const categories = Object.keys(competitors);
      expect(categories.length).toBeGreaterThan(0);

      // Check structure of competitors
      const categoryCompetitors = competitors[categories[0]];
      expect(Array.isArray(categoryCompetitors)).toBe(true);
      expect(categoryCompetitors.length).toBeGreaterThan(0);

      const competitor = categoryCompetitors[0];
      expect(competitor).toHaveProperty('name');
      expect(competitor).toHaveProperty('description');
      expect(competitor).toHaveProperty('website');
      expect(competitor).toHaveProperty('businessCategory');
    });

    test('should get all competitors correctly', () => {
      const allCompetitors = getAllCompetitors();
      expect(allCompetitors).toBeDefined();
      expect(Array.isArray(allCompetitors)).toBe(true);
      expect(allCompetitors.length).toBeGreaterThan(0);

      // Total competitors should match sum of all categories
      const totalFromCategories = Object.values(competitors).reduce(
        (sum, categoryCompetitors) => sum + categoryCompetitors.length,
        0,
      );

      expect(allCompetitors.length).toBe(totalFromCategories);
    });

    test('should get competitors by category correctly', () => {
      // Test with valid category
      const athleticShoeCompetitors =
        getCompetitorsByCategory('Athletic Shoes');
      expect(athleticShoeCompetitors).toBeDefined();
      expect(Array.isArray(athleticShoeCompetitors)).toBe(true);
      expect(athleticShoeCompetitors.length).toBeGreaterThan(0);

      // Test with invalid category
      const nonExistentCompetitors = getCompetitorsByCategory(
        'NonExistentCategory',
      );
      expect(nonExistentCompetitors).toEqual([]);
    });
  });

  describe('Placeholder Values', () => {
    test('should have valid placeholder values', () => {
      expect(placeholderValues).toBeDefined();
      expect(typeof placeholderValues).toBe('object');

      // Check structure of placeholder values
      const placeholderCategories = Object.keys(placeholderValues);
      expect(placeholderCategories.length).toBeGreaterThan(0);

      const category = placeholderValues[placeholderCategories[0]];
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('values');
      expect(Array.isArray(category.values)).toBe(true);
      expect(category.values.length).toBeGreaterThan(0);
    });

    test('should get placeholder values correctly', () => {
      // Test with valid placeholder
      const categoryValues = getPlaceholderValues('category');
      expect(categoryValues).toBeDefined();
      expect(Array.isArray(categoryValues)).toBe(true);
      expect(categoryValues.length).toBeGreaterThan(0);

      // Test with invalid placeholder
      const nonExistentValues = getPlaceholderValues('nonExistentPlaceholder');
      expect(nonExistentValues).toEqual([]);
    });

    test('should get random placeholder value correctly', () => {
      // Test with valid placeholder
      const randomCategoryValue = getRandomPlaceholderValue('category');
      expect(randomCategoryValue).toBeDefined();
      expect(typeof randomCategoryValue).toBe('string');

      const categoryValues = getPlaceholderValues('category');
      expect(categoryValues).toContain(randomCategoryValue);

      // Test with invalid placeholder
      const nonExistentValue = getRandomPlaceholderValue(
        'nonExistentPlaceholder',
      );
      expect(nonExistentValue).toBeUndefined();
    });

    test('should fill template with random values correctly', () => {
      const template = 'What is the best {category} for {use_case}?';

      const filled = fillTemplateWithRandomValues(template);
      expect(filled).toBeDefined();
      expect(typeof filled).toBe('string');
      expect(filled).not.toContain('{category}');
      expect(filled).not.toContain('{use_case}');

      // Test with required placeholders that exist
      const filledWithRequired = fillTemplateWithRandomValues(template, [
        'category',
        'use_case',
      ]);
      expect(filledWithRequired).toBeDefined();
      expect(filledWithRequired).not.toContain('{category}');
      expect(filledWithRequired).not.toContain('{use_case}');

      // Test with required placeholders that don't exist
      const emptyResult = fillTemplateWithRandomValues(
        'What is {nonExistentPlaceholder}?',
        ['nonExistentPlaceholder'],
      );
      // The function should return empty string if a required placeholder doesn't have a value
      expect(emptyResult).toBe('');
    });
  });

  describe('Generated Queries', () => {
    test('should have valid generated queries', () => {
      expect(generatedQueries).toBeDefined();
      expect(Array.isArray(generatedQueries)).toBe(true);
      expect(generatedQueries.length).toBeGreaterThan(0);

      // Check structure of a generated query
      const query = generatedQueries[0];
      expect(query).toHaveProperty('id');
      expect(query).toHaveProperty('text');
      expect(query).toHaveProperty('type');
      expect(query).toHaveProperty('createdAt');

      // Check that createdAt is a Date
      expect(query.createdAt instanceof Date).toBe(true);
    });

    test('should have all queries combined correctly', () => {
      expect(allQueries).toBeDefined();
      expect(Array.isArray(allQueries)).toBe(true);

      // All queries should include generated queries
      expect(allQueries.length).toBeGreaterThanOrEqual(generatedQueries.length);

      // Check that all generated queries are included
      const generatedIds = generatedQueries.map(q => q.id);
      const allIds = allQueries.map(q => q.id);

      generatedIds.forEach(id => {
        expect(allIds).toContain(id);
      });
    });
  });
});
