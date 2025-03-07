import { Repository } from 'typeorm';
import { CompetitorEntity } from '../entities/competitor.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class CompetitorRepository {
  constructor(
    @InjectRepository(CompetitorEntity)
    private readonly repository: Repository<CompetitorEntity>,
  ) {}

  async findWithMentions(id: string): Promise<CompetitorEntity> {
    const competitor = await this.repository.findOne({
      where: { id },
      relations: ['mentions', 'mentions.response', 'mentions.response.query'],
    });

    if (!competitor) {
      throw new Error(`Competitor with ID ${id} not found`);
    }

    return competitor;
  }

  async findByIndustry(industryId: string): Promise<CompetitorEntity[]> {
    return this.repository.find({
      where: { industryId },
      relations: ['industry'],
    });
  }

  async findByName(name: string): Promise<CompetitorEntity[]> {
    return this.repository.createQueryBuilder('competitor')
      .where('competitor.name ILIKE :name', { name: `%${name}%` })
      .orWhere('competitor.alternateNames @> ARRAY[:name]', { name })
      .getMany();
  }

  async findByKeyword(keyword: string): Promise<CompetitorEntity[]> {
    return this.repository.createQueryBuilder('competitor')
      .where('competitor.keywords @> ARRAY[:keyword]', { keyword })
      .orWhere('competitor.products @> ARRAY[:keyword]', { keyword })
      .getMany();
  }
} 