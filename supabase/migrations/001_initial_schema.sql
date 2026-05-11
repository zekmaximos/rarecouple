create extension if not exists pgcrypto;

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'RareCouple',
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz not null default now()
);

create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  occurred_on date not null default current_date,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  transaction_type text not null check (transaction_type in ('expense', 'income', 'investment', 'transfer')),
  category text not null,
  payment_method text not null,
  installments_total integer not null default 1 check (installments_total > 0),
  installment_number integer not null default 1 check (installment_number > 0),
  is_fixed boolean not null default false,
  is_recurring boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_couple_date_idx on public.transactions (couple_id, occurred_on desc);
create index transactions_category_idx on public.transactions (couple_id, category);
create index couple_members_user_idx on public.couple_members (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.transactions enable row level security;

create policy "Couples are visible to members"
on public.couples
for select
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = id and cm.user_id = auth.uid()
  )
  or owner_id = auth.uid()
);

create policy "Users can create owned couples"
on public.couples
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Owners can update their couples"
on public.couples
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Members can view household members"
on public.couple_members
for select
to authenticated
using (user_id = auth.uid());

create policy "Owners can add themselves to owned couples"
on public.couple_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.couples c
    where c.id = couple_id and c.owner_id = auth.uid()
  )
);

create policy "Members can read transactions"
on public.transactions
for select
to authenticated
using (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()
  )
);

create policy "Members can create transactions"
on public.transactions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.couple_members cm
    where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()
  )
);

create policy "Creators and owners can update transactions"
on public.transactions
for update
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.couple_members cm
    where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()
  )
);

create policy "Creators and owners can delete transactions"
on public.transactions
for delete
to authenticated
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.owner_id = auth.uid()
  )
);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.couples to authenticated;
grant select, insert, update, delete on public.couple_members to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
