-- Create the health check function
create or replace function public.get_system_health()
returns json
language plpgsql
security definer
as $$
begin
  -- Simple health check that verifies database connectivity
  return json_build_object(
    'status', 'healthy',
    'timestamp', current_timestamp,
    'version', version()
  );
end;
$$;

-- Grant access to the anonymous role
grant execute on function public.get_system_health() to anon;
grant execute on function public.get_system_health() to authenticated; 