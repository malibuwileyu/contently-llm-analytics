-- Drop audit logging function
drop function if exists public.log_audit_event;

-- Drop audit logs table and indexes
drop index if exists idx_audit_logs_created_at;
drop index if exists idx_audit_logs_user_id;
drop table if exists public.audit_logs;

-- Drop user profile trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user;

-- Drop RLS policies
drop policy if exists "Users can update their own profile" on public.user_profiles;
drop policy if exists "Users can view their own profile" on public.user_profiles;

-- Drop user profiles table
drop table if exists public.user_profiles; 