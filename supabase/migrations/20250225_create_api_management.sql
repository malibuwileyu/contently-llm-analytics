-- Create API keys table
create table public.api_keys (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    name text not null,
    key_hash text not null unique,
    scopes text[] not null default array[]::text[],
    expires_at timestamptz,
    created_by uuid not null references auth.users(id),
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    is_active boolean not null default true
);

-- Create API key usage logs
create table public.api_key_logs (
    id uuid primary key default uuid_generate_v4(),
    api_key_id uuid not null references public.api_keys(id) on delete cascade,
    endpoint text not null,
    method text not null,
    status_code integer not null,
    response_time interval not null,
    ip_address inet,
    user_agent text,
    created_at timestamptz not null default now()
);

-- Create access tokens table for temporary access
create table public.access_tokens (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    token_hash text not null unique,
    purpose text not null,
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz
);

-- Create function to generate secure API key
create or replace function generate_api_key() returns text as $$
declare
    key text;
begin
    key := encode(gen_random_bytes(32), 'hex');
    return key;
end;
$$ language plpgsql security definer;

-- Create function to hash API key
create or replace function hash_api_key(key text) returns text as $$
begin
    return encode(digest(key, 'sha256'), 'hex');
end;
$$ language plpgsql immutable security definer;

-- Create indexes
create index idx_api_keys_org on public.api_keys(organization_id);
create index idx_api_keys_active on public.api_keys(is_active);
create index idx_api_key_logs_key on public.api_key_logs(api_key_id);
create index idx_api_key_logs_created on public.api_key_logs(created_at);
create index idx_access_tokens_user on public.access_tokens(user_id);
create index idx_access_tokens_expires on public.access_tokens(expires_at);

-- Enable RLS
alter table public.api_keys enable row level security;
alter table public.api_key_logs enable row level security;
alter table public.access_tokens enable row level security;

-- API key policies
create policy "Organization admins can manage API keys"
    on public.api_keys for all
    using (exists (
        select 1 from public.organization_members
        where organization_id = api_keys.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    ));

create policy "Users can view API keys in their organizations"
    on public.api_keys for select
    using (exists (
        select 1 from public.organization_members
        where organization_id = api_keys.organization_id
        and user_id = auth.uid()
    ));

-- API key logs policies
create policy "Users can view API key logs in their organizations"
    on public.api_key_logs for select
    using (exists (
        select 1 from public.api_keys ak
        join public.organization_members om on ak.organization_id = om.organization_id
        where ak.id = api_key_logs.api_key_id
        and om.user_id = auth.uid()
    ));

-- Access token policies
create policy "Users can manage their own access tokens"
    on public.access_tokens for all
    using (user_id = auth.uid());

-- Create function to clean expired tokens
create or replace function clean_expired_tokens() returns void as $$
begin
    delete from public.access_tokens where expires_at < now();
    delete from public.api_keys where expires_at < now();
end;
$$ language plpgsql security definer;

-- Create scheduled job to clean expired tokens (runs daily)
select cron.schedule(
    'clean-expired-tokens',
    '0 0 * * *',
    $$select clean_expired_tokens();$$
); 