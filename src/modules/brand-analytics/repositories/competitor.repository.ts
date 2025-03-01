import { EntityRepository, Repository } from 'typeorm';
import { CompetitorEntity } from '../entities/competitor.entity';
import { NotFoundException } from '@nestjs/common';

@EntityRepository(CompetitorEntity)
export class CompetitorRepository extends Repository<CompetitorEntity> {
  /**
   * Find a competitor with its mentions
   * @param id The competitor ID
   * @returns The competitor with mentions
   * @throws NotFoundException if the competitor is not found
   */
  async findWithMentions(id: string): Promise<CompetitorEntity> {
    const competitor = await this.createQueryBuilder('competitor')
      .leftJoinAndSelect('competitor.mentions', 'mentions')
      .where('competitor.id = :id', { id })
      .getOne();

    if (!competitor) {
      throw new NotFoundException(`Competitor with ID ${id} not found`);
    }

    return competitor;
  }

  /**
   * Find all competitors for a business category
   * @param businessCategoryId The business category ID
   * @returns List of competitors in the category
   */
  async findByBusinessCategory(
    businessCategoryId: string,
  ): Promise<CompetitorEntity[]> {
    return this.find({
      where: { businessCategoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find the customer's company in a business category
   * @param businessCategoryId The business category ID
   * @returns The customer's company or null if not found
   */
  async findCustomerInCategory(
    businessCategoryId: string,
  ): Promise<CompetitorEntity | null> {
    return this.findOne({
      where: { businessCategoryId, isCustomer: true },
    });
  }

  /**
   * Find competitors by name or alternate names
   * @param name The name to search for
   * @returns List of matching competitors
   */
  async findByName(name: string): Promise<CompetitorEntity[]> {
    return this.createQueryBuilder('competitor')
      .where('competitor.name ILIKE :name', { name: `%${name}%` })
      .orWhere('competitor.alternateNames @> ARRAY[:name]', { name })
      .getMany();
  }

  /**
   * Find competitors by keyword
   * @param keyword The keyword to search for
   * @returns List of matching competitors
   */
  async findByKeyword(keyword: string): Promise<CompetitorEntity[]> {
    return this.createQueryBuilder('competitor')
      .where('competitor.keywords @> ARRAY[:keyword]', { keyword })
      .orWhere('competitor.products @> ARRAY[:keyword]', { keyword })
      .getMany();
  }
}
