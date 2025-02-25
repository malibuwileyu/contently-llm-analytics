-- Drop all policies first
drop policy if exists "Users can view team members" on public.team_members;
drop policy if exists "Users can view organization members" on public.organization_members;
drop policy if exists "Organization admins can manage teams" on public.teams;
drop policy if exists "Users can view teams in their organizations" on public.teams;
drop policy if exists "Organization admins can update their organizations" on public.organizations;
drop policy if exists "Users can view organizations they are members of" on public.organizations;

-- Drop indexes
drop index if exists idx_team_members_user;
drop index if exists idx_org_members_user;
drop index if exists idx_teams_organization;
drop index if exists idx_organizations_slug;

-- Drop tables in correct order
drop table if exists public.team_members;
drop table if exists public.organization_members;
drop table if exists public.teams;
drop table if exists public.organizations; 