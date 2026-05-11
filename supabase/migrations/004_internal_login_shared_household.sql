alter table public.couples alter column owner_id drop not null;

drop policy if exists "Public app can use RareCouple household" on public.couples;
create policy "Public app can use RareCouple household"
on public.couples
for all
to anon, authenticated
using (name = 'RareCouple')
with check (name = 'RareCouple');

drop policy if exists "Public app can read transactions" on public.transactions;
create policy "Public app can read transactions"
on public.transactions
for select
to anon, authenticated
using (
  exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.name = 'RareCouple'
  )
);

drop policy if exists "Public app can write transactions" on public.transactions;
create policy "Public app can write transactions"
on public.transactions
for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.name = 'RareCouple'
  )
);

drop policy if exists "Public app can update transactions" on public.transactions;
create policy "Public app can update transactions"
on public.transactions
for update
to anon, authenticated
using (
  exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.name = 'RareCouple'
  )
)
with check (
  exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.name = 'RareCouple'
  )
);

drop policy if exists "Public app can delete transactions" on public.transactions;
create policy "Public app can delete transactions"
on public.transactions
for delete
to anon, authenticated
using (
  exists (
    select 1 from public.couples c
    where c.id = transactions.couple_id and c.name = 'RareCouple'
  )
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array['financial_goals', 'assets', 'grocery_items']
  loop
    execute format('drop policy if exists "Public app can read %1$s" on public.%1$I', table_name);
    execute format('create policy "Public app can read %1$s" on public.%1$I for select to anon, authenticated using (exists (select 1 from public.couples c where c.id = %1$I.couple_id and c.name = ''RareCouple''))', table_name);

    execute format('drop policy if exists "Public app can write %1$s" on public.%1$I', table_name);
    execute format('create policy "Public app can write %1$s" on public.%1$I for insert to anon, authenticated with check (exists (select 1 from public.couples c where c.id = %1$I.couple_id and c.name = ''RareCouple''))', table_name);

    execute format('drop policy if exists "Public app can update %1$s" on public.%1$I', table_name);
    execute format('create policy "Public app can update %1$s" on public.%1$I for update to anon, authenticated using (exists (select 1 from public.couples c where c.id = %1$I.couple_id and c.name = ''RareCouple'')) with check (exists (select 1 from public.couples c where c.id = %1$I.couple_id and c.name = ''RareCouple''))', table_name);

    execute format('drop policy if exists "Public app can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "Public app can delete %1$s" on public.%1$I for delete to anon, authenticated using (exists (select 1 from public.couples c where c.id = %1$I.couple_id and c.name = ''RareCouple''))', table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.couples to anon;
grant select, insert, update, delete on public.transactions to anon;
grant select, insert, update, delete on public.financial_goals to anon;
grant select, insert, update, delete on public.assets to anon;
grant select, insert, update, delete on public.grocery_items to anon;

