import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1741187513161 implements MigrationInterface {
    name = 'InitialSchema1741187513161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_categories" DROP CONSTRAINT "fk_business_category_parent"`);
        await queryRunner.query(`ALTER TABLE "competitors" DROP CONSTRAINT "fk_competitor_business_category"`);
        await queryRunner.query(`ALTER TABLE "analytics_results" DROP CONSTRAINT "FK_analytics_results_competitor"`);
        await queryRunner.query(`DROP INDEX "public"."idx_business_categories_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_competitors_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_competitors_business_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_analytics_results_company"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "role" character varying NOT NULL, "encrypted_password" character varying, "company_id" uuid, "raw_user_meta_data" jsonb, "is_anonymous" boolean NOT NULL DEFAULT false, "confirmed_at" TIMESTAMP, "lastSignInAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "business_categories" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD "keywords" text array`);
        await queryRunner.query(`ALTER TABLE "business_categories" DROP COLUMN "synonyms"`);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD "synonyms" text array`);
        await queryRunner.query(`ALTER TABLE "analytics_results" ALTER COLUMN "timestamp" DROP DEFAULT`);
        await queryRunner.query(`CREATE INDEX "IDX_9fc06d72abc1f20ff034437f50" ON "business_categories" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_a0f16d42de1bb0451ee7359817" ON "competitors" ("name") `);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD CONSTRAINT "FK_8e0a7e3c34fa7f428c99f085ac8" FOREIGN KEY ("parent_category_id") REFERENCES "business_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "competitors" ADD CONSTRAINT "FK_e07283dc494d5aa322ec59a9989" FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "analytics_results" ADD CONSTRAINT "FK_58b2f35bceda4139a2fc7b993d1" FOREIGN KEY ("company_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE VIEW "company" AS SELECT "c"."id" AS "id", "c"."name" AS "name", "c"."website" AS "domain", "c"."is_customer" AS "isCustomer", jsonb_build_object(
          'industry', "bc"."name",
          'competitors', COALESCE(
            (
              SELECT jsonb_agg(comp.id)
              FROM competitors comp
              WHERE comp.business_category_id = c.business_category_id
              AND comp.id != c.id
            ),
            '[]'::jsonb
          ),
          'regions', '[]'::jsonb
        ) AS "settings", "c"."created_at" AS "createdAt", "c"."updated_at" AS "updatedAt" FROM "public"."competitors" "c" LEFT JOIN "public"."business_categories" "bc" ON "bc"."id" = "c"."business_category_id" WHERE "c"."is_customer" = true`);
        await queryRunner.query(`INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, $1, DEFAULT, $2, $3, $4)`, ["public","VIEW","company","SELECT \"c\".\"id\" AS \"id\", \"c\".\"name\" AS \"name\", \"c\".\"website\" AS \"domain\", \"c\".\"is_customer\" AS \"isCustomer\", jsonb_build_object(\n          'industry', \"bc\".\"name\",\n          'competitors', COALESCE(\n            (\n              SELECT jsonb_agg(comp.id)\n              FROM competitors comp\n              WHERE comp.business_category_id = c.business_category_id\n              AND comp.id != c.id\n            ),\n            '[]'::jsonb\n          ),\n          'regions', '[]'::jsonb\n        ) AS \"settings\", \"c\".\"created_at\" AS \"createdAt\", \"c\".\"updated_at\" AS \"updatedAt\" FROM \"public\".\"competitors\" \"c\" LEFT JOIN \"public\".\"business_categories\" \"bc\" ON \"bc\".\"id\" = \"c\".\"business_category_id\" WHERE \"c\".\"is_customer\" = true"]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "public"."typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "schema" = $3`, ["VIEW","company","public"]);
        await queryRunner.query(`DROP VIEW "company"`);
        await queryRunner.query(`ALTER TABLE "analytics_results" DROP CONSTRAINT "FK_58b2f35bceda4139a2fc7b993d1"`);
        await queryRunner.query(`ALTER TABLE "competitors" DROP CONSTRAINT "FK_e07283dc494d5aa322ec59a9989"`);
        await queryRunner.query(`ALTER TABLE "business_categories" DROP CONSTRAINT "FK_8e0a7e3c34fa7f428c99f085ac8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a0f16d42de1bb0451ee7359817"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9fc06d72abc1f20ff034437f50"`);
        await queryRunner.query(`ALTER TABLE "analytics_results" ALTER COLUMN "timestamp" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "business_categories" DROP COLUMN "synonyms"`);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD "synonyms" text`);
        await queryRunner.query(`ALTER TABLE "business_categories" DROP COLUMN "keywords"`);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD "keywords" text`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`CREATE INDEX "idx_analytics_results_company" ON "analytics_results" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "idx_competitors_business_category" ON "competitors" ("business_category_id") `);
        await queryRunner.query(`CREATE INDEX "idx_competitors_name" ON "competitors" ("name") `);
        await queryRunner.query(`CREATE INDEX "idx_business_categories_name" ON "business_categories" ("name") `);
        await queryRunner.query(`ALTER TABLE "analytics_results" ADD CONSTRAINT "FK_analytics_results_competitor" FOREIGN KEY ("company_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "competitors" ADD CONSTRAINT "fk_competitor_business_category" FOREIGN KEY ("business_category_id") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_categories" ADD CONSTRAINT "fk_business_category_parent" FOREIGN KEY ("parent_category_id") REFERENCES "business_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
