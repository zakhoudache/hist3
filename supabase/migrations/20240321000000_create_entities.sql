create table public.entities (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  type text not null,
  relationships jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.entities enable row level security;

-- Create policy
create policy "Enable read access for all users" on public.entities
  for select using (true);

create policy "Enable insert access for authenticated users" on public.entities
  for insert with check (auth.role() = 'authenticated');
