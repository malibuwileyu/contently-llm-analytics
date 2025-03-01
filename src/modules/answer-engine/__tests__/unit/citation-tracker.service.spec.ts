import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitationTrackerService } from '../../services/citation-tracker.service';
import { Citation } from '../../entities/citation.entity';
import { CreateCitationDto } from '../../interfaces/citation.interface';
import { BrandMention } from '../../entities/brand-mention.entity';

// Define a more specific mock repository type
type MockType<T> = {
  [P in keyof T]?: jest.Mock;
};

// Create a mock repository factory
const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  _findOne: jest.fn(),
});

// Create a mock for AuthorityCalculatorService
interface AuthorityCalculatorService {
  calculateAuthority(source: string): Promise<number>;
}

describe('CitationTrackerService', () => {
  let service: CitationTrackerService;
  let citationRepository: MockType<Repository<Citation>>;
  let authorityCalculator: AuthorityCalculatorService;

  beforeEach(async () => {
    // Create mocks
    citationRepository = createMockRepository();
    authorityCalculator = {
      calculateAuthority: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitationTrackerService,
        {
          provide: getRepositoryToken(Citation),
          useValue: citationRepository,
        },
        {
          provide: 'AuthorityCalculatorService',
          useValue: authorityCalculator,
        },
      ],
    })
      .overrideProvider(CitationTrackerService)
      .useFactory({
        factory: () =>
          new CitationTrackerService(
            citationRepository as any,
            authorityCalculator,
          ),
      })
      .compile();

    service = module.get<CitationTrackerService>(CitationTrackerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('trackCitation', () => {
    it('should create and save a citation with calculated authority', async () => {
      // Arrange
      const brandMention = { id: 'mention-id' } as BrandMention;
      const citationDto: CreateCitationDto = {
        source: 'https://example.com',
        brandMention,
        metadata: { page: 1 },
      };
      const authority = 0.75;
      const createdCitation = {
        source: citationDto.source,
        text: citationDto.source,
        authority,
        metadata: citationDto.metadata || {},
        brandMention: citationDto.brandMention as BrandMention,
        brandMentionId: (citationDto.brandMention as BrandMention).id,
      } as Citation;
      const savedCitation = {
        id: 'citation-id',
        source: citationDto.source,
        text: citationDto.source,
        brandMention: citationDto.brandMention,
        brandMentionId: (citationDto.brandMention as BrandMention).id,
        metadata: citationDto.metadata,
        authority,
      } as Citation;

      (authorityCalculator.calculateAuthority as jest.Mock).mockResolvedValue(
        authority,
      );
      citationRepository.create!.mockReturnValue(createdCitation);
      citationRepository.save!.mockResolvedValue(savedCitation);

      // Act
      const result = await service.trackCitation(citationDto);

      // Assert
      expect(result).toEqual(savedCitation);
      expect(authorityCalculator.calculateAuthority).toHaveBeenCalledWith(
        citationDto.source,
      );
      expect(citationRepository.create).toHaveBeenCalledWith({
        source: citationDto.source,
        text: citationDto.source,
        authority,
        metadata: citationDto.metadata || {},
        brandMention: citationDto.brandMention as BrandMention,
        brandMentionId: (citationDto.brandMention as BrandMention).id,
      });
      expect(citationRepository.save).toHaveBeenCalledWith(createdCitation);
    });

    it('should handle errors during citation tracking', async () => {
      // Arrange
      const brandMention = { id: 'mention-id' } as BrandMention;
      const citationDto: CreateCitationDto = {
        source: 'https://example.com',
        brandMention,
      };
      const error = new Error('Database error');

      (authorityCalculator.calculateAuthority as jest.Mock).mockResolvedValue(
        0.8,
      );
      citationRepository.create!.mockReturnValue({} as Citation);
      citationRepository.save!.mockRejectedValue(error);

      // Act & Assert
      await expect(service.trackCitation(citationDto)).rejects.toThrow(error);
    });

    it('should handle empty source', async () => {
      // Arrange
      const brandMention = { id: 'mention-id' } as BrandMention;
      const citationDto: CreateCitationDto = {
        source: '',
        brandMention,
      };

      (authorityCalculator.calculateAuthority as jest.Mock).mockResolvedValue(
        0.1,
      ); // Low authority for empty source
      citationRepository.create!.mockReturnValue({
        source: citationDto.source,
        text: citationDto.source,
        authority: 0.1,
        metadata: {},
        brandMention: citationDto.brandMention as BrandMention,
        brandMentionId: (citationDto.brandMention as BrandMention).id,
      } as Citation);
      citationRepository.save!.mockResolvedValue({
        id: 'citation-id',
        source: citationDto.source,
        text: citationDto.source,
        authority: 0.1,
        metadata: {},
        brandMention: citationDto.brandMention as BrandMention,
        brandMentionId: (citationDto.brandMention as BrandMention).id,
      } as Citation);

      // Act
      const result = await service.trackCitation(citationDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.authority).toBe(0.1);
    });
  });

  describe('getCitationsByBrandMention', () => {
    it('should return citations for a brand mention', async () => {
      // Arrange
      const brandMentionId = 'mention-id';
      const citations = [
        { id: 'citation-1', source: 'source-1', authority: 0.9 },
        { id: 'citation-2', source: 'source-2', authority: 0.7 },
      ] as Citation[];

      citationRepository.find!.mockResolvedValue(citations);

      // Act
      const result = await service.getCitationsByBrandMention(brandMentionId);

      // Assert
      expect(result).toEqual(citations);
      expect(citationRepository.find).toHaveBeenCalledWith({
        where: { brandMention: { id: brandMentionId } },
        order: { authority: 'DESC' },
      });
    });

    it('should return empty array when no citations found', async () => {
      // Arrange
      const brandMentionId = 'mention-id';
      citationRepository.find!.mockResolvedValue([]);

      // Act
      const result = await service.getCitationsByBrandMention(brandMentionId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle errors when fetching citations', async () => {
      // Arrange
      const brandMentionId = 'mention-id';
      const error = new Error('Database error');
      citationRepository.find!.mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.getCitationsByBrandMention(brandMentionId),
      ).rejects.toThrow(error);
    });
  });

  describe('getTopCitations', () => {
    it('should return top citations by authority', async () => {
      // Arrange
      const limit = 5;
      const citations = [
        { id: 'citation-1', source: 'source-1', authority: 0.9 },
        { id: 'citation-2', source: 'source-2', authority: 0.8 },
        { id: 'citation-3', source: 'source-3', authority: 0.7 },
      ] as Citation[];

      citationRepository.find!.mockResolvedValue(citations);

      // Act
      const result = await service.getTopCitations(limit);

      // Assert
      expect(result).toEqual(citations);
      expect(citationRepository.find).toHaveBeenCalledWith({
        order: { authority: 'DESC' },
        take: limit,
      });
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      const citations = [] as Citation[];
      citationRepository.find!.mockResolvedValue(citations);

      // Act
      await service.getTopCitations();

      // Assert
      expect(citationRepository.find).toHaveBeenCalledWith({
        order: { authority: 'DESC' },
        take: 10, // Default limit
      });
    });

    it('should handle errors when fetching top citations', async () => {
      // Arrange
      const error = new Error('Database error');
      citationRepository.find!.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getTopCitations()).rejects.toThrow(error);
    });
  });
});
