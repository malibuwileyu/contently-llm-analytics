import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../classes/base.service';
import { TestEntity } from './test.entity';

@Injectable()
export class TestService extends BaseService<TestEntity> {
  constructor(
    @InjectRepository(TestEntity)
    repository: Repository<TestEntity>
  ) {
    super(repository);
  }
} 