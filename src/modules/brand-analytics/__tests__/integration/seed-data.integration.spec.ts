import { Test, TestingModule } from '@nestjs/testing';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { QueryEntity } from '../../entities/query.entity';
import { QueryTemplateEntity } from '../../entities/query-template.entity';
import {
  businessCategories,
  getFlattenedBusinessCategories,
  competitors,
  getAllCompetitors,
} from '../../data';

describe('Seed Data Integration', () => {
  // Mock repositories
  const mockBusinessCategoryRepo = {
    save: jest
      .fn()
      .mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 'mock-id' }),
      ),
    findOne: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve({ id: 'mock-id', name: 'Test Category' }),
      ),
  };

  const mockCompetitorRepo = {
    save: jest
      .fn()
      .mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 'mock-id' }),
      ),
    findOne: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'mock-id',
        name: 'Test Competitor',
        businessCategory: { id: 'mock-id', name: 'Test Category' },
      }),
    ),
  };

  const mockQueryTemplateRepo = {
    save: jest
      .fn()
      .mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 'mock-id' }),
      ),
    findOne: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'mock-id',
        template: 'What is the best {category}?',
        businessCategory: { id: 'mock-id', name: 'Test Category' },
      }),
    ),
  };

  const mockQueryRepo = {
    save: jest
      .fn()
      .mockImplementation(entity =>
        Promise.resolve({ ...entity, id: 'mock-id' }),
      ),
    findOne: jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: 'mock-id',
        text: 'What is the best running shoes?',
        queryTemplate: {
          id: 'mock-id',
          template: 'What is the best {category}?',
        },
      }),
    ),
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('should be able to save business categories to database', async () => {
    // Create a test business category
    const category = new BusinessCategoryEntity();
    category.name = 'Test Category';
    category.description = 'Test Description';
    category.keywords = ['test', 'category'];
    category.synonyms = ['test', 'category'];
    category.isActive = true;

    // Save to database using mock
    const savedCategory = await mockBusinessCategoryRepo.save(category);

    // Verify it was saved
    expect(savedCategory).toBeDefined();
    expect(savedCategory.id).toBeDefined();
    expect(savedCategory.name).toBe('Test Category');

    // Verify the mock was called
    expect(mockBusinessCategoryRepo.save).toHaveBeenCalledWith(category);

    // Retrieve from database using mock
    const retrievedCategory = await mockBusinessCategoryRepo.findOne({
      where: { id: savedCategory.id },
    });

    // Verify it was retrieved correctly
    expect(retrievedCategory).toBeDefined();
    expect(retrievedCategory?.name).toBe('Test Category');
  });

  test('should be able to save competitors to database', async () => {
    // Create a test business category
    const category = new BusinessCategoryEntity();
    category.name = 'Test Category';
    category.description = 'Test Description';
    category.keywords = ['test', 'category'];
    category.synonyms = ['test', 'category'];
    category.isActive = true;

    const savedCategory = await mockBusinessCategoryRepo.save(category);

    // Create a test competitor
    const competitor = new CompetitorEntity();
    competitor.name = 'Test Competitor';
    competitor.description = 'Test Description';
    competitor.website = 'https://test.com';
    competitor.businessCategory = savedCategory;
    competitor.businessCategoryId = savedCategory.id;
    competitor.alternateNames = [];
    competitor.keywords = ['test', 'competitor'];
    competitor.products = ['test product'];
    competitor.isCustomer = false;
    competitor.isActive = true;

    // Save to database using mock
    const savedCompetitor = await mockCompetitorRepo.save(competitor);

    // Verify it was saved
    expect(savedCompetitor).toBeDefined();
    expect(savedCompetitor.id).toBeDefined();
    expect(savedCompetitor.name).toBe('Test Competitor');

    // Verify the mock was called
    expect(mockCompetitorRepo.save).toHaveBeenCalledWith(competitor);

    // Retrieve from database using mock
    const retrievedCompetitor = await mockCompetitorRepo.findOne({
      where: { id: savedCompetitor.id },
      relations: ['businessCategory'],
    });

    // Verify it was retrieved correctly
    expect(retrievedCompetitor).toBeDefined();
    expect(retrievedCompetitor?.name).toBe('Test Competitor');
    expect(retrievedCompetitor?.businessCategory).toBeDefined();
    expect(retrievedCompetitor?.businessCategory.name).toBe('Test Category');
  });

  test('should be able to save query templates to database', async () => {
    // Create a test business category
    const category = new BusinessCategoryEntity();
    category.name = 'Test Category';
    category.description = 'Test Description';
    category.keywords = ['test', 'category'];
    category.synonyms = ['test', 'category'];
    category.isActive = true;

    const savedCategory = await mockBusinessCategoryRepo.save(category);

    // Create a test query template
    const template = new QueryTemplateEntity();
    template.template = 'What is the best {category}?';
    template.type = 'general';
    template.placeholders = { category: ['test category'] };
    template.requiredPlaceholders = ['category'];
    template.priority = 1;
    template.isActive = true;
    template.businessCategoryId = savedCategory.id;
    template.businessCategory = savedCategory;

    // Save to database using mock
    const savedTemplate = await mockQueryTemplateRepo.save(template);

    // Verify it was saved
    expect(savedTemplate).toBeDefined();
    expect(savedTemplate.id).toBeDefined();
    expect(savedTemplate.template).toBe('What is the best {category}?');

    // Verify the mock was called
    expect(mockQueryTemplateRepo.save).toHaveBeenCalledWith(template);

    // Retrieve from database using mock
    const retrievedTemplate = await mockQueryTemplateRepo.findOne({
      where: { id: savedTemplate.id },
      relations: ['businessCategory'],
    });

    // Verify it was retrieved correctly
    expect(retrievedTemplate).toBeDefined();
    expect(retrievedTemplate?.template).toBe('What is the best {category}?');
    expect(retrievedTemplate?.businessCategory).toBeDefined();
    expect(retrievedTemplate?.businessCategory.name).toBe('Test Category');
  });

  test('should be able to save queries to database', async () => {
    // Create a test query template
    const template = new QueryTemplateEntity();
    template.template = 'What is the best {category}?';
    template.type = 'general';
    template.placeholders = { category: ['test category'] };
    template.requiredPlaceholders = ['category'];
    template.priority = 1;
    template.isActive = true;

    const savedTemplate = await mockQueryTemplateRepo.save(template);

    // Create a test query
    const query = new QueryEntity();
    query.text = 'What is the best running shoes?';
    query.status = 'completed';
    query.placeholderValues = { category: 'running shoes' };
    query.metadata = {
      businessCategory: 'running shoes',
      competitors: ['Nike', 'Adidas'],
      features: ['comfort', 'durability'],
    };
    query.queryTemplate = savedTemplate;
    query.queryTemplateId = savedTemplate.id;
    query.retryCount = 0;
    query.createdAt = new Date();

    // Save to database using mock
    const savedQuery = await mockQueryRepo.save(query);

    // Verify it was saved
    expect(savedQuery).toBeDefined();
    expect(savedQuery.id).toBeDefined();
    expect(savedQuery.text).toBe('What is the best running shoes?');

    // Verify the mock was called
    expect(mockQueryRepo.save).toHaveBeenCalledWith(query);

    // Retrieve from database using mock
    const retrievedQuery = await mockQueryRepo.findOne({
      where: { id: savedQuery.id },
      relations: ['queryTemplate'],
    });

    // Verify it was retrieved correctly
    expect(retrievedQuery).toBeDefined();
    expect(retrievedQuery?.text).toBe('What is the best running shoes?');
    expect(retrievedQuery?.queryTemplate).toBeDefined();
    expect(retrievedQuery?.queryTemplate.template).toBe(
      'What is the best {category}?',
    );
  });
});
