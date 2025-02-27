import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ type: 'simple-array', default: Role.USER })
  roles: Role[];

  @Column({ type: 'simple-array', default: Permission.READ_CONTENT })
  permissions: Permission[];

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;
} 