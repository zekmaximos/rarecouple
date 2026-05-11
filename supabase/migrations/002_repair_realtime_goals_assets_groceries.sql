create extension if not exists pgcrypto;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'RareCouple',
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  created_at timestamptz not null default now()
);

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create table if not exists public.transactions (
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

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  owner_label text not null default 'Coletiva' check (owner_label in ('Coletiva', 'Samuel', 'Esposa')),
  title text not null,
  target_amount numeric(14,2) not null check (target_amount > 0),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  monthly_action text,
  target_date date,
  status text not null default 'active' check (status in ('active', 'paused', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  name text not null,
  asset_type text not null default 'Outro',
  estimated_value numeric(14,2) not null check (estimated_value >= 0),
  acquisition_value numeric(14,2) check (acquisition_value >= 0),
  acquired_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grocery_items (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  purchased_on date not null default current_date,
  item_name text not null,
  category text not null default 'Alimentos',
  amount numeric(14,2) not null check (amount > 0),
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  store text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists couple_members_user_idx on public.couple_members (user_id);
create index if not exists transactions_couple_date_idx on public.transactions (couple_id, occurred_on desc);
create index if not exists transactions_category_idx on public.transactions (couple_id, category);
create index if not exists financial_goals_couple_idx on public.financial_goals (couple_id, status);
create index if not exists assets_couple_idx on public.assets (couple_id, asset_type);
create index if not exists grocery_items_couple_month_idx on public.grocery_items (couple_id, purchased_on desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at before update on public.transactions for each row execute function public.set_updated_at();
drop trigger if exists financial_goals_set_updated_at on public.financial_goals;
create trigger financial_goals_set_updated_at before update on public.financial_goals for each row execute function public.set_updated_at();
drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at before update on public.assets for each row execute function public.set_updated_at();
drop trigger if exists grocery_items_set_updated_at on public.grocery_items;
create trigger grocery_items_set_updated_at before update on public.grocery_items for each row execute function public.set_updated_at();

alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.transactions enable row level security;
alter table public.financial_goals enable row level security;
alter table public.assets enable row level security;
alter table public.grocery_items enable row level security;

drop policy if exists "Couples are visible to members" on public.couples;
create policy "Couples are visible to members" on public.couples for select to authenticated
using (owner_id = auth.uid() or exists (select 1 from public.couple_members cm where cm.couple_id = id and cm.user_id = auth.uid()));

drop policy if exists "Users can create owned couples" on public.couples;
create policy "Users can create owned couples" on public.couples for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "Owners can update their couples" on public.couples;
create policy "Owners can update their couples" on public.couples for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "Members can view household members" on public.couple_members;
create policy "Members can view household members" on public.couple_members for select to authenticated
using (user_id = auth.uid() or exists (select 1 from public.couple_members viewer where viewer.couple_id = couple_members.couple_id and viewer.user_id = auth.uid()));

drop policy if exists "Owners can add themselves to owned couples" on public.couple_members;
create policy "Owners can add themselves to owned couples" on public.couple_members for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.couples c where c.id = couple_id and c.owner_id = auth.uid()));

drop policy if exists "Members can read transactions" on public.transactions;
create policy "Members can read transactions" on public.transactions for select to authenticated
using (exists (select 1 from public.couple_members cm where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()));

drop policy if exists "Members can create transactions" on public.transactions;
create policy "Members can create transactions" on public.transactions for insert to authenticated
with check (created_by = auth.uid() and exists (select 1 from public.couple_members cm where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()));

drop policy if exists "Creators and owners can update transactions" on public.transactions;
create policy "Creators and owners can update transactions" on public.transactions for update to authenticated
using (created_by = auth.uid() or exists (select 1 from public.couples c where c.id = transactions.couple_id and c.owner_id = auth.uid()))
with check (exists (select 1 from public.couple_members cm where cm.couple_id = transactions.couple_id and cm.user_id = auth.uid()));

drop policy if exists "Creators and owners can delete transactions" on public.transactions;
create policy "Creators and owners can delete transactions" on public.transactions for delete to authenticated
using (created_by = auth.uid() or exists (select 1 from public.couples c where c.id = transactions.couple_id and c.owner_id = auth.uid()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['financial_goals', 'assets', 'grocery_items']
  loop
    execute format('drop policy if exists "Members can read %1$s" on public.%1$I', table_name);
    execute format('create policy "Members can read %1$s" on public.%1$I for select to authenticated using (exists (select 1 from public.couple_members cm where cm.couple_id = %1$I.couple_id and cm.user_id = auth.uid()))', table_name);
    execute format('drop policy if exists "Members can create %1$s" on public.%1$I', table_name);
    execute format('create policy "Members can create %1$s" on public.%1$I for insert to authenticated with check (created_by = auth.uid() and exists (select 1 from public.couple_members cm where cm.couple_id = %1$I.couple_id and cm.user_id = auth.uid()))', table_name);
    execute format('drop policy if exists "Members can update %1$s" on public.%1$I', table_name);
    execute format('create policy "Members can update %1$s" on public.%1$I for update to authenticated using (exists (select 1 from public.couple_members cm where cm.couple_id = %1$I.couple_id and cm.user_id = auth.uid())) with check (exists (select 1 from public.couple_members cm where cm.couple_id = %1$I.couple_id and cm.user_id = auth.uid()))', table_name);
    execute format('drop policy if exists "Members can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "Members can delete %1$s" on public.%1$I for delete to authenticated using (exists (select 1 from public.couple_members cm where cm.couple_id = %1$I.couple_id and cm.user_id = auth.uid()))', table_name);
  end loop;
end $$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.couples to authenticated;
grant select, insert, update, delete on public.couple_members to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.financial_goals to authenticated;
grant select, insert, update, delete on public.assets to authenticated;
grant select, insert, update, delete on public.grocery_items to authenticated;

alter table public.transactions replica identity full;
alter table public.financial_goals replica identity full;
alter table public.assets replica identity full;
alter table public.grocery_items replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.financial_goals;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.assets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.grocery_items;
exception when duplicate_object then null;
end $$;

