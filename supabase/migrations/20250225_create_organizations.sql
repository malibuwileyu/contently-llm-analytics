-- Create organizations table
create table public.organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    settings jsonb not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create teams table
create table public.teams (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Create organization_members junction table
create table public.organization_members (
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('owner', 'admin', 'member')),
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

-- Create team_members junction table
create table public.team_members (
    team_id uuid not null references public.teams(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('lead', 'member')),
    created_at timestamptz not null default now(),
    primary key (team_id, user_id)
);

-- Create indexes
create index idx_organizations_slug on public.organizations(slug);
create index idx_teams_organization on public.teams(organization_id);
create index idx_org_members_user on public.organization_members(user_id);
create index idx_team_members_user on public.team_members(user_id);

-- RLS Policies
alter table public.organizations enable row level security;
alter table public.teams enable row level security;
alter table public.organization_members enable row level security;
alter table public.team_members enable row level security;

-- Organization policies
create policy "Users can view organizations they are members of"
    on public.organizations for select
    using (exists (
        select 1 from public.organization_members
        where organization_id = organizations.id
        and user_id = auth.uid()
    ));

create policy "Organization admins can update their organizations"
    on public.organizations for update
    using (exists (
        select 1 from public.organization_members
        where organization_id = organizations.id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    ));

-- Team policies
create policy "Users can view teams in their organizations"
    on public.teams for select
    using (exists (
        select 1 from public.organization_members
        where organization_id = teams.organization_id
        and user_id = auth.uid()
    ));

create policy "Organization admins can manage teams"
    on public.teams for all
    using (exists (
        select 1 from public.organization_members
        where organization_id = teams.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'admin')
    ));

-- Member policies
create policy "Users can view organization members"
    on public.organization_members for select
    using (exists (
        select 1 from public.organization_members om
        where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
    ));

create policy "Users can view team members"
    on public.team_members for select
    using (exists (
        select 1 from public.team_members tm
        where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid()
    )); 