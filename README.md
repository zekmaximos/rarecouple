# RareCouple

App financeiro privado para um casal registrar despesas, receitas, parcelas, despesas fixas, acompanhar indicadores e exportar CSV padronizado.

## Stack

- Next.js App Router + TypeScript
- Supabase Auth + Postgres + RLS
- Vercel para deploy continuo via Git
- Recharts para dashboards

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://rarecouple.vercel.app
```

O projeto também inclui `src/proxy.ts` para manter a sessao Supabase atualizada em rotas Next.js 16.

## Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `supabase/migrations/001_initial_schema.sql`.
4. Execute `supabase/migrations/002_repair_realtime_goals_assets_groceries.sql`.
5. Execute `supabase/migrations/003_private_two_user_household.sql`.
6. Execute `supabase/migrations/004_internal_login_shared_household.sql`.
7. Execute `supabase/migrations/005_remove_couple_members_recursion.sql`.
8. O login do app e interno: `samuel.morais@rarecouple.com` e `stephanie.carvalho@rarecouple.com`.
9. Copie `Project URL` e `Publishable key` para `.env.local` e para as variáveis da Vercel.

Para uso exclusivo do casal, o app usa sessao HTTP-only propria e senha compartilhada. Os emails sao identificadores internos, não caixas reais.

A migration 002 também ativa Realtime para lançamentos, metas, bens e feira.

O schema usa uma conta compartilhada (`couples`), membros (`couple_members`) e lançamentos (`transactions`). Todas as tabelas públicas estão com RLS ativo.

## Vercel + Git

Depois de criar o repositório remoto:

```bash
git remote add origin <url-do-repositorio>
git push -u origin main
```

Na Vercel, importe o repositório e configure as mesmas variáveis de ambiente. Cada push para `main` fará um novo deploy de produção.

## CSV

O botao CSV baixa um arquivo com colunas fixas:

`id,data,tipo,descrição,categoria,valor,metodo_pagamento,parcela_atual,parcelas_total,despesa_fixa,recorrente,observações,valor_assinado,criado_em`
