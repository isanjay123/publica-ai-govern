create or replace function public.verify_audit_chain()
returns table(total bigint, valid boolean, first_broken_id bigint)
language plpgsql stable security definer set search_path = public as $$
declare r record; prev text := null; expected text; cnt bigint := 0; broken bigint := null;
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'not authorised';
  end if;
  for r in select * from public.audit_logs order by id loop
    cnt := cnt + 1;
    expected := encode(sha256(convert_to(
      coalesce(prev,'GENESIS') || '|' || r.audit_id::text || '|' || r.occurred_at::text || '|' ||
      coalesce(r.user_id::text,'') || '|' || coalesce(r.role,'') || '|' ||
      coalesce(r.application_id::text,'') || '|' || r.action || '|' || coalesce(r.reason,'') || '|' || r.payload::text
    ,'utf8')),'hex');
    if broken is null and (coalesce(r.previous_hash,'') <> coalesce(prev,'') or r.current_hash <> expected) then
      broken := r.id;
    end if;
    prev := r.current_hash;
  end loop;
  return query select cnt, broken is null, broken;
end; $$;
revoke all on function public.verify_audit_chain() from public, anon;
grant execute on function public.verify_audit_chain() to authenticated;