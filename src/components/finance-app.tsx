"use client";

import { categories, money, paymentMethods, signedAmount, Transaction, TransactionType } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Couple = {
  id: string;
  name: string;
  invite_code: string;
};

type Membership = {
  couple_id: string;
  couples: Couple | Couple[];
};

type Props = {
  userEmail: string;
  setupMissing?: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const colors = ["#116a61", "#d0952b", "#763f7d", "#2f6f9f", "#9a4c3d", "#5f7636", "#2f4f4f"];

const initialForm = {
  occurred_on: today,
  description: "",
  amount: "",
  transaction_type: "expense" as TransactionType,
  category: "Mercado",
  payment_method: "Pix",
  installments_total: "1",
  installment_number: "1",
  is_fixed: false,
  is_recurring: false,
  notes: "",
};

export function FinanceApp({ userEmail, setupMissing = false }: Props) {
  const supabase = createClient();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);

  const totals = useMemo(() => {
    const income = transactions
      .filter((item) => item.transaction_type === "income")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = transactions
      .filter((item) => item.transaction_type === "expense")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const investment = transactions
      .filter((item) => item.transaction_type === "investment")
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const fixed = transactions
      .filter((item) => item.is_fixed)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const balance = income - expense + investment;
    const savingsRate = income ? Math.round(((income - expense + investment) / income) * 100) : 0;

    return { income, expense, investment, fixed, balance, savingsRate };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const rows = transactions
      .filter((item) => item.transaction_type === "expense")
      .reduce<Record<string, number>>((acc, item) => {
        acc[item.category] = (acc[item.category] ?? 0) + Number(item.amount);
        return acc;
      }, {});

    return Object.entries(rows)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const byMonth = useMemo(() => {
    const rows = transactions.reduce<Record<string, { month: string; entradas: number; saidas: number }>>(
      (acc, item) => {
        const month = item.occurred_on.slice(0, 7);
        acc[month] ??= { month, entradas: 0, saidas: 0 };
        if (item.transaction_type === "income" || item.transaction_type === "investment") {
          acc[month].entradas += Number(item.amount);
        }
        if (item.transaction_type === "expense") {
          acc[month].saidas += Number(item.amount);
        }
        return acc;
      },
      {},
    );

    return Object.values(rows).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const insights = useMemo(() => {
    const topCategory = byCategory[0];
    const fixedShare = totals.expense ? Math.round((totals.fixed / totals.expense) * 100) : 0;
    const dailyPace = totals.expense / Math.max(new Date().getDate(), 1);

    return [
      topCategory
        ? `${topCategory.name} concentra ${money(topCategory.value)} dos gastos registrados.`
        : "Comece registrando gastos para revelar os maiores focos.",
      fixedShare > 45
        ? `Despesas fixas em ${fixedShare}% das saidas: vale revisar contratos e recorrencias.`
        : `Despesas fixas em ${fixedShare}% das saidas: boa margem para controle semanal.`,
      `Ritmo medio de gasto no mes: ${money(dailyPace)} por dia.`,
    ];
  }, [byCategory, totals.expense, totals.fixed]);

  async function loadData() {
    if (!supabase || setupMissing) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return;
    }

    const { data: membershipRows, error: membershipError } = await supabase
      .from("couple_members")
      .select("couple_id, couples(id, name, invite_code)")
      .eq("user_id", user.id)
      .limit(1);

    let memberships = (membershipRows ?? []) as Membership[];

    if (membershipError) {
      setMessage(membershipError.message);
      setLoading(false);
      return;
    }

    if (!memberships?.length) {
      const { data: createdCouple, error: coupleError } = await supabase
        .from("couples")
        .insert({ name: "RareCouple", owner_id: user.id })
        .select("id, name, invite_code")
        .single();

      if (coupleError || !createdCouple) {
        setMessage(coupleError?.message ?? "Nao foi possivel criar o casal.");
        setLoading(false);
        return;
      }

      const { error: memberError } = await supabase
        .from("couple_members")
        .insert({ couple_id: createdCouple.id, user_id: user.id, role: "owner" });

      if (memberError) {
        setMessage(memberError.message);
        setLoading(false);
        return;
      }

      memberships = [{ couple_id: createdCouple.id, couples: createdCouple as Couple }];
    }

    const selectedCouple = Array.isArray(memberships[0].couples)
      ? memberships[0].couples[0]
      : memberships[0].couples;
    setCouple(selectedCouple as Couple);

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("couple_id", memberships[0].couple_id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setTransactions((data ?? []) as Transaction[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
    // The initial load is intentionally tied to the first mounted session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addTransaction(quick?: Partial<typeof initialForm>) {
    if (!supabase || !couple) return;
    const values = { ...form, ...quick };
    const amount = Number(String(values.amount).replace(",", "."));

    if (!values.description || !amount || amount <= 0) {
      setMessage("Informe descricao e valor maior que zero.");
      return;
    }

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("transactions").insert({
      couple_id: couple.id,
      created_by: user?.id,
      occurred_on: values.occurred_on,
      description: values.description,
      amount,
      transaction_type: values.transaction_type,
      category: values.category,
      payment_method: values.payment_method,
      installments_total: Number(values.installments_total) || 1,
      installment_number: Number(values.installment_number) || 1,
      is_fixed: values.is_fixed,
      is_recurring: values.is_recurring,
      notes: values.notes || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setForm(initialForm);
      await loadData();
    }

    setSaving(false);
  }

  async function signOut() {
    await supabase?.auth.signOut();
    window.location.href = "/login";
  }

  function downloadCsv() {
    const headers = [
      "id",
      "data",
      "tipo",
      "descricao",
      "categoria",
      "valor",
      "metodo_pagamento",
      "parcela_atual",
      "parcelas_total",
      "despesa_fixa",
      "recorrente",
      "observacoes",
      "valor_assinado",
      "criado_em",
    ];
    const rows = transactions.map((item) =>
      [
        item.id,
        item.occurred_on,
        item.transaction_type,
        item.description,
        item.category,
        Number(item.amount).toFixed(2),
        item.payment_method,
        item.installment_number,
        item.installments_total,
        item.is_fixed ? "sim" : "nao",
        item.is_recurring ? "sim" : "nao",
        item.notes ?? "",
        signedAmount(item).toFixed(2),
        item.created_at,
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`),
    );

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rarecouple-financas-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (setupMissing) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-2xl rounded-lg border border-border bg-panel p-8">
          <p className="text-sm font-semibold text-accent">Configuracao pendente</p>
          <h1 className="mt-2 text-3xl font-semibold">RareCouple esta pronto para conectar ao Supabase.</h1>
          <p className="mt-4 text-muted">
            Crie o projeto no Supabase, aplique o SQL em `supabase/migrations`, e preencha
            `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no `.env.local`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent">RareCouple</p>
            <h1 className="text-2xl font-semibold">Painel financeiro compartilhado</h1>
            <p className="text-sm text-muted">{userEmail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <IconButton label="Atualizar" onClick={loadData} icon={<RefreshCcw size={17} />} />
            <IconButton label="CSV" onClick={downloadCsv} icon={<Download size={17} />} />
            <IconButton label="Sair" onClick={signOut} icon={<LogOut size={17} />} />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_410px]">
        <div className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Entradas" value={money(totals.income)} icon={<ArrowDownToLine size={18} />} />
            <Metric title="Saidas" value={money(totals.expense)} icon={<CreditCard size={18} />} tone="danger" />
            <Metric title="Saldo" value={money(totals.balance)} icon={<Wallet size={18} />} />
            <Metric title="Taxa poupanca" value={`${totals.savingsRate}%`} icon={<Sparkles size={18} />} />
          </div>

          <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
            <Panel title="Fluxo mensal" icon={<BarChart3 size={18} />}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ded6ca" />
                    <XAxis dataKey="month" stroke="#6b6f68" />
                    <YAxis stroke="#6b6f68" />
                    <Tooltip formatter={(value) => money(Number(value))} />
                    <Bar dataKey="entradas" fill="#116a61" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" fill="#b54133" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Gastos por categoria" icon={<CalendarDays size={18} />}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={58} outerRadius={98}>
                      {byCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => money(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </section>

          <Panel title="Analises importantes" icon={<Sparkles size={18} />}>
            <div className="grid gap-3 md:grid-cols-3">
              {insights.map((item) => (
                <p key={item} className="rounded-lg border border-border bg-white p-4 text-sm leading-6 text-muted">
                  {item}
                </p>
              ))}
            </div>
          </Panel>

          <Panel title="Lancamentos recentes" icon={<CreditCard size={18} />}>
            {loading ? (
              <div className="flex h-40 items-center justify-center text-muted">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-muted">
                    <tr className="border-b border-border">
                      <th className="py-3">Data</th>
                      <th>Descricao</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Parcela</th>
                      <th className="text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 12).map((item) => (
                      <tr key={item.id} className="border-b border-border/70">
                        <td className="py-3 font-mono text-xs">{item.occurred_on}</td>
                        <td className="font-medium">{item.description}</td>
                        <td>{item.category}</td>
                        <td>{typeLabel(item.transaction_type)}</td>
                        <td>
                          {item.installment_number}/{item.installments_total}
                        </td>
                        <td className="text-right font-semibold">{money(Number(item.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <aside className="grid content-start gap-5">
          <Panel title="Inserir informacao" icon={<Plus size={18} />}>
            <div className="grid gap-3">
              <label className="label">
                Descricao
                <input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">
                  Valor
                  <input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </label>
                <label className="label">
                  Data
                  <input className="field" type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Tipo" value={form.transaction_type} onChange={(value) => setForm({ ...form, transaction_type: value as TransactionType })} options={["expense", "income", "investment", "transfer"]} labels={typeLabel} />
                <Select label="Categoria" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categories} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Select label="Pagamento" value={form.payment_method} onChange={(value) => setForm({ ...form, payment_method: value })} options={paymentMethods} />
                <label className="label">
                  Parcela
                  <input className="field" type="number" min="1" value={form.installment_number} onChange={(e) => setForm({ ...form, installment_number: e.target.value })} />
                </label>
                <label className="label">
                  Total
                  <input className="field" type="number" min="1" value={form.installments_total} onChange={(e) => setForm({ ...form, installments_total: e.target.value })} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Check label="Despesa fixa" checked={form.is_fixed} onChange={(value) => setForm({ ...form, is_fixed: value })} />
                <Check label="Recorrente" checked={form.is_recurring} onChange={(value) => setForm({ ...form, is_recurring: value })} />
              </div>
              <label className="label">
                Observacoes
                <textarea className="field min-h-20 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              {message ? <p className="rounded-lg bg-[#fff4d8] p-3 text-sm text-[#6b4b09]">{message}</p> : null}
              <button className="flex h-12 items-center justify-center gap-2 rounded-lg bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={() => addTransaction()}>
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Salvar lancamento
              </button>
            </div>
          </Panel>

          <Panel title="Gasto rapido" icon={<Wallet size={18} />}>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Cafe", "18", "Restaurantes"],
                ["Mercado", "120", "Mercado"],
                ["Uber", "35", "Transporte"],
                ["Farmacia", "55", "Saude"],
              ].map(([description, amount, category]) => (
                <button
                  key={description}
                  className="rounded-lg border border-border bg-white p-3 text-left text-sm font-semibold hover:border-accent"
                  onClick={() => addTransaction({ description, amount, category, transaction_type: "expense" })}
                >
                  {description}
                  <span className="block text-muted">{money(Number(amount))}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Conta compartilhada" icon={<Sparkles size={18} />}>
            <div className="grid gap-2 text-sm text-muted">
              <p>Nome: <strong className="text-foreground">{couple?.name ?? "RareCouple"}</strong></p>
              <p>Codigo do casal: <strong className="font-mono text-foreground">{couple?.invite_code ?? "pendente"}</strong></p>
              <p>Use este codigo como referencia para vincular a segunda conta no Supabase.</p>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Metric({ title, value, icon, tone = "accent" }: { title: string; value: string; icon: React.ReactNode; tone?: "accent" | "danger" }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <div className={`mb-3 grid size-9 place-items-center rounded-lg ${tone === "danger" ? "bg-[#f5ded8] text-danger" : "bg-accent-soft text-accent"}`}>
        {icon}
      </div>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-panel p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function IconButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold hover:border-accent" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function Select({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: (value: string) => string; onChange: (value: string) => void }) {
  return (
    <label className="label">
      {label}
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item} value={item}>
            {labels ? labels(item) : item}
          </option>
        ))}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function typeLabel(value: string) {
  const labels: Record<string, string> = {
    expense: "Despesa",
    income: "Receita",
    investment: "Investimento",
    transfer: "Transferencia",
  };
  return labels[value] ?? value;
}
