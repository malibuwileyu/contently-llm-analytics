-- Create content table
create table public.content (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title text not null,
    description text,
    content_type text not null,
    status text not null check (status in ('draft', 'published', 'archived')),
    metadata jsonb not null default '{}',
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    published_at timestamptz
);

-- Create content_versions table for version history
create table public.content_versions (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null references public.content(id) on delete cascade,
    version_number integer not null,
    changes jsonb not null,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    unique(content_id, version_number)
);

-- Create content_analytics table
create table public.content_analytics (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null references public.content(id) on delete cascade,
    views bigint not null default 0,
    unique_views bigint not null default 0,
    avg_time_spent interval,
    bounce_rate decimal,
    engagement_score decimal,
    last_updated_at timestamptz not null default now()
);

-- Create content_metrics table for time-series data
create table public.content_metrics (
    id uuid primary key default uuid_generate_v4(),
    content_id uuid not null references public.content(id) on delete cascade,
    metric_type text not null,
    value decimal not null,
    timestamp timestamptz not null default now()
);

-- Create indexes
create index idx_content_organization on public.content(organization_id);
create index idx_content_created_by on public.content(created_by);
create index idx_content_status on public.content(status);
create index idx_content_published_at on public.content(published_at);
create index idx_content_versions on public.content_versions(content_id, version_number);
create index idx_content_analytics on public.content_analytics(content_id);
create index idx_content_metrics_timestamp on public.content_metrics(timestamp);
create index idx_content_metrics_type_timestamp on public.content_metrics(metric_type, timestamp);

-- Enable RLS
alter table public.content enable row level security;
alter table public.content_versions enable row level security;
alter table public.content_analytics enable row level security;
alter table public.content_metrics enable row level security;

-- Content policies
create policy "Users can view content in their organizations"
    on public.content for select
    using (exists (
        select 1 from public.organization_members
        where organization_id = content.organization_id
        and user_id = auth.uid()
    ));

create policy "Users can manage content in their organizations"
    on public.content for all
    using (exists (
        select 1 from public.organization_members
        where organization_id = content.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin', 'member')
    ));

-- Version policies
create policy "Users can view content versions in their organizations"
    on public.content_versions for select
    using (exists (
        select 1 from public.content c
        join public.organization_members om on c.organization_id = om.organization_id
        where c.id = content_versions.content_id
        and om.user_id = auth.uid()
    ));

-- Analytics policies
create policy "Users can view analytics in their organizations"
    on public.content_analytics for select
    using (exists (
        select 1 from public.content c
        join public.organization_members om on c.organization_id = om.organization_id
        where c.id = content_analytics.content_id
        and om.user_id = auth.uid()
    ));

-- Metrics policies
create policy "Users can view metrics in their organizations"
    on public.content_metrics for select
    using (exists (
        select 1 from public.content c
        join public.organization_members om on c.organization_id = om.organization_id
        where c.id = content_metrics.content_id
        and om.user_id = auth.uid()
    )); 