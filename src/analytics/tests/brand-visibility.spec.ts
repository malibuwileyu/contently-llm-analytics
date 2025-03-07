import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../../modules/brand-analytics/entities/industry.entity';
import { BrandVisibilityService } from '../services/brand-visibility.service';
import { QuestionValidatorService } from '../services/question-validator.service';
import { AIProviderModule } from '../../modules/ai-provider/ai-provider.module';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { NLPService } from '../../modules/nlp/nlp.service';
import { CustomerResearchService } from '../../modules/brand-analytics/services/customer-research.service';

jest.setTimeout(600000); // 10 minutes for the full suite

const TEST_OUTPUT_FILE = 'brand-visibility-analysis.json';

describe('Brand Visibility Analysis', () => {
  let module: TestingModule;
  let service: BrandVisibilityService;
  let testCompany: CompetitorEntity;
  let testIndustry: IndustryEntity;
  let companyRepository: Repository<CompetitorEntity>;
  let industryRepository: Repository<IndustryEntity>;

  beforeEach(async () => {
    // Clear the test output file
    const outputDir = path.join(process.cwd(), 'test-outputs');
    const outputPath = path.join(outputDir, TEST_OUTPUT_FILE);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [CompetitorEntity, IndustryEntity],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([CompetitorEntity, IndustryEntity]),
        AIProviderModule,
      ],
      providers: [
        BrandVisibilityService,
        QuestionValidatorService,
        CustomerResearchService,
        NLPService,
      ],
    }).compile();

    service = module.get<BrandVisibilityService>(BrandVisibilityService);
    companyRepository = module.get<Repository<CompetitorEntity>>(getRepositoryToken(CompetitorEntity));
    industryRepository = module.get<Repository<IndustryEntity>>(getRepositoryToken(IndustryEntity));

    // Create test industry first
    testIndustry = await industryRepository.save({
      name: 'Athletic Footwear & Apparel',
      description: 'Industry for athletic footwear and apparel manufacturing',
      keywords: ['footwear', 'apparel', 'athletics', 'sports'],
      isActive: true
    });

    // Create test company with proper industry reference
    testCompany = await companyRepository.save({
      name: 'Nike',
      website: 'nike.com',
      description: 'Global leader in athletic footwear and apparel',
      keywords: ['footwear', 'apparel', 'sports'],
      isCustomer: true,
      isActive: true,
      industryId: testIndustry.id,
      settings: {},
      alternateNames: [],
      products: ['shoes', 'apparel', 'accessories'],
      regions: ['North America', 'Europe', 'Asia'],
      competitors: ['Adidas', 'Puma', 'Under Armour']
    });
  });

  afterEach(async () => {
    await companyRepository.delete(testCompany.id);
    await industryRepository.delete(testIndustry.id);
    await module.close();
  });

  describe('BrandVisibilityService', () => {
    it('should analyze brand visibility with detailed metrics', async () => {
      const questions = [
        "What is Nike's market share in the athletic footwear industry?",
        "How does Nike's brand visibility compare to Adidas in social media?",
        "What are Nike's key competitive advantages in product innovation?",
      ];

      const startTime = Date.now();
      const results = await service.analyzeBrandVisibilityBatch(testCompany, questions, { maxConcurrent: 2 });
      const endTime = Date.now();

      const analysisOutput = {
        config: {
          batchSize: questions.length,
          maxConcurrent: 2,
          totalTime: endTime - startTime,
          averageTimePerQuestion: (endTime - startTime) / questions.length,
        },
        company: {
          name: testCompany.name,
          industry: testCompany.industry,
          competitors: testCompany.competitors,
        },
        questions,
        results,
      };

      // Save detailed analysis to file
      const outputDir = path.join(process.cwd(), 'test-outputs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, TEST_OUTPUT_FILE);
      fs.writeFileSync(outputPath, JSON.stringify(analysisOutput, null, 2));

      // Verify results
      expect(results).toBeDefined();
      expect(results.length).toBe(questions.length);
      
      results.forEach((result, index) => {
        expect(result.question).toBe(questions[index]);
        expect(result.analysis).toBeDefined();
        expect(result.brandMentions).toBeDefined();
        expect(result.brandHealth).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.metadata).toBeDefined();
      });

      // Verify file was created with content
      expect(fs.existsSync(outputPath)).toBe(true);
      const savedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      expect(savedData.results).toHaveLength(questions.length);
    }, 600000);
  });
}); 