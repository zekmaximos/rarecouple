drop policy if exists "Allowed RareCouple users can see shared household" on public.couples;
create policy "Allowed RareCouple users can see shared household"
on public.couples
for select
to authenticated
using (
  name = 'RareCouple'
  and lower(auth.jwt() ->> 'email') in (
    'samuel.morais@rarecouple.com',
    'stephanie.carvalho@rarecouple.com'
  )
);

drop policy if exists "Allowed RareCouple users can join shared household" on public.couple_members;
create policy "Allowed RareCouple users can join shared household"
on public.couple_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.couples c
    where c.id = couple_members.couple_id
      and c.name = 'RareCouple'
  )
  and lower(auth.jwt() ->> 'email') in (
    'samuel.morais@rarecouple.com',
    'stephanie.carvalho@rarecouple.com'
  )
);

