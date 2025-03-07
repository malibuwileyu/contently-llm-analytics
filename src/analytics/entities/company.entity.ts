const typeorm = require('typeorm');

@typeorm.ViewEntity('companies')
class CompanyEntity {
  @typeorm.ViewColumn()
  id: string;

  @typeorm.ViewColumn()
  name: string;

  @typeorm.ViewColumn()
  domain: string;

  @typeorm.ViewColumn()
  isCustomer: boolean;

  @typeorm.ViewColumn({ name: 'settings' })
  settings: {
    industry: string;
    competitors: string[];
    regions: string[];
  };

  @typeorm.ViewColumn({ name: 'created_at' })
  createdAt: Date;

  @typeorm.ViewColumn({ name: 'updated_at' })
  updatedAt: Date;
}

module.exports = { CompanyEntity }; 