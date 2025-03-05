import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getConnectionToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AIProviderModule } from '../../modules/ai-provider/ai-provider.module';
import { AIProviderFactoryService } from '../../modules/ai-provider/services/ai-provider-factory.service';
import { ProviderType } from '../../modules/ai-provider/interfaces/ai-provider.interface';
import { TypeOrmConfigService } from '../../config/typeorm.config';
import { User } from '../../auth/entities/user.entity';
import { Company } from '../../analytics/entities/company.entity';
import { Repository, Connection } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AI Provider Brand Visibility Tests', () => {
  let module: TestingModule;
  let factoryService: AIProviderFactoryService;
  let testUser: User;
  let outputFile: string;
  let userRepository: Repository<User>;
  let connection: Connection;

  beforeAll(async () => {
    // Create test outputs directory if it doesn't exist
    const outputDir = path.join(__dirname, '../../../test-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create output file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    outputFile = path.join(outputDir, `brand-visibility-test-${timestamp}.txt`);

    // Initialize test module
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          useClass: TypeOrmConfigService,
        }),
        TypeOrmModule.forFeature([User, Company]),
        AIProviderModule,
      ],
    }).compile();

    // Get services
    factoryService = module.get<AIProviderFactoryService>(
      AIProviderFactoryService,
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    connection = module.get<Connection>(getConnectionToken());

    // Find Nike test user
    testUser = await userRepository.findOne({
      where: { email: 'nike.test@nike.com' },
      relations: ['company'],
    });

    if (!testUser) {
      throw new Error('Nike test user not found');
    }
  });

  afterAll(async () => {
    if (connection && connection.isConnected) {
      await connection.close();
    }
    if (module) {
      await module.close();
    }
  });

  const appendToOutput = async (text: string) => {
    await fs.promises.appendFile(outputFile, text + '\n');
  };

  describe('Brand Visibility Tests', () => {
    let provider;

    beforeAll(() => {
      provider = factoryService.getProvider(ProviderType.OPENAI);
    });

    afterAll(async () => {
      if (provider && typeof provider.cleanup === 'function') {
        await provider.cleanup();
      }
    });

    it('should test brand visibility in market leaders', async () => {
      const prompts = [
        'Who are the top 3 athletic shoe manufacturers globally?',
        'List the leading sportswear brands in order of market share.',
        'What companies dominate the athletic footwear market?',
      ];

      await appendToOutput('=== Brand Market Position Test ===\n');

      const responses = await Promise.all(
        prompts.map(prompt => provider.complete(prompt)),
      );

      for (let i = 0; i < prompts.length; i++) {
        await appendToOutput(`\nPrompt: ${prompts[i]}\n`);
        await appendToOutput(`Response: ${responses[i].content}\n`);
        await appendToOutput(`Model: ${responses[i].metadata.model}\n`);
        await appendToOutput(
          `Tokens: ${JSON.stringify(responses[i].metadata.tokens)}\n`,
        );
      }
    }, 60000);

    it('should test brand association with product categories', async () => {
      const prompts = [
        'What brands come to mind for running shoes?',
        'Which companies are known for basketball shoes?',
        'Name the best brands for athletic performance wear.',
      ];

      await appendToOutput('\n=== Brand Category Association Test ===\n');

      const responses = await Promise.all(
        prompts.map(prompt => provider.complete(prompt)),
      );

      for (let i = 0; i < prompts.length; i++) {
        await appendToOutput(`\nPrompt: ${prompts[i]}\n`);
        await appendToOutput(`Response: ${responses[i].content}\n`);
        await appendToOutput(`Model: ${responses[i].metadata.model}\n`);
        await appendToOutput(
          `Tokens: ${JSON.stringify(responses[i].metadata.tokens)}\n`,
        );
      }
    }, 60000);

    it('should test brand innovation perception', async () => {
      const prompts = [
        'Which athletic companies are leading in innovation?',
        'What brands are pioneering sustainable athletic wear?',
        'Who makes the most technologically advanced running shoes?',
      ];

      await appendToOutput('\n=== Brand Innovation Test ===\n');

      const responses = await Promise.all(
        prompts.map(prompt => provider.complete(prompt)),
      );

      for (let i = 0; i < prompts.length; i++) {
        await appendToOutput(`\nPrompt: ${prompts[i]}\n`);
        await appendToOutput(`Response: ${responses[i].content}\n`);
        await appendToOutput(`Model: ${responses[i].metadata.model}\n`);
        await appendToOutput(
          `Tokens: ${JSON.stringify(responses[i].metadata.tokens)}\n`,
        );
      }
    }, 60000);

    it('should test brand presence in specific markets', async () => {
      const prompts = [
        'Which athletic brands dominate in North America?',
        'What are the most popular sports brands in Europe?',
        'Who leads the athletic wear market in Asia?',
      ];

      await appendToOutput('\n=== Brand Market Presence Test ===\n');

      const responses = await Promise.all(
        prompts.map(prompt => provider.complete(prompt)),
      );

      for (let i = 0; i < prompts.length; i++) {
        await appendToOutput(`\nPrompt: ${prompts[i]}\n`);
        await appendToOutput(`Response: ${responses[i].content}\n`);
        await appendToOutput(`Model: ${responses[i].metadata.model}\n`);
        await appendToOutput(
          `Tokens: ${JSON.stringify(responses[i].metadata.tokens)}\n`,
        );
      }
    }, 60000);

    it('should test brand historical significance', async () => {
      const prompts = [
        'What athletic brands have had the biggest impact on sports history?',
        'Which sports companies have revolutionized athletic footwear?',
        'Name the most influential athletic wear companies of all time.',
      ];

      await appendToOutput('\n=== Brand Historical Impact Test ===\n');

      const responses = await Promise.all(
        prompts.map(prompt => provider.complete(prompt)),
      );

      for (let i = 0; i < prompts.length; i++) {
        await appendToOutput(`\nPrompt: ${prompts[i]}\n`);
        await appendToOutput(`Response: ${responses[i].content}\n`);
        await appendToOutput(`Model: ${responses[i].metadata.model}\n`);
        await appendToOutput(
          `Tokens: ${JSON.stringify(responses[i].metadata.tokens)}\n`,
        );
      }
    }, 60000);
  });
});
