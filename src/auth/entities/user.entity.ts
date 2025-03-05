import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from '../../analytics/entities/company.entity';

@Entity({ schema: 'auth', name: 'users' })
export class User {
  @Column({ primary: true, type: 'uuid' })
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'encrypted_password', nullable: true })
  encryptedPassword: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'raw_user_meta_data', type: 'jsonb', nullable: true })
  rawUserMetaData: {
    firstName?: string;
    lastName?: string;
    picture?: string;
    roles?: string[];
    permissions?: string[];
    department?: string;
    title?: string;
  };

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'last_sign_in_at', nullable: true })
  lastSignInAt: Date;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;

  // Helper getters for metadata
  get firstName(): string | undefined {
    return this.rawUserMetaData?.firstName;
  }

  get lastName(): string | undefined {
    return this.rawUserMetaData?.lastName;
  }

  get roles(): string[] {
    return this.rawUserMetaData?.roles || [];
  }

  get permissions(): string[] {
    return this.rawUserMetaData?.permissions || [];
  }

  get picture(): string | undefined {
    return this.rawUserMetaData?.picture;
  }
}
