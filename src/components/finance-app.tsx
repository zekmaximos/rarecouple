"use client";

import { categories, money, paymentMethods, signedAmount, Transaction, TransactionType } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownToLine,
  BarChart3,
  CalendarDays,
  CreditCard,
  Download,
  Heart,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  PiggyBank,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

type Tab = "overview" | "entry" | "analysis" | "security";

const today = new Date().toISOString().slice(0, 10);
const palette = ["#d96b9d", "#2f9f90", "#d69b35", "#5f6fb2", "#cb6b55", "#668c45", "#8a5f9f"];

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

const initialQuickForm = {
  occurred_on: today,
  description: "",
  amount: "",
  category: "Mercado",
  payment_method: "Pix",
};

export function FinanceApp({ userEmail, setupMissing = false }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [couple, setCouple] = useState<Couple | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [quickForm, setQuickForm] = useState(initialQuickForm);

  const totals = useMemo(() => {
    const income = sum(transactions.filter((item) => item.transaction_type === "income"));
    const expense = sum(transactions.filter((item) => item.transaction_type === "expense"));
    const investment = sum(transactions.filter((item) => item.transaction_type === "investment"));
    const fixed = sum(transactions.filter((item) => item.is_fixed && item.transaction_type === "expense"));
    const installments = sum(
      transactions.filter((item) => item.transaction_type === "expense" && item.installments_total > 1),
    );
    const recurring = sum(transactions.filter((item) => item.is_recurring && item.transaction_type === "expense"));
    const balance = income - expense + investment;
    const savingsRate = income ? Math.round(((income - expense + investment) / income) * 100) : 0;
    const investmentRate = income ? Math.round((investment / income) * 100) : 0;
    const fixedShare = expense ? Math.round((fixed / expense) * 100) : 0;
    const day = Math.max(new Date().getDate(), 1);
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyPace = expense / day;
    const projectedExpense = dailyPace * daysInMonth;

    return {
      income,
      expense,
      investment,
      fixed,
      installments,
      recurring,
      balance,
      savingsRate,
      investmentRate,
      fixedShare,
      dailyPace,
      projectedExpense,
    };
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
    const rows = transactions.reduce<Record<string, { month: string; entradas: number; saidas: number; saldo: number }>>(
      (acc, item) => {
        const month = item.occurred_on.slice(0, 7);
        acc[month] ??= { month, entradas: 0, saidas: 0, saldo: 0 };
        if (item.transaction_type === "expense") {
          acc[month].saidas += Number(item.amount);
        } else if (item.transaction_type !== "transfer") {
          acc[month].entradas += Number(item.amount);
        }
        acc[month].saldo += signedAmount(item);
        return acc;
      },
      {},
    );

    return Object.values(rows).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const insights = useMemo(() => {
    const topCategory = byCategory[0];
    const secondCategory = byCategory[1];
    const concentration = totals.expense && topCategory ? Math.round((topCategory.value / totals.expense) * 100) : 0;
    const roomToBreathe = Math.max(totals.income - totals.fixed - totals.investment, 0);

    return [
      {
        title: "Categoria dominante",
        value: topCategory ? `${topCategory.name}: ${concentration}%` : "Sem dados",
        detail: secondCategory
          ? `Compare com ${secondCategory.name}; a diferenca mostra onde uma pequena mudanca mais aparece.`
          : "Quando houver mais lancamentos, eu aponto o maior foco do mes.",
      },
      {
        title: "Pressao fixa",
        value: `${totals.fixedShare}% das saidas`,
        detail:
          totals.fixedShare > 45
            ? "Alerta gentil: muita despesa fixa reduz liberdade. Vale revisar assinaturas, contratos e recorrencias."
            : "Boa folga estrutural. O controle semanal deve funcionar bem para manter o mes leve.",
      },
      {
        title: "Projecao do mes",
        value: money(totals.projectedExpense),
        detail: `No ritmo atual, o gasto medio diario esta em ${money(totals.dailyPace)}.`,
      },
      {
        title: "Espaco flexivel",
        value: money(roomToBreathe),
        detail: "Receita menos despesas fixas e investimentos. Este e o envelope mental para decisoes do dia a dia.",
      },
    ];
  }, [byCategory, totals]);

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

    if (!memberships.length) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveTransaction(values: typeof initialForm, reset: () => void) {
    if (!supabase || !couple) return;
    const amount = Number(String(values.amount).replace(",", "."));

    if (!values.description.trim() || !amount || amount <= 0) {
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
      description: values.description.trim(),
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
      reset();
      await loadData();
    }

    setSaving(false);
  }

  async function saveQuickTransaction() {
    await saveTransaction(
      {
        ...initialForm,
        occurred_on: quickForm.occurred_on,
        description: quickForm.description,
        amount: quickForm.amount,
        category: quickForm.category,
        payment_method: quickForm.payment_method,
      },
      () => setQuickForm(initialQuickForm),
    );
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
        <div className="max-w-2xl rounded-2xl border border-border bg-panel p-8">
          <p className="text-sm font-semibold text-accent">Configuracao pendente</p>
          <h1 className="mt-2 text-3xl font-semibold">RareCouple esta pronto para conectar ao Supabase.</h1>
          <p className="mt-4 text-muted">
            Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-[#ead7dd] bg-[#fff8f4]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#ffe0ea] text-[#b94075]">
              <Heart size={22} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent">RareCouple</p>
              <h1 className="text-2xl font-semibold leading-tight">Painel financeiro compartilhado</h1>
              <p className="break-all text-sm text-muted">{userEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <IconButton label="Atualizar" onClick={loadData} icon={<RefreshCcw size={17} />} />
            <IconButton label="CSV" onClick={downloadCsv} icon={<Download size={17} />} />
            <IconButton label="Sair" onClick={signOut} icon={<LogOut size={17} />} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <nav className="flex gap-2 overflow-x-auto pb-2">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} label="Visao geral" icon={<BarChart3 size={17} />} />
          <TabButton active={activeTab === "entry"} onClick={() => setActiveTab("entry")} label="Lancar" icon={<Plus size={17} />} />
          <TabButton active={activeTab === "analysis"} onClick={() => setActiveTab("analysis")} label="Analises" icon={<Sparkles size={17} />} />
          <TabButton active={activeTab === "security"} onClick={() => setActiveTab("security")} label="Seguranca" icon={<ShieldCheck size={17} />} />
        </nav>

        {message ? <p className="mt-3 rounded-2xl bg-[#fff4d8] p-3 text-sm text-[#6b4b09]">{message}</p> : null}

        {activeTab === "overview" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric title="Entradas" value={money(totals.income)} icon={<ArrowDownToLine size={18} />} />
                <Metric title="Saidas" value={money(totals.expense)} icon={<CreditCard size={18} />} tone="danger" />
                <Metric title="Saldo" value={money(totals.balance)} icon={<Wallet size={18} />} />
                <Metric title="Poupanca" value={`${totals.savingsRate}%`} icon={<PiggyBank size={18} />} />
              </div>

              <section className="grid gap-5 xl:grid-cols-[1fr_0.82fr]">
                <Panel title="Fluxo mensal" icon={<BarChart3 size={18} />}>
                  <ChartFrame>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={byMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ead7dd" />
                        <XAxis dataKey="month" stroke="#7a6a70" />
                        <YAxis stroke="#7a6a70" width={68} tickFormatter={(value) => compactMoney(Number(value))} />
                        <Tooltip formatter={(value) => money(Number(value))} />
                        <Bar dataKey="entradas" fill="#2f9f90" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="saidas" fill="#d96b9d" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </Panel>

                <Panel title="Gastos por categoria" icon={<CalendarDays size={18} />}>
                  <ChartFrame>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={52} outerRadius={92}>
                          {byCategory.map((entry, index) => (
                            <Cell key={entry.name} fill={palette[index % palette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => money(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                </Panel>
              </section>

              <RecentTransactions loading={loading} transactions={transactions} />
            </div>

            <div className="grid content-start gap-5">
              <QuickEntry
                quickForm={quickForm}
                setQuickForm={setQuickForm}
                saving={saving}
                onSave={saveQuickTransaction}
              />
              <CouplePanel couple={couple} />
            </div>
          </div>
        ) : null}

        {activeTab === "entry" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <FullEntryForm form={form} setForm={setForm} saving={saving} onSave={() => saveTransaction(form, () => setForm(initialForm))} />
            <div className="grid content-start gap-5">
              <QuickEntry
                quickForm={quickForm}
                setQuickForm={setQuickForm}
                saving={saving}
                onSave={saveQuickTransaction}
              />
              <Panel title="Dica de lancamento" icon={<Sparkles size={18} />}>
                <p className="text-sm leading-6 text-muted">
                  Use o lancamento rapido para gastos do dia. Use o formulario completo quando houver parcelas,
                  despesa fixa, recorrencia ou observacoes importantes para o CSV.
                </p>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "analysis" ? (
          <div className="mt-4 grid gap-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {insights.map((item) => (
                <InsightCard key={item.title} title={item.title} value={item.value} detail={item.detail} />
              ))}
            </div>
            <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
              <Panel title="Tendencia de saldo" icon={<LineChartIcon size={18} />}>
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ead7dd" />
                      <XAxis dataKey="month" stroke="#7a6a70" />
                      <YAxis stroke="#7a6a70" width={68} tickFormatter={(value) => compactMoney(Number(value))} />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Line type="monotone" dataKey="saldo" stroke="#b94075" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>
              <Panel title="Leitura avancada simples" icon={<TrendingUp size={18} />}>
                <div className="grid gap-3">
                  <Ratio label="Despesa fixa" value={totals.fixedShare} helper="Idealmente abaixo de 50% das saidas." />
                  <Ratio label="Investimentos" value={totals.investmentRate} helper="Ajuda a transformar renda em patrimonio." />
                  <Ratio
                    label="Parcelas"
                    value={totals.expense ? Math.round((totals.installments / totals.expense) * 100) : 0}
                    helper="Quanto menor, mais liberdade no mes seguinte."
                  />
                </div>
              </Panel>
            </section>
            <Panel title="Mapa de decisoes do casal" icon={<Heart size={18} />}>
              <div className="grid gap-3 md:grid-cols-3">
                <Decision title="Hoje" text={`Registrar tudo acima de ${money(Math.max(totals.dailyPace * 0.3, 20))} para manter precisao.`} />
                <Decision title="Semana" text="Olhar a categoria dominante antes de compras por impulso." />
                <Decision title="Mes" text={`Se a projecao passar de ${money(totals.income)}, revisem despesas variaveis antes das fixas.`} />
              </div>
            </Panel>
          </div>
        ) : null}

        {activeTab === "security" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Panel title="Acesso exclusivo" icon={<ShieldCheck size={18} />}>
              <div className="grid gap-3">
                <SecurityItem title="Dois emails, duas contas" text="Crie ou convide apenas o seu email e o email da sua esposa no Supabase Auth." done />
                <SecurityItem title="Desative cadastro publico depois" text="Depois que os dois acessos estiverem criados, desative novas inscricoes no painel do Supabase." />
                <SecurityItem title="URLs de confirmacao" text="Em Supabase Auth > URL Configuration, use https://rarecouple.vercel.app como Site URL e Redirect URL." />
                <SecurityItem title="Banco com RLS" text="As tabelas usam Row Level Security para separar os dados da conta compartilhada." done />
              </div>
            </Panel>
            <Panel title="Conta compartilhada" icon={<Heart size={18} />}>
              <div className="grid gap-3 text-sm leading-6 text-muted">
                <p>Casa: <strong className="text-foreground">{couple?.name ?? "RareCouple"}</strong></p>
                <p>Codigo interno: <strong className="font-mono text-foreground">{couple?.invite_code ?? "pendente"}</strong></p>
                <p>
                  Para unir a segunda conta ao mesmo painel, ela precisa estar em `couple_members` com o mesmo
                  `couple_id`. Posso automatizar isso numa proxima etapa com convite por codigo.
                </p>
              </div>
            </Panel>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function QuickEntry({
  quickForm,
  setQuickForm,
  saving,
  onSave,
}: {
  quickForm: typeof initialQuickForm;
  setQuickForm: (value: typeof initialQuickForm) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Panel title="Lancamento rapido" icon={<Wallet size={18} />}>
      <div className="grid gap-3">
        <div className="grid grid-cols-[1fr_120px] gap-3 max-[420px]:grid-cols-1">
          <label className="label">
            O que foi?
            <input className="field" placeholder="Ex: almoco, mercado, taxi" value={quickForm.description} onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })} />
          </label>
          <label className="label">
            Valor
            <input className="field" inputMode="decimal" placeholder="0,00" value={quickForm.amount} onChange={(e) => setQuickForm({ ...quickForm, amount: e.target.value })} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <Select label="Categoria" value={quickForm.category} onChange={(value) => setQuickForm({ ...quickForm, category: value })} options={categories} />
          <Select label="Pagamento" value={quickForm.payment_method} onChange={(value) => setQuickForm({ ...quickForm, payment_method: value })} options={paymentMethods} />
        </div>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Salvar rapido
        </button>
      </div>
    </Panel>
  );
}

function FullEntryForm({
  form,
  setForm,
  saving,
  onSave,
}: {
  form: typeof initialForm;
  setForm: (value: typeof initialForm) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Panel title="Lancamento completo" icon={<Plus size={18} />}>
      <div className="grid gap-3">
        <label className="label">
          Descricao
          <input className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <label className="label">
            Valor
            <input className="field" inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label className="label">
            Data
            <input className="field" type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Select label="Tipo" value={form.transaction_type} onChange={(value) => setForm({ ...form, transaction_type: value as TransactionType })} options={["expense", "income", "investment", "transfer"]} labels={typeLabel} />
          <Select label="Categoria" value={form.category} onChange={(value) => setForm({ ...form, category: value })} options={categories} />
        </div>
        <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
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
        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Check label="Despesa fixa" checked={form.is_fixed} onChange={(value) => setForm({ ...form, is_fixed: value })} />
          <Check label="Recorrente" checked={form.is_recurring} onChange={(value) => setForm({ ...form, is_recurring: value })} />
        </div>
        <label className="label">
          Observacoes
          <textarea className="field min-h-20 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Salvar lancamento
        </button>
      </div>
    </Panel>
  );
}

function RecentTransactions({ loading, transactions }: { loading: boolean; transactions: Transaction[] }) {
  return (
    <Panel title="Lancamentos recentes" icon={<CreditCard size={18} />}>
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
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
                    <td>{item.installment_number}/{item.installments_total}</td>
                    <td className="text-right font-semibold">{money(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 md:hidden">
            {transactions.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.description}</p>
                    <p className="text-xs text-muted">{item.occurred_on} · {item.category}</p>
                  </div>
                  <p className="shrink-0 font-semibold">{money(Number(item.amount))}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function CouplePanel({ couple }: { couple: Couple | null }) {
  return (
    <Panel title="Conta compartilhada" icon={<Heart size={18} />}>
      <div className="grid gap-2 text-sm text-muted">
        <p>Nome: <strong className="text-foreground">{couple?.name ?? "RareCouple"}</strong></p>
        <p>Codigo: <strong className="font-mono text-foreground">{couple?.invite_code ?? "pendente"}</strong></p>
        <p>Todos os lancamentos ficam padronizados para CSV e analises futuras.</p>
      </div>
    </Panel>
  );
}

function Metric({ title, value, icon, tone = "accent" }: { title: string; value: string; icon: React.ReactNode; tone?: "accent" | "danger" }) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
      <div className={`mb-3 grid size-9 place-items-center rounded-xl ${tone === "danger" ? "bg-[#ffe1e5] text-danger" : "bg-accent-soft text-accent"}`}>
        {icon}
      </div>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-2xl font-semibold leading-tight">{value}</p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-panel p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-[260px] min-w-0 sm:h-72">{children}</div>;
}

function IconButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-border bg-white px-3 text-sm font-semibold hover:border-accent" onClick={onClick}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition ${
        active ? "border-[#d96b9d] bg-[#ffe0ea] text-[#91365f]" : "border-border bg-white text-muted hover:border-accent"
      }`}
      onClick={onClick}
    >
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
    <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function InsightCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-accent">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function Ratio({ label, value, helper }: { label: string; value: number; helper: string }) {
  const clamped = Math.max(0, Math.min(value, 100));
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[#f3e7ea]">
        <div className="h-full rounded-full bg-[#d96b9d]" style={{ width: `${clamped}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </div>
  );
}

function Decision({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
    </div>
  );
}

function SecurityItem({ title, text, done = false }: { title: string; text: string; done?: boolean }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-white p-4">
      <div className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${done ? "bg-accent-soft text-accent" : "bg-[#ffe0ea] text-[#b94075]"}`}>
        <ShieldCheck size={16} />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted">{text}</p>
      </div>
    </div>
  );
}

function sum(items: Transaction[]) {
  return items.reduce((total, item) => total + Number(item.amount), 0);
}

function compactMoney(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(Math.round(value));
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

