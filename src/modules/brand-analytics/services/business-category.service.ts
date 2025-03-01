import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategoryEntity } from '../entities/business-category.entity';

/**
 * Service for managing business categories
 */
@Injectable()
export class BusinessCategoryService {
  private readonly logger = new Logger(BusinessCategoryService.name);

  constructor(
    @InjectRepository(BusinessCategoryEntity)
    private readonly businessCategoryRepository: Repository<BusinessCategoryEntity>,
  ) {}

  /**
   * Get all business categories
   * @returns List of all business categories
   */
  async getAllCategories(): Promise<BusinessCategoryEntity[]> {
    return this.businessCategoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get a business category by ID
   * @param id The business category ID
   * @returns The business category
   * @throws NotFoundException if the category is not found
   */
  async getCategoryById(id: string): Promise<BusinessCategoryEntity> {
    const category = await this.businessCategoryRepository.findOne({
      where: { id, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Business category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get subcategories for a business category
   * @param parentCategoryId The parent category ID
   * @returns List of subcategories
   */
  async getSubcategories(
    parentCategoryId: string,
  ): Promise<BusinessCategoryEntity[]> {
    // First verify the parent category exists
    await this.getCategoryById(parentCategoryId);

    // Then get its subcategories
    return this.businessCategoryRepository.find({
      where: { parentCategoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Create a new business category
   * @param data The business category data
   * @returns The created business category
   */
  async createCategory(
    data: Partial<BusinessCategoryEntity>,
  ): Promise<BusinessCategoryEntity> {
    // If this is a _subcategory, verify the parent exists
    if (data.parentCategoryId) {
      await this.getCategoryById(data.parentCategoryId);
    }

    const category = this.businessCategoryRepository.create(data);
    return this.businessCategoryRepository.save(category);
  }

  /**
   * Update a business category
   * @param id The business category ID
   * @param data The updated business category data
   * @returns The updated business category
   * @throws NotFoundException if the category is not found
   */
  async updateCategory(
    id: string,
    data: Partial<BusinessCategoryEntity>,
  ): Promise<BusinessCategoryEntity> {
    const category = await this.getCategoryById(id);

    // If changing parent category, verify the new parent exists
    if (
      data.parentCategoryId &&
      data.parentCategoryId !== category.parentCategoryId
    ) {
      await this.getCategoryById(data.parentCategoryId);
    }

    // Update the category
    Object.assign(category, data);
    return this.businessCategoryRepository.save(category);
  }

  /**
   * Delete a business category
   * @param id The business category ID
   * @throws NotFoundException if the category is not found
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await this.getCategoryById(id);

    // Soft delete by setting isActive to false
    category.isActive = false;
    await this.businessCategoryRepository.save(category);
  }

  /**
   * Get a category hierarchy (parent with subcategories)
   * @param categoryId The category ID
   * @returns The category with its subcategories
   */
  async getCategoryHierarchy(categoryId: string): Promise<{
    category: BusinessCategoryEntity;
    subcategories: BusinessCategoryEntity[];
  }> {
    const category = await this.getCategoryById(categoryId);
    const subcategories = await this.getSubcategories(categoryId);

    return { category, subcategories };
  }

  /**
   * Search for business categories by keyword
   * @param keyword The search keyword
   * @returns List of matching business categories
   */
  async searchCategories(keyword: string): Promise<BusinessCategoryEntity[]> {
    return this.businessCategoryRepository
      .createQueryBuilder('category')
      .where('category.isActive = :isActive', { isActive: true })
      .andWhere(
        '(category.name ILIKE :keyword OR category.description ILIKE :keyword OR :keyword = ANY(category.keywords))',
        { keyword: `%${keyword}%` },
      )
      .orderBy('category.name', 'ASC')
      .getMany();
  }
}
