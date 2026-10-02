drop policy if exists "audit insert" on public.audit_logs;
revoke insert on public.audit_logs from authenticated;

drop policy if exists "timeline insert" on public.application_status_history;
create policy "timeline insert owner or staff" on public.application_status_history
for insert to authenticated with check (
  public.is_staff(auth.uid()) or exists (
    select 1 from public.applications a where a.id = application_id and a.citizen_id = auth.uid()
  )
);

drop policy if exists "verif insert" on public.document_verification_results;
create policy "verif insert owner or staff" on public.document_verification_results
for insert to authenticated with check (
  public.is_staff(auth.uid()) or exists (
    select 1 from public.applications a where a.id = application_id and a.citizen_id = auth.uid()
  )
);

drop policy if exists "notifications insert" on public.notifications;
create policy "notifications insert own" on public.notifications
for insert to authenticated with check (user_id = auth.uid());

create policy "docs upload own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'application-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read own folder or staff" on storage.objects for select to authenticated
using (bucket_id = 'application-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));