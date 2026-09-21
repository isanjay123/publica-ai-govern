-- ============ ENUMS ============
create type public.app_role as enum ('citizen','officer','dept_admin','oversight','super_admin');
create type public.application_status as enum ('submitted','document_verification','officer_review','department_approval','certificate_generation','completed','rejected','additional_documents_required');
create type public.grievance_status as enum ('submitted','acknowledged','assigned','under_review','response_prepared','resolved');
create type public.report_status as enum ('received','under_assessment','investigating','action_taken','closed');
create type public.delay_flag as enum ('normal','approaching_sla','delayed','highly_delayed','anomalous');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Citizen',
  email text,
  phone text,
  district text,
  preferred_language text not null default 'en',
  identity_verified boolean not null default false,
  department_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  department_id uuid,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role <> 'citizen')
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile write" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own roles read" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'super_admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Citizen'), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'citizen') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ============ DEPARTMENTS / SERVICES ============
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  description text,
  created_at timestamptz not null default now()
);
grant select on public.departments to anon, authenticated;
grant all on public.departments to service_role;
alter table public.departments enable row level security;
create policy "departments public read" on public.departments for select to anon, authenticated using (true);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  name text not null,
  code text not null unique,
  description text not null default '',
  eligibility text not null default '',
  required_documents text[] not null default '{}',
  fee_amount numeric not null default 0,
  sla_days integer not null default 15,
  stages text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "services public read" on public.services for select to anon, authenticated using (true);

create table public.sla_configurations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  stage text not null,
  max_days integer not null,
  created_at timestamptz not null default now()
);
grant select on public.sla_configurations to anon, authenticated;
grant all on public.sla_configurations to service_role;
alter table public.sla_configurations enable row level security;
create policy "sla public read" on public.sla_configurations for select to anon, authenticated using (true);

-- ============ APPLICATIONS ============
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  citizen_id uuid references auth.users(id) on delete set null,
  service_id uuid not null references public.services(id),
  department_id uuid not null references public.departments(id),
  assigned_officer_id uuid references auth.users(id) on delete set null,
  officer_code text,
  status public.application_status not null default 'submitted',
  current_stage text not null default 'Application Submitted',
  applicant_name text,
  district text,
  form_data jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  expected_completion_at timestamptz,
  sla_deadline timestamptz,
  completed_at timestamptz,
  delay_flag public.delay_flag not null default 'normal',
  ai_recommendation text,
  ai_confidence numeric,
  human_decision text,
  decision_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index applications_citizen_idx on public.applications(citizen_id);
create index applications_dept_idx on public.applications(department_id);
create index applications_status_idx on public.applications(status);
grant select, insert, update on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "citizen reads own or demo" on public.applications for select to authenticated
  using (citizen_id = auth.uid() or is_demo or public.is_staff(auth.uid()));
create policy "citizen creates own" on public.applications for insert to authenticated with check (citizen_id = auth.uid());
create policy "staff updates" on public.applications for update to authenticated using (public.is_staff(auth.uid()));

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  stage text not null,
  action text not null,
  actor_label text not null default 'System',
  department_id uuid references public.departments(id),
  comment text,
  created_at timestamptz not null default now()
);
create index ash_app_idx on public.application_status_history(application_id);
grant select, insert on public.application_status_history to authenticated;
grant all on public.application_status_history to service_role;
alter table public.application_status_history enable row level security;
create policy "timeline follows application" on public.application_status_history for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and (a.citizen_id = auth.uid() or a.is_demo or public.is_staff(auth.uid()))));
create policy "timeline insert" on public.application_status_history for insert to authenticated with check (true);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  doc_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.application_documents to authenticated;
grant all on public.application_documents to service_role;
alter table public.application_documents enable row level security;
create policy "docs follow application" on public.application_documents for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and (a.citizen_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "docs insert own" on public.application_documents for insert to authenticated with check (uploaded_by = auth.uid());
create policy "docs delete own" on public.application_documents for delete to authenticated using (uploaded_by = auth.uid());

create table public.document_verification_results (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.application_documents(id) on delete cascade,
  application_id uuid not null references public.applications(id) on delete cascade,
  detected_type text,
  extracted_fields jsonb not null default '{}'::jsonb,
  checks jsonb not null default '[]'::jsonb,
  result text not null default 'pending',
  explanation text,
  confidence numeric,
  model text,
  prompt_version text,
  human_review_status text not null default 'pending',
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.document_verification_results to authenticated;
grant all on public.document_verification_results to service_role;
alter table public.document_verification_results enable row level security;
create policy "verif follow application" on public.document_verification_results for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and (a.citizen_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "verif insert" on public.document_verification_results for insert to authenticated with check (true);
create policy "verif staff update" on public.document_verification_results for update to authenticated using (public.is_staff(auth.uid()));

-- ============ GRIEVANCES ============
create table public.grievances (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  citizen_id uuid references auth.users(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  department_id uuid references public.departments(id),
  category text not null,
  subject text not null,
  description text not null,
  status public.grievance_status not null default 'submitted',
  assigned_to uuid references auth.users(id) on delete set null,
  response text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.grievances to authenticated;
grant all on public.grievances to service_role;
alter table public.grievances enable row level security;
create policy "grievance own or staff" on public.grievances for select to authenticated
  using (citizen_id = auth.uid() or is_demo or public.is_staff(auth.uid()));
create policy "grievance insert own" on public.grievances for insert to authenticated with check (citizen_id = auth.uid());
create policy "grievance staff update" on public.grievances for update to authenticated using (public.is_staff(auth.uid()));

-- ============ INTEGRITY REPORTS ============
create table public.integrity_reports (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique,
  access_code_hash text not null,
  category text not null,
  description text not null,
  department_id uuid references public.departments(id),
  application_reference text,
  incident_at timestamptz,
  contact_info text,
  status public.report_status not null default 'received',
  oversight_notes text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.integrity_reports to authenticated;
grant all on public.integrity_reports to service_role;
alter table public.integrity_reports enable row level security;
create policy "integrity oversight read" on public.integrity_reports for select to authenticated
  using (public.has_role(auth.uid(),'oversight') or public.has_role(auth.uid(),'super_admin'));
create policy "integrity oversight update" on public.integrity_reports for update to authenticated
  using (public.has_role(auth.uid(),'oversight') or public.has_role(auth.uid(),'super_admin'));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  channel text not null default 'in_app',
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id);
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "notifications insert" on public.notifications for insert to authenticated with check (true);

-- ============ AUDIT LOG (append-only hash chain) ============
create table public.audit_logs (
  id bigserial primary key,
  audit_id uuid not null default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  user_id uuid,
  role text,
  department_id uuid,
  application_id uuid,
  action text not null,
  reason text,
  payload jsonb not null default '{}'::jsonb,
  previous_hash text,
  current_hash text
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit read staff" on public.audit_logs for select to authenticated using (public.is_staff(auth.uid()));
create policy "audit insert" on public.audit_logs for insert to authenticated with check (true);

create or replace function public.audit_hash_chain()
returns trigger language plpgsql security definer set search_path = public as $$
declare prev text;
begin
  select current_hash into prev from public.audit_logs order by id desc limit 1;
  new.previous_hash := prev;
  new.current_hash := encode(sha256(convert_to(
    coalesce(prev,'GENESIS') || '|' || new.audit_id::text || '|' || new.occurred_at::text || '|' ||
    coalesce(new.user_id::text,'') || '|' || coalesce(new.role,'') || '|' ||
    coalesce(new.application_id::text,'') || '|' || new.action || '|' || coalesce(new.reason,'') || '|' || new.payload::text
  ,'utf8')),'hex');
  return new;
end; $$;
create trigger audit_logs_hash before insert on public.audit_logs
for each row execute function public.audit_hash_chain();

create or replace function public.prevent_audit_mutation()
returns trigger language plpgsql as $$ begin
  raise exception 'audit_logs is append-only';
end; $$;
create trigger audit_logs_no_update before update or delete on public.audit_logs
for each row execute function public.prevent_audit_mutation();

-- ============ KNOWLEDGE / AI ============
create table public.government_rules (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id) on delete cascade,
  service_code text,
  title text not null,
  rule_text text not null,
  citation text,
  created_at timestamptz not null default now()
);
grant select on public.government_rules to anon, authenticated;
grant all on public.government_rules to service_role;
alter table public.government_rules enable row level security;
create policy "rules public read" on public.government_rules for select to anon, authenticated using (true);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null default 'Publica Knowledge Base (demo)',
  category text,
  content text not null,
  created_at timestamptz not null default now()
);
grant select on public.knowledge_documents to anon, authenticated;
grant all on public.knowledge_documents to service_role;
alter table public.knowledge_documents enable row level security;
create policy "kb public read" on public.knowledge_documents for select to anon, authenticated using (true);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  language text not null default 'en',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.ai_conversations to authenticated;
grant all on public.ai_conversations to service_role;
alter table public.ai_conversations enable row level security;
create policy "own conversations" on public.ai_conversations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  model text,
  created_at timestamptz not null default now()
);
grant select, insert on public.ai_messages to authenticated;
grant all on public.ai_messages to service_role;
alter table public.ai_messages enable row level security;
create policy "own messages" on public.ai_messages for select to authenticated
  using (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "own messages insert" on public.ai_messages for insert to authenticated
  with check (exists (select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- ============ DEMO DATA ============
insert into public.departments (id, name, code, description) values
 ('11111111-1111-1111-1111-111111111101','Revenue Department','REV','Land records, certificates and revenue services.'),
 ('11111111-1111-1111-1111-111111111102','Transport Department','TRN','Vehicle registration, licensing and permits.'),
 ('11111111-1111-1111-1111-111111111103','Municipal Services','MUN','Civic services, building permits and sanitation.'),
 ('11111111-1111-1111-1111-111111111104','Social Welfare Department','SWD','Welfare schemes, pensions and assistance.'),
 ('11111111-1111-1111-1111-111111111105','Business Licensing Department','BLD','Trade licences and business registrations.');

insert into public.services (id, department_id, name, code, description, eligibility, required_documents, fee_amount, sla_days, stages) values
 ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','Birth Certificate','BIRTH-CERT','Official record of birth issued by the Revenue Department.','Birth registered within the district.', ARRAY['Hospital birth record','Parent identity proof','Address proof'], 50, 7, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']),
 ('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','Income Certificate','INCOME-CERT','Certificate stating annual household income.','Resident of the district with income proof.', ARRAY['Identity proof','Address proof','Salary slip or income declaration'], 30, 10, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']),
 ('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111105','Business License','BUS-LIC','Licence to operate a commercial establishment.','Registered premises within municipal limits.', ARRAY['Identity proof','Premises ownership or rent agreement','Tax registration'], 1500, 21, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']),
 ('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111103','Building Permit','BLD-PERMIT','Permission to construct or modify a building.','Clear title and approved site plan.', ARRAY['Site plan','Ownership document','Structural drawing'], 3500, 30, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']),
 ('22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111102','Vehicle Registration','VEH-REG','Registration of a new or transferred vehicle.','Valid purchase invoice and insurance.', ARRAY['Purchase invoice','Insurance certificate','Identity proof'], 800, 14, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']),
 ('22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111104','Welfare Scheme Application','WELFARE','Application for social welfare assistance.','Household income below the notified threshold.', ARRAY['Income certificate','Identity proof','Bank account proof'], 0, 20, ARRAY['Application Submitted','Document Verification','Officer Review','Department Approval','Certificate Generation','Completed']);

insert into public.government_rules (department_id, service_code, title, rule_text, citation) values
 ('11111111-1111-1111-1111-111111111101','BIRTH-CERT','Birth registration timeline','A birth certificate application is processed within 7 working days of submission of complete documents.','Demo Rule RD-7/2026'),
 ('11111111-1111-1111-1111-111111111101','INCOME-CERT','Income certificate validity','An income certificate is valid for one year from the date of issue.','Demo Rule RD-11/2026'),
 ('11111111-1111-1111-1111-111111111105','BUS-LIC','Business licence inspection','A premises inspection is required before a business licence is approved.','Demo Rule BL-3/2026'),
 ('11111111-1111-1111-1111-111111111103','BLD-PERMIT','Building permit scrutiny','Building plans are scrutinised against the local development control rules before approval.','Demo Rule MU-9/2026'),
 ('11111111-1111-1111-1111-111111111102','VEH-REG','Vehicle registration documents','Vehicle registration requires a valid invoice, insurance certificate and identity proof.','Demo Rule TR-4/2026'),
 ('11111111-1111-1111-1111-111111111104','WELFARE','Welfare eligibility','Welfare assistance is granted to households below the notified annual income threshold.','Demo Rule SW-2/2026');

insert into public.knowledge_documents (title, category, content) values
 ('How to apply for a Birth Certificate','service','Submit the hospital birth record, a parent identity proof and an address proof. The Revenue Department verifies documents and issues the certificate within 7 working days. Fee: 50.'),
 ('Business License process','service','A business licence application is reviewed by the Business Licensing Department. A premises inspection is scheduled during officer review. Standard service level is 21 days. Fee: 1500.'),
 ('Grievance redressal','process','Any citizen may file a grievance about service delay, officer conduct, technical issues or an incorrect rejection. Grievances move through acknowledgement, assignment, review, response preparation and resolution.'),
 ('Integrity reporting','process','Integrity concerns such as requests for unofficial payments may be reported anonymously. Reports are routed only to authorised oversight personnel and tracked using a secure report ID.'),
 ('Service level agreements','policy','Every service has a published service level agreement in working days. Applications approaching or exceeding the SLA are flagged for administrative review, not treated as proof of misconduct.');

insert into public.applications (reference_id, service_id, department_id, officer_code, status, current_stage, applicant_name, district, submitted_at, expected_completion_at, sla_deadline, completed_at, delay_flag, is_demo) values
 ('PUB-2026-000184','22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111105','OFF-BLD-014','officer_review','Officer Review','Demo Applicant','Central', now() - interval '9 days', now() + interval '12 days', now() + interval '12 days', null,'normal',true),
 ('PUB-2026-000185','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','OFF-REV-003','completed','Completed','Demo Applicant','North', now() - interval '20 days', now() - interval '14 days', now() - interval '13 days', now() - interval '14 days','normal',true),
 ('PUB-2026-000186','22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111103','OFF-MUN-021','document_verification','Document Verification','Demo Applicant','East', now() - interval '34 days', now() - interval '4 days', now() - interval '4 days', null,'delayed',true),
 ('PUB-2026-000187','22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111102','OFF-TRN-008','department_approval','Department Approval','Demo Applicant','West', now() - interval '12 days', now() + interval '2 days', now() + interval '2 days', null,'approaching_sla',true),
 ('PUB-2026-000188','22222222-2222-2222-2222-222222222206','11111111-1111-1111-1111-111111111104','OFF-SWD-005','completed','Completed','Demo Applicant','South', now() - interval '45 days', now() - interval '27 days', now() - interval '25 days', now() - interval '27 days','normal',true),
 ('PUB-2026-000189','22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','OFF-REV-011','additional_documents_required','Document Verification','Demo Applicant','North', now() - interval '6 days', now() + interval '4 days', now() + interval '4 days', null,'normal',true),
 ('PUB-2026-000190','22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111105','OFF-BLD-014','completed','Completed','Demo Applicant','Central', now() - interval '60 days', now() - interval '41 days', now() - interval '39 days', now() - interval '41 days','normal',true),
 ('PUB-2026-000191','22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111103','OFF-MUN-021','officer_review','Officer Review','Demo Applicant','East', now() - interval '41 days', now() - interval '11 days', now() - interval '11 days', null,'highly_delayed',true);

insert into public.application_status_history (application_id, stage, action, actor_label, department_id, comment)
select a.id, 'Application Submitted','Application submitted','Citizen portal', a.department_id, 'Demo record'
from public.applications a where a.is_demo;
insert into public.application_status_history (application_id, stage, action, actor_label, department_id, comment)
select a.id, 'Document Verification','Documents received and verification started','Publica document service', a.department_id, 'Automated intake check completed'
from public.applications a where a.is_demo;
insert into public.application_status_history (application_id, stage, action, actor_label, department_id, comment)
select a.id, 'Officer Review','Application assigned for officer review', coalesce(a.officer_code,'Officer'), a.department_id, 'Assigned by workload queue'
from public.applications a where a.is_demo and a.status in ('officer_review','department_approval','certificate_generation','completed');

insert into public.grievances (reference_id, category, subject, description, status, department_id, is_demo) values
 ('GRV-2026-000031','Service delay','Building permit pending beyond service level','Demo grievance: the building permit application has crossed its published timeline.','under_review','11111111-1111-1111-1111-111111111103',true),
 ('GRV-2026-000032','Technical issue','Document upload failed repeatedly','Demo grievance: uploads failed during submission.','resolved','11111111-1111-1111-1111-111111111101',true),
 ('GRV-2026-000033','Incorrect rejection','Income certificate rejected without reason','Demo grievance: rejection reason was not explained.','assigned','11111111-1111-1111-1111-111111111101',true);
