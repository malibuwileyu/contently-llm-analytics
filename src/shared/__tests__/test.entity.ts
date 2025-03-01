import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../classes/base.entity';

@Entity('test_entities')
export class TestEntity extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;
}
