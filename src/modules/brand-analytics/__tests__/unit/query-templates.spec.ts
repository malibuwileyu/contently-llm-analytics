import {
  generalTemplates,
  comparisonTemplates,
  recommendationTemplates,
  featureTemplates,
  priceTemplates,
  locationTemplates,
  allQueryTemplates,
} from '../../data/query-templates';

describe('Query Templates', () => {
  test('should have valid general templates', () => {
    expect(generalTemplates).toBeDefined();
    expect(Array.isArray(generalTemplates)).toBe(true);
    expect(generalTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = generalTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('general');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have valid comparison templates', () => {
    expect(comparisonTemplates).toBeDefined();
    expect(Array.isArray(comparisonTemplates)).toBe(true);
    expect(comparisonTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = comparisonTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('comparison');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have valid recommendation templates', () => {
    expect(recommendationTemplates).toBeDefined();
    expect(Array.isArray(recommendationTemplates)).toBe(true);
    expect(recommendationTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = recommendationTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('recommendation');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have valid feature templates', () => {
    expect(featureTemplates).toBeDefined();
    expect(Array.isArray(featureTemplates)).toBe(true);
    expect(featureTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = featureTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('feature');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have valid price templates', () => {
    expect(priceTemplates).toBeDefined();
    expect(Array.isArray(priceTemplates)).toBe(true);
    expect(priceTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = priceTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('price');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have valid location templates', () => {
    expect(locationTemplates).toBeDefined();
    expect(Array.isArray(locationTemplates)).toBe(true);
    expect(locationTemplates.length).toBeGreaterThan(0);

    // Check structure of a template
    const template = locationTemplates[0];
    expect(template).toHaveProperty('template');
    expect(template).toHaveProperty('type');
    expect(template.type).toBe('location');

    // Check that template contains placeholders
    expect(template.template).toContain('{');
    expect(template.template).toContain('}');
  });

  test('should have all templates combined correctly', () => {
    expect(allQueryTemplates).toBeDefined();
    expect(Array.isArray(allQueryTemplates)).toBe(true);

    // All templates should include all template types
    const totalTemplates =
      generalTemplates.length +
      comparisonTemplates.length +
      recommendationTemplates.length +
      featureTemplates.length +
      priceTemplates.length +
      locationTemplates.length;

    expect(allQueryTemplates.length).toBe(totalTemplates);

    // Check that all template types are included
    const types = allQueryTemplates.map(t => t.type);
    expect(types).toContain('general');
    expect(types).toContain('comparison');
    expect(types).toContain('recommendation');
    expect(types).toContain('feature');
    expect(types).toContain('price');
    expect(types).toContain('location');
  });
});
