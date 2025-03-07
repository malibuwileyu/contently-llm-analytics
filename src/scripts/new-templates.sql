-- Add query_type column
ALTER TABLE query_templates ADD COLUMN IF NOT EXISTS query_type varchar(50) NOT NULL DEFAULT 'industry';

-- Clear existing templates
DELETE FROM query_templates;

-- Authority templates with different query types
INSERT INTO query_templates (id, type, query_type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId") VALUES
-- Industry-wide authority queries
(uuid_generate_v4(), 'authority', 'industry', 'What are the top brands to consider for {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'industry', 'Which companies are known for being the best in {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'industry', 'Who are the go-to brands for high-quality {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Context-sensitive authority queries
(uuid_generate_v4(), 'authority', 'context', 'Who are the leaders in the {solution_type} segment of {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'context', 'Which companies are recognized for their {technology} in {industry}?', '["technology", "industry"]', '["technology", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'context', 'What brands dominate thought leadership in the {solution_type} space of {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Competitive authority queries
(uuid_generate_v4(), 'authority', 'competitive', 'In {industry}, how does {company} rank in terms of innovation compared to its top competitors?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'competitive', 'How does {company} rank in terms of thought leadership compared to its top competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'authority', 'competitive', 'How does {company} rank in terms of industry awards and recognition compared to its competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000');

-- Presence templates with different query types
INSERT INTO query_templates (id, type, query_type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId") VALUES
-- Industry-wide presence queries
(uuid_generate_v4(), 'presence', 'industry', 'What brands are most popular for {product/service} right now?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'presence', 'industry', 'Which companies are everywhere when it comes to {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'presence', 'industry', 'Who are the most talked-about brands in {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Context-sensitive presence queries
(uuid_generate_v4(), 'presence', 'context', 'Which companies have the highest visibility in the {solution_type} market of {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'presence', 'context', 'What brands are most frequently associated with {technology} in {industry}?', '["technology", "industry"]', '["technology", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'presence', 'context', 'Who leads in market share for {solution_type} solutions in {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Competitive presence queries
(uuid_generate_v4(), 'presence', 'competitive', 'What is the market share of {company} in {industry} compared to its top three competitors?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'presence', 'competitive', 'How does {company} rank in terms of social media presence compared to its competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000');

-- Differentiation templates with different query types
INSERT INTO query_templates (id, type, query_type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId") VALUES
-- Industry-wide differentiation queries
(uuid_generate_v4(), 'differentiation', 'industry', 'What brands stand out the most in the {product/service} market?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'differentiation', 'industry', 'Which brands are doing something unique with {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'differentiation', 'industry', 'Who is really innovating in the {product/service} space?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Context-sensitive differentiation queries
(uuid_generate_v4(), 'differentiation', 'context', 'Which companies are setting the standard for {solution_type} in {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'differentiation', 'context', 'What brands are known for their unique approach to {technology} in {industry}?', '["technology", "industry"]', '["technology", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'differentiation', 'context', 'Who is redefining {solution_type} practices within {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Competitive differentiation queries
(uuid_generate_v4(), 'differentiation', 'competitive', 'How does {company} differentiate itself from its competitors in {industry} based on product features?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'differentiation', 'competitive', 'How does {company} rank in terms of pricing strategy compared to its competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000');

-- Impact templates with different query types
INSERT INTO query_templates (id, type, query_type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId") VALUES
-- Industry-wide impact queries
(uuid_generate_v4(), 'impact', 'industry', 'Which brands are known for delivering the best results with {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'impact', 'industry', 'What companies are making the biggest difference with their {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'impact', 'industry', 'Who is really helping customers succeed with {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Context-sensitive impact queries
(uuid_generate_v4(), 'impact', 'context', 'Which companies have the most significant impact on {target_segment} customers in {industry}?', '["target_segment", "industry"]', '["target_segment", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'impact', 'context', 'What brands are driving the most customer success through {technology} in {industry}?', '["technology", "industry"]', '["technology", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'impact', 'context', 'Who leads in customer satisfaction for {solution_type} solutions in {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Competitive impact queries
(uuid_generate_v4(), 'impact', 'competitive', 'What is the customer satisfaction ranking of {company} compared to its competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'impact', 'competitive', 'How does {company} rank in terms of customer retention compared to its competitors in {industry}?', '["company", "industry"]', '["company", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000');

-- Sentiment templates with different query types
INSERT INTO query_templates (id, type, query_type, template, placeholders, "requiredPlaceholders", priority, "isActive", "businessCategoryId") VALUES
-- Industry-wide sentiment queries
(uuid_generate_v4(), 'sentiment', 'industry', 'What brands do people love the most for {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'sentiment', 'industry', 'Which companies have the best reputation for {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'sentiment', 'industry', 'Who is getting the most positive feedback for their {product/service}?', '["product/service"]', '["product/service"]', 1, true, '00000000-0000-0000-0000-000000000000'),
-- Context-sensitive sentiment queries
(uuid_generate_v4(), 'sentiment', 'context', 'Which companies have the most positive sentiment in the {solution_type} market of {industry}?', '["solution_type", "industry"]', '["solution_type", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'sentiment', 'context', 'What brands are most trusted for {technology} in {industry}?', '["technology", "industry"]', '["technology", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000'),
(uuid_generate_v4(), 'sentiment', 'context', 'Who is generating the most loyalty among {target_segment} customers in {industry}?', '["target_segment", "industry"]', '["target_segment", "industry"]', 1, true, '00000000-0000-0000-0000-000000000000');