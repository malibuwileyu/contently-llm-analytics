import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompetitorEntity } from './entities/competitor.entity';
import { IndustryEntity } from './entities/industry.entity';
import { CustomerResearchService } from './services/customer-research.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompetitorEntity,
      IndustryEntity,
    ]),
  ],
  providers: [CustomerResearchService],
  exports: [CustomerResearchService],
})
export class BrandAnalyticsModule {} 