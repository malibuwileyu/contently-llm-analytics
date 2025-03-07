import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { CompanyEntity } from '../analytics/entities/company.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const authService = app.get(AuthService);
  const dataSource = app.get(DataSource);
  const companyRepository = app.get<Repository<CompanyEntity>>(getRepositoryToken(CompanyEntity));
  const userRepository = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

  try {
    // Create Nike company
    const nikeCompany = await companyRepository.save({
      name: 'Nike',
      domain: 'nike.com',
      settings: {
        industry: 'Athletic Footwear & Apparel',
        competitors: ['Adidas', 'Puma', 'Under Armour'],
        regions: ['North America', 'Europe', 'Asia'],
      }
    });

    console.log('Successfully created Nike company:', nikeCompany);

    // Check if test user already exists
    const testEmail = 'nike.test@example.com';
    const existingUser = await userRepository.findOne({
      where: { email: testEmail }
    });

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Create test user
    const user = await userRepository.save({
      email: testEmail,
      password: 'Nike@Test2024',
      metadata: {
        firstName: 'Nike',
        lastName: 'Test',
        roles: ['admin'],
        permissions: ['read', 'write', 'delete'],
        department: 'Engineering',
        title: 'Test Engineer'
      }
    });

    console.log('Created test user:', user);
  } catch (error) {
    console.error('Error seeding Nike data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
