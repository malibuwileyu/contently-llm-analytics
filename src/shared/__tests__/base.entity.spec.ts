import 'reflect-metadata';
import { TestEntity } from './test.entity';
import { BaseEntity } from '../classes/base.entity';
import { getMetadataArgsStorage } from 'typeorm';

describe('BaseEntity', () => {
  beforeAll(() => {
    // Ensure TypeORM metadata is initialized
    require('typeorm');
  });

  it('should extend BaseEntity', () => {
    expect(TestEntity.prototype instanceof BaseEntity).toBe(true);
  });

  it('should have required base columns', () => {
    const metadata = getMetadataArgsStorage();
    const allColumns = metadata.columns;
    const baseColumns = allColumns.filter(col => {
      const target = col.target;
      return (
        (typeof target === 'function' && 
         (target === BaseEntity || target.prototype instanceof BaseEntity)) &&
        ['id', 'createdAt', 'updatedAt', 'deletedAt'].includes(col.propertyName)
      );
    });
    
    const columnNames = baseColumns.map(col => col.propertyName);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('createdAt');
    expect(columnNames).toContain('updatedAt');
    expect(columnNames).toContain('deletedAt');
  });

  it('should have entity-specific columns', () => {
    const metadata = getMetadataArgsStorage();
    const entityColumns = metadata.columns.filter(col => {
      const target = col.target;
      return (
        typeof target === 'function' && 
        target === TestEntity && 
        ['name', 'description'].includes(col.propertyName)
      );
    });
    
    const columnNames = entityColumns.map(col => col.propertyName);
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('description');
  });
}); 