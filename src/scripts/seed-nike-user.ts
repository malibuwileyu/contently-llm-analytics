import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import { Company } from '../analytics/entities/company.entity';
import { User } from '../auth/entities/user.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const dataSource = app.get(DataSource);
  const companyRepository = dataSource.getRepository(Company);
  const userRepository = dataSource.getRepository(User);

  try {
    // Check if Nike company already exists
    let nikeCompany = await companyRepository.findOne({
      where: { name: 'Nike' },
    });

    if (!nikeCompany) {
      // Create Nike company
      nikeCompany = await companyRepository.save({
        id: uuidv4(),
        name: 'Nike',
        settings: {
          allowedDomains: ['nike.com'],
          successCriteria: {
            minConfidenceScore: 0.7,
            minResponseQuality: 0.8,
            maxDuration: 300, // 5 minutes
          },
        },
      });
      console.log('Nike company created with ID:', nikeCompany.id);
    } else {
      console.log('Nike company already exists with ID:', nikeCompany.id);
    }

    // Check if test user already exists
    const testEmail = 'nike.test@nike.com';
    const existingUser = await userRepository.findOne({
      where: { email: testEmail },
    });

    if (!existingUser) {
      // Create Nike test user
      const testUser = await authService.createUser({
        email: testEmail,
        password: 'Nike@Test2024',
        rawUserMetaData: {
          firstName: 'Nike',
          lastName: 'Test',
          roles: ['admin'],
          permissions: ['read:analytics', 'read:conversations'],
          department: 'Digital Innovation',
          title: 'Analytics Manager',
        },
        companyId: nikeCompany.id,
      });

      console.log('Test user created:', {
        email: testUser.email,
        password: 'Nike@Test2024',
        companyId: testUser.companyId,
      });
    } else {
      console.log('Test user already exists:', {
        email: existingUser.email,
        companyId: existingUser.companyId,
      });
    }
  } catch (error) {
    console.error('Error seeding Nike data:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
