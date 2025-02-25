-- Drop all policies first
drop policy if exists "Users can view metrics in their organizations" on public.content_metrics;
drop policy if exists "Users can view analytics in their organizations" on public.content_analytics;
drop policy if exists "Users can view content versions in their organizations" on public.content_versions;
drop policy if exists "Users can manage content in their organizations" on public.content;
drop policy if exists "Users can view content in their organizations" on public.content;

-- Drop indexes
drop index if exists idx_content_metrics_type_timestamp;
drop index if exists idx_content_metrics_timestamp;
drop index if exists idx_content_analytics;
drop index if exists idx_content_versions;
drop index if exists idx_content_published_at;
drop index if exists idx_content_status;
drop index if exists idx_content_created_by;
drop index if exists idx_content_organization;

-- Drop tables in correct order
drop table if exists public.content_metrics;
drop table if exists public.content_analytics;
drop table if exists public.content_versions;
drop table if exists public.content; 