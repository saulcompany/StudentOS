create table if not exists public.student_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.student_data to authenticated;
revoke all on public.student_data from anon;

alter table public.student_data enable row level security;

drop policy if exists "Users can read their own StudentOS data" on public.student_data;
create policy "Users can read their own StudentOS data"
  on public.student_data
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own StudentOS data" on public.student_data;
create policy "Users can create their own StudentOS data"
  on public.student_data
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own StudentOS data" on public.student_data;
create policy "Users can update their own StudentOS data"
  on public.student_data
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.set_student_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_student_data_updated_at on public.student_data;
create trigger set_student_data_updated_at
  before update on public.student_data
  for each row
  execute function public.set_student_data_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-notes',
  'study-notes',
  false,
  10485760,
  array[
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own study notes" on storage.objects;
create policy "Users can upload their own study notes"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'study-notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read their own study notes" on storage.objects;
create policy "Users can read their own study notes"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'study-notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own study notes" on storage.objects;
create policy "Users can delete their own study notes"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'study-notes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
