import { EntityRepository, Repository } from 'typeorm';
import { BusinessCategoryEntity } from '../entities/business-category.entity';
import { NotFoundException } from '@nestjs/common';

@EntityRepository(BusinessCategoryEntity)
export class BusinessCategoryRepository extends Repository<BusinessCategoryEntity> {
  /**
   * Find a business category with its competitors
   * @param id The business category ID
   * @returns The business category with competitors
   * @throws NotFoundException if the category is not found
   */
  async findWithCompetitors(id: string): Promise<BusinessCategoryEntity> {
    const category = await this.createQueryBuilder('category')
      .leftJoinAndSelect('category.competitors', 'competitors')
      .where('category.id = :id', { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Business category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Find a business category with its query templates
   * @param id The business category ID
   * @returns The business category with query templates
   * @throws NotFoundException if the category is not found
   */
  async findWithQueryTemplates(id: string): Promise<BusinessCategoryEntity> {
    const category = await this.createQueryBuilder('category')
      .leftJoinAndSelect('category.queryTemplates', 'queryTemplates')
      .where('category.id = :id', { id })
      .getOne();

    if (!category) {
      throw new NotFoundException(`Business category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Find all active business categories
   * @returns List of active business categories
   */
  async findAllActive(): Promise<BusinessCategoryEntity[]> {
    return this.find({ where: { isActive: true } });
  }

  /**
   * Find business categories by keyword
   * @param keyword The keyword to search for
   * @returns List of matching business categories
   */
  async findByKeyword(keyword: string): Promise<BusinessCategoryEntity[]> {
    return this.createQueryBuilder('category')
      .where('category.keywords @> ARRAY[:keyword]', { keyword })
      .orWhere('category.name ILIKE :search', { search: `%${keyword}%` })
      .orWhere('category.description ILIKE :search', { search: `%${keyword}%` })
      .getMany();
  }
}
