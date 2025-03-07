import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../entities/competitor.entity';
import { IndustryEntity } from '../entities/industry.entity';

@Injectable()
export class CustomerResearchService {
  private readonly logger = new Logger(CustomerResearchService.name);

  constructor(
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
    @InjectRepository(IndustryEntity)
    private readonly industryRepository: Repository<IndustryEntity>,
  ) {}

  async getAllCompetitors(): Promise<CompetitorEntity[]> {
    return this.competitorRepository.find({
      relations: ['industry'],
    });
  }

  async getCompetitorById(id: string): Promise<CompetitorEntity> {
    const competitor = await this.competitorRepository.findOne({
      where: { id, isCustomer: true },
      relations: ['industry'],
    });

    if (!competitor) {
      throw new Error(`Customer with ID ${id} not found`);
    }

    return competitor;
  }

  async getCompetitorsByIndustry(industryId: string): Promise<CompetitorEntity[]> {
    return this.competitorRepository.find({
      where: { industryId },
      relations: ['industry'],
    });
  }

  async searchCompetitors(keyword: string): Promise<CompetitorEntity[]> {
    return this.competitorRepository
      .createQueryBuilder('competitor')
      .where('competitor.isActive = :isActive', { isActive: true })
      .andWhere(
        '(competitor.name ILIKE :keyword OR competitor.description ILIKE :keyword OR :keyword = ANY(competitor.keywords) OR :keyword = ANY(competitor.alternateNames) OR :keyword = ANY(competitor.products))',
        { keyword: `%${keyword}%` },
      )
      .orderBy('competitor.name', 'ASC')
      .getMany();
  }

  async getCompetitorsWithIndustry(
    industryId?: string,
  ): Promise<CompetitorEntity[]> {
    const queryBuilder = this.competitorRepository
      .createQueryBuilder('competitor')
      .leftJoinAndSelect('competitor.industry', 'industry')
      .where('competitor.isActive = :isActive', { isActive: true });

    if (industryId) {
      queryBuilder.andWhere('competitor.industryId = :industryId', {
        industryId,
      });
    }

    return queryBuilder.orderBy('competitor.name', 'ASC').getMany();
  }

  async findAllCustomers(): Promise<CompetitorEntity[]> {
    return this.competitorRepository.find({
      where: { isCustomer: true },
      relations: ['industry'],
    });
  }

  async findCustomersByIndustry(industryId: string): Promise<CompetitorEntity[]> {
    return this.competitorRepository.find({
      where: {
        isCustomer: true,
        industryId,
      },
      relations: ['industry'],
    });
  }

  async findAllIndustries(): Promise<IndustryEntity[]> {
    return this.industryRepository.find();
  }

  async findIndustryById(id: string): Promise<IndustryEntity | null> {
    return this.industryRepository.findOne({
      where: { id },
      relations: ['competitors'],
    });
  }
} 