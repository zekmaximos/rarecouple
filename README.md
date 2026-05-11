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

O projeto tambem inclui `src/proxy.ts` para manter a sessao Supabase atualizada em rotas Next.js 16.

## Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute `supabase/migrations/001_initial_schema.sql`.
4. Execute `supabase/migrations/002_repair_realtime_goals_assets_groceries.sql`.
5. Em Authentication, mantenha apenas emails autorizados para o uso do casal.
6. Em Authentication > URL Configuration, use `https://rarecouple.vercel.app` como Site URL e Redirect URL.
7. Copie `Project URL` e `Publishable key` para `.env.local` e para as variaveis da Vercel.

Para uso exclusivo do casal, crie/convide os dois usuarios e depois desative novos cadastros publicos no Supabase Auth.

A migration 002 tambem ativa Realtime para lancamentos, metas, bens e feira.

O schema usa uma conta compartilhada (`couples`), membros (`couple_members`) e lancamentos (`transactions`). Todas as tabelas publicas estao com RLS ativo.

## Vercel + Git

Depois de criar o repositorio remoto:

```bash
git remote add origin <url-do-repositorio>
git push -u origin main
```

Na Vercel, importe o repositorio e configure as mesmas variaveis de ambiente. Cada push para `main` fara um novo deploy de producao.

## CSV

O botao CSV baixa um arquivo com colunas fixas:

`id,data,tipo,descricao,categoria,valor,metodo_pagamento,parcela_atual,parcelas_total,despesa_fixa,recorrente,observacoes,valor_assinado,criado_em`
