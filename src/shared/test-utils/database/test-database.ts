import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTestDatabaseConfig = (): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'contently_test',
    entities: [__dirname + '/../../../**/*.entity{.ts,.js}'],
    synchronize: true,
    dropSchema: true,
    ssl: false,
  };
}; 