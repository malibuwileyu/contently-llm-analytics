import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedQueryTemplates1710000500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, get the default business category ID (we'll use a placeholder for now)
    const defaultCategoryId = '00000000-0000-0000-0000-000000000000';

    // Discovery templates - focus on exploring and understanding options
    await queryRunner.query(`
      INSERT INTO query_templates (id, type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId")
      VALUES
        (uuid_generate_v4(), 'discovery', 'What are the leading {solution_type} solutions for {industry}?', 
         '["solution_type", "industry"]', '["solution_type"]', 1, true, $1),
        (uuid_generate_v4(), 'discovery', 'Which companies are innovating in {technology_area} for {use_case}?',
         '["technology_area", "use_case"]', '["technology_area"]', 1, true, $1),
        (uuid_generate_v4(), 'discovery', 'What are the emerging trends in {solution_category} for {target_segment}?',
         '["solution_category", "target_segment"]', '["solution_category"]', 1, true, $1);
    `, [defaultCategoryId]);

    // Problem-solving templates - focus on addressing specific challenges
    await queryRunner.query(`
      INSERT INTO query_templates (id, type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId")
      VALUES
        (uuid_generate_v4(), 'problem_solving', 'How do companies solve {specific_challenge} in {industry}?',
         '["specific_challenge", "industry"]', '["specific_challenge"]', 1, true, $1),
        (uuid_generate_v4(), 'problem_solving', 'What are the best practices for handling {problem_area} in {context}?',
         '["problem_area", "context"]', '["problem_area"]', 1, true, $1),
        (uuid_generate_v4(), 'problem_solving', 'Which solutions effectively address {pain_point} for {target_user}?',
         '["pain_point", "target_user"]', '["pain_point"]', 1, true, $1);
    `, [defaultCategoryId]);

    // Comparison templates - focus on evaluating alternatives
    await queryRunner.query(`
      INSERT INTO query_templates (id, type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId")
      VALUES
        (uuid_generate_v4(), 'comparison', 'Compare top {solution_type} providers for {use_case}',
         '["solution_type", "use_case"]', '["solution_type"]', 1, true, $1),
        (uuid_generate_v4(), 'comparison', 'What are the key differences between leading {technology} solutions?',
         '["technology"]', '["technology"]', 1, true, $1),
        (uuid_generate_v4(), 'comparison', 'How do {solution_category} vendors compare in terms of {criteria}?',
         '["solution_category", "criteria"]', '["solution_category"]', 1, true, $1);
    `, [defaultCategoryId]);

    // Value templates - focus on benefits and ROI
    await queryRunner.query(`
      INSERT INTO query_templates (id, type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId")
      VALUES
        (uuid_generate_v4(), 'value', 'What benefits do companies gain from implementing {solution_type}?',
         '["solution_type"]', '["solution_type"]', 1, true, $1),
        (uuid_generate_v4(), 'value', 'How does {technology} improve {business_process}?',
         '["technology", "business_process"]', '["technology"]', 1, true, $1),
        (uuid_generate_v4(), 'value', 'What ROI can businesses expect from {solution} in {timeframe}?',
         '["solution", "timeframe"]', '["solution"]', 1, true, $1);
    `, [defaultCategoryId]);

    // Implementation templates - focus on adoption and usage
    await queryRunner.query(`
      INSERT INTO query_templates (id, type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId")
      VALUES
        (uuid_generate_v4(), 'implementation', 'What are best practices for implementing {solution_type} in {environment}?',
         '["solution_type", "environment"]', '["solution_type"]', 1, true, $1),
        (uuid_generate_v4(), 'implementation', 'How do companies successfully deploy {technology} solutions?',
         '["technology"]', '["technology"]', 1, true, $1),
        (uuid_generate_v4(), 'implementation', 'What are common challenges when adopting {solution} and how to overcome them?',
         '["solution"]', '["solution"]', 1, true, $1);
    `, [defaultCategoryId]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all seeded templates
    await queryRunner.query(`
      DELETE FROM query_templates 
      WHERE type IN ('discovery', 'problem_solving', 'comparison', 'value', 'implementation')
    `);
  }
} 