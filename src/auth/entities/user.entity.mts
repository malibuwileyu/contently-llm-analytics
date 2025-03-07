import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import type { CompanyEntity } from '../../analytics/entities/company.entity';

@Entity('users')
class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255, nullable: true })
  password: string;

  @Column({ name: 'raw_user_meta_data', type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb', nullable: true })
  metadata: {
    firstName?: string;
    lastName?: string;
    roles?: string[];
    permissions?: string[];
    department?: string;
    title?: string;
    picture?: string;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @Column({ name: 'confirmed_at', type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', nullable: true })
  lastSignInAt: Date;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Helper getters for metadata
  get firstName(): string | undefined {
    return this.metadata?.firstName;
  }

  get lastName(): string | undefined {
    return this.metadata?.lastName;
  }

  get roles(): string[] {
    return this.metadata?.roles || [];
  }

  get permissions(): string[] {
    return this.metadata?.permissions || [];
  }

  get picture(): string | undefined {
    return this.metadata?.picture;
  }
}

module.exports = UserEntity;
exports.UserEntity = UserEntity;
