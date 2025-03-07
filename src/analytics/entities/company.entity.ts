import { ViewEntity, ViewColumn } from 'typeorm';

@ViewEntity('companies')
export class CompanyEntity {
  @ViewColumn()
  id: string;

  @ViewColumn()
  name: string;

  @ViewColumn()
  domain: string;

  @ViewColumn()
  isCustomer: boolean;

  @ViewColumn({ name: 'settings' })
  settings: {
    industry: string;
    competitors: string[];
    regions: string[];
  };

  @ViewColumn({ name: 'created_at' })
  createdAt: Date;

  @ViewColumn({ name: 'updated_at' })
  updatedAt: Date;
}
