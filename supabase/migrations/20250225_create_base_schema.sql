-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create users table (extends Supabase auth.users)
create table if not exists public.user_profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create RLS policies for user_profiles
alter table public.user_profiles enable row level security;

create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Create function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create audit log table
create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users,
  action text not null,
  resource text not null,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Create indexes
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at);

-- Create audit logging function
create or replace function public.log_audit_event(
  p_user_id uuid,
  p_action text,
  p_resource text,
  p_details jsonb default null,
  p_ip_address inet default null,
  p_user_agent text default null
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.audit_logs (
    user_id, action, resource, details, ip_address, user_agent
  ) values (
    p_user_id, p_action, p_resource, p_details, p_ip_address, p_user_agent
  );
end;
$$; 