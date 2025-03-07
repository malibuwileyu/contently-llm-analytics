import * as typeorm from 'typeorm';

@typeorm.Entity('users')
export class UserEntity {
  @typeorm.PrimaryGeneratedColumn('uuid')
  id: string;

  @typeorm.Column({ length: 255, unique: true })
  email: string;

  @typeorm.Column({ length: 255 })
  name: string;

  @typeorm.Column({ length: 255, nullable: true })
  password: string;

  @typeorm.Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @typeorm.Column({
    name: 'raw_user_meta_data',
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
  })
  metadata: {
    firstName?: string;
    lastName?: string;
    roles?: string[];
    permissions?: string[];
    department?: string;
    title?: string;
    picture?: string;
  };

  @typeorm.Column({ name: 'is_active', default: true })
  isActive: boolean;

  @typeorm.Column({ name: 'is_admin', default: false })
  isAdmin: boolean;

  @typeorm.Column({
    name: 'confirmed_at',
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  confirmedAt: Date;

  @typeorm.Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  lastSignInAt: Date;

  @typeorm.Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @typeorm.Column({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
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

// For CommonJS compatibility
module.exports = { UserEntity };
