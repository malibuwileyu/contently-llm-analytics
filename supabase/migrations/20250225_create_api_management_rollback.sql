-- Drop scheduled job
select cron.unschedule('clean-expired-tokens');

-- Drop functions
drop function if exists clean_expired_tokens();
drop function if exists hash_api_key(text);
drop function if exists generate_api_key();

-- Drop policies
drop policy if exists "Users can manage their own access tokens" on public.access_tokens;
drop policy if exists "Users can view API key logs in their organizations" on public.api_key_logs;
drop policy if exists "Users can view API keys in their organizations" on public.api_keys;
drop policy if exists "Organization admins can manage API keys" on public.api_keys;

-- Drop indexes
drop index if exists idx_access_tokens_expires;
drop index if exists idx_access_tokens_user;
drop index if exists idx_api_key_logs_created;
drop index if exists idx_api_key_logs_key;
drop index if exists idx_api_keys_active;
drop index if exists idx_api_keys_org;

-- Drop tables in correct order
drop table if exists public.api_key_logs;
drop table if exists public.access_tokens;
drop table if exists public.api_keys; 