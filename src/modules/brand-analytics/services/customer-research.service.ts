import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../entities/competitor.entity';
import { BusinessCategoryEntity } from '../entities/business-category.entity';

/**
 * Service for managing customer-specific research information
 */
@Injectable()
export class CustomerResearchService {
  private readonly logger = new Logger(CustomerResearchService.name);

  constructor(
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
    @InjectRepository(BusinessCategoryEntity)
    private readonly businessCategoryRepository: Repository<BusinessCategoryEntity>,
  ) {}

  /**
   * Get all competitors
   * @returns List of all competitors
   */
  async getAllCompetitors(): Promise<CompetitorEntity[]> {
    return this.competitorRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a competitor by ID
   * @param id The competitor ID
   * @returns The competitor
   * @throws NotFoundException if the competitor is not found
   */
  async getCompetitorById(id: string): Promise<CompetitorEntity> {
    const competitor = await this.competitorRepository.findOne({
      where: { id, isActive: true },
    });

    if (!competitor) {
      throw new NotFoundException(`Competitor with ID ${id} not found`);
    }

    return competitor;
  }

  /**
   * Get competitors for a business category
   * @param categoryId The business category ID
   * @returns List of competitors in the category
   */
  async getCompetitorsByCategory(
    categoryId: string,
  ): Promise<CompetitorEntity[]> {
    // First verify the category exists
    const category = await this.businessCategoryRepository.findOne({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Business category with ID ${categoryId} not found`,
      );
    }

    // Then get its competitors
    return this.competitorRepository.find({
      where: { businessCategoryId: categoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get the customer competitor for a business category
   * @param categoryId The business category ID
   * @returns The customer competitor
   * @throws NotFoundException if no customer competitor is found
   */
  async getCustomerCompetitor(categoryId: string): Promise<CompetitorEntity> {
    // First verify the category exists
    const category = await this.businessCategoryRepository.findOne({
      where: { id: categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Business category with ID ${categoryId} not found`,
      );
    }

    // Then get the customer competitor
    const customer = await this.competitorRepository.findOne({
      where: {
        businessCategoryId: categoryId,
        isCustomer: true,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `No customer competitor found for category ${category.name}`,
      );
    }

    return customer;
  }

  /**
   * Create a new competitor
   * @param data The competitor data
   * @returns The created competitor
   */
  async createCompetitor(
    data: Partial<CompetitorEntity>,
  ): Promise<CompetitorEntity> {
    // Verify the business category exists
    if (data.businessCategoryId) {
      const category = await this.businessCategoryRepository.findOne({
        where: { id: data.businessCategoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Business category with ID ${data.businessCategoryId} not found`,
        );
      }
    }

    const competitor = this.competitorRepository.create(data);
    return this.competitorRepository.save(competitor);
  }

  /**
   * Update a competitor
   * @param id The competitor ID
   * @param data The updated competitor data
   * @returns The updated competitor
   * @throws NotFoundException if the competitor is not found
   */
  async updateCompetitor(
    id: string,
    data: Partial<CompetitorEntity>,
  ): Promise<CompetitorEntity> {
    const competitor = await this.getCompetitorById(id);

    // If changing business category, verify the new category exists
    if (
      data.businessCategoryId &&
      data.businessCategoryId !== competitor.businessCategoryId
    ) {
      const category = await this.businessCategoryRepository.findOne({
        where: { id: data.businessCategoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(
          `Business category with ID ${data.businessCategoryId} not found`,
        );
      }
    }

    // Update the competitor
    Object.assign(competitor, data);
    return this.competitorRepository.save(competitor);
  }

  /**
   * Delete a competitor
   * @param id The competitor ID
   * @throws NotFoundException if the competitor is not found
   */
  async deleteCompetitor(id: string): Promise<void> {
    const competitor = await this.getCompetitorById(id);

    // Soft delete by setting isActive to false
    competitor.isActive = false;
    await this.competitorRepository.save(competitor);
  }

  /**
   * Search for competitors by keyword
   * @param keyword The search keyword
   * @returns List of matching competitors
   */
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

  /**
   * Get competitors with their business category
   * @param categoryId Optional business category ID to filter by
   * @returns List of competitors with their business category
   */
  async getCompetitorsWithCategory(
    categoryId?: string,
  ): Promise<CompetitorEntity[]> {
    const queryBuilder = this.competitorRepository
      .createQueryBuilder('competitor')
      .leftJoinAndSelect('competitor.businessCategory', 'category')
      .where('competitor.isActive = :isActive', { isActive: true });

    if (categoryId) {
      queryBuilder.andWhere('competitor.businessCategoryId = :categoryId', {
        categoryId,
      });
    }

    return queryBuilder.orderBy('competitor.name', 'ASC').getMany();
  }
}
