import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderRunner } from '../../runners/ai-provider.runner';
import { AIProviderFactoryService } from '../../services/ai-provider-factory.service';
import { ProviderType } from '../../interfaces/ai-provider.interface';

describe('AIProviderRunner', () => {
  let runner: AIProviderRunner;
  let factoryService: AIProviderFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ai: {
                openai: {
                  apiKeys: [],
                  _defaultModel: 'gpt-3.5-turbo',
                  _defaultTemperature: 0.7,
                  _timeoutMs: 30000,
                  _maxRetries: 3,
                },
              },
            }),
          ],
        }),
      ],
      providers: [AIProviderRunner, AIProviderFactoryService],
    }).compile();

    runner = module.get<AIProviderRunner>(AIProviderRunner);
    factoryService = module.get<AIProviderFactoryService>(
      AIProviderFactoryService,
    );
  });

  it('should be defined', () => {
    expect(runner).toBeDefined();
  });

  describe('runChat', () => {
    it('should throw error when no provider is available', async () => {
      // Mock the factory service to return null for getBestProviderByType
      jest
        .spyOn(factoryService, 'getBestProviderByType')
        .mockResolvedValue(null);

      await expect(
        runner.runChat(ProviderType.OPENAI, [
          { role: 'user', content: 'Hello' },
        ]),
      ).rejects.toThrow('No available provider of type openai');
    });
  });

  describe('runEmbed', () => {
    it('should throw error when no provider is available', async () => {
      // Mock the factory service to return null for getBestProviderByType
      jest
        .spyOn(factoryService, 'getBestProviderByType')
        .mockResolvedValue(null);

      await expect(
        runner.runEmbed(ProviderType.OPENAI, 'Embed this text'),
      ).rejects.toThrow('No available provider of type openai');
    });
  });

  describe('runComplete', () => {
    it('should throw error when no provider is available', async () => {
      // Mock the factory service to return null for getBestProviderByType
      jest
        .spyOn(factoryService, 'getBestProviderByType')
        .mockResolvedValue(null);

      await expect(
        runner.runComplete(ProviderType.OPENAI, 'Complete this text'),
      ).rejects.toThrow('No available provider of type openai');
    });
  });

  describe('runSearch', () => {
    it('should throw error when no provider is available', async () => {
      // Mock the factory service to return null for getBestProviderByType
      jest
        .spyOn(factoryService, 'getBestProviderByType')
        .mockResolvedValue(null);

      await expect(
        runner.runSearch(ProviderType.OPENAI, 'Search for this'),
      ).rejects.toThrow('No available provider of type openai');
    });
  });
});
