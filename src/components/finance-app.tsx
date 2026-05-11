"use client";

import { getEvaQuote, getRandomEvaPhoto, memories } from "@/lib/brand-assets";
import {
  Asset,
  categories,
  FinancialGoal,
  GroceryItem,
  money,
  paymentMethods,
  signedAmount,
  Transaction,
  TransactionType,
} from "@/lib/finance";
import {
  csvImportTemplate,
  ImportedTransactionDraft,
  markDuplicates,
  parseImportText,
} from "@/lib/importers";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDownToLine,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileUp,
  Heart,
  LineChart as LineChartIcon,
  Loader2,
  LogOut,
  Package,
  PiggyBank,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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

type SpecialDate = { id: string; label: string; date: string }; // date: MM-DD

type Props = {
  userEmail: string;
  userName: string;
  setupMissing?: boolean;
};

type Tab = "overview" | "entry" | "import" | "analysis" | "goals" | "assets" | "groceries" | "security";

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

const initialGoalForm = {
  owner_label: "Coletiva",
  title: "",
  target_amount: "",
  current_amount: "",
  monthly_action: "",
  target_date: "",
};

const initialAssetForm = {
  name: "",
  asset_type: "Outro",
  estimated_value: "",
  acquisition_value: "",
  acquired_on: "",
  notes: "",
};

const initialGroceryForm = {
  purchased_on: today,
  item_name: "",
  category: "Alimentos",
  amount: "",
  quantity: "1",
  store: "",
  notes: "",
};

export function FinanceApp({ userEmail, userName, setupMissing = false }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [couple, setCouple] = useState<Couple | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(initialForm);
  const [quickForm, setQuickForm] = useState(initialQuickForm);
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [assetForm, setAssetForm] = useState(initialAssetForm);
  const [groceryForm, setGroceryForm] = useState(initialGroceryForm);
  const [evaBubble, setEvaBubble] = useState<{ id: number; quote: string; photo: string } | null>(null);
  const [importRows, setImportRows] = useState<ImportedTransactionDraft[]>([]);
  const [importReport, setImportReport] = useState("");
  const lastEvaAt = useRef(0);

  // Filtros de transações
  const [filterMonth, setFilterMonth] = useState(today.slice(0, 7));
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [searchText, setSearchText] = useState("");

  // Datas especiais (localStorage)
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [specialDateForm, setSpecialDateForm] = useState({ label: "", date: "" });
  const [specialDateAlert, setSpecialDateAlert] = useState<string | null>(null);

  function summonEva(tab?: string) {
    const quote = getEvaQuote(tab);
    const photo = getRandomEvaPhoto();
    setEvaBubble({ id: Date.now(), quote, photo });
  }

  function nudgeEva() {
    const now = Date.now();
    if (now - lastEvaAt.current < 14000) return;
    lastEvaAt.current = now;
    summonEva(activeTab);
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    summonEva(tab);
  }

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
          ? `Compare com ${secondCategory.name}; a diferença mostra onde uma pequena mudança mais aparece.`
          : "Quando houver mais lançamentos, eu aponto o maior foco do mês.",
      },
      {
        title: "Pressão fixa",
        value: `${totals.fixedShare}% das saídas`,
        detail:
          totals.fixedShare > 45
            ? "Alerta gentil: muita despesa fixa reduz liberdade. Vale revisar assinaturas, contratos e recorrências."
            : "Boa folga estrutural. O controle semanal deve funcionar bem para manter o mês leve.",
      },
      {
        title: "Projeção do mês",
        value: money(totals.projectedExpense),
        detail: `No ritmo atual, o gasto médio diário está em ${money(totals.dailyPace)}.`,
      },
      {
        title: "Espaço flexível",
        value: money(roomToBreathe),
        detail: "Receita menos despesas fixas e investimentos. Este é o envelope mental para decisões do dia a dia.",
      },
    ];
  }, [byCategory, totals]);

  const periodSummary = useMemo(() => {
    const now = new Date();
    const todayKey = toDateKey(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthKey = todayKey.slice(0, 7);

    const expenseInPeriod = (predicate: (date: Date, key: string) => boolean) =>
      transactions
        .filter((item) => item.transaction_type === "expense")
        .filter((item) => {
          const date = parseLocalDate(item.occurred_on);
          return predicate(date, item.occurred_on);
        })
        .reduce((total, item) => total + Number(item.amount), 0);

    const daily = expenseInPeriod((_, key) => key === todayKey);
    const weekly = expenseInPeriod((date) => date >= weekStart && date <= now);
    const monthly = expenseInPeriod((_, key) => key.startsWith(monthKey));

    return {
      daily,
      weekly,
      monthly,
      dailyAverage: new Date().getDate() ? monthly / new Date().getDate() : 0,
    };
  }, [transactions]);

  const goalSummary = useMemo(() => {
    const target = goals.reduce((total, item) => total + Number(item.target_amount), 0);
    const current = goals.reduce((total, item) => total + Number(item.current_amount), 0);
    const progress = target ? Math.round((current / target) * 100) : 0;
    return { target, current, progress };
  }, [goals]);

  const assetSummary = useMemo(() => {
    const total = assets.reduce((acc, item) => acc + Number(item.estimated_value), 0);
    const byType = assets.reduce<Record<string, number>>((acc, item) => {
      acc[item.asset_type] = (acc[item.asset_type] ?? 0) + Number(item.estimated_value);
      return acc;
    }, {});

    return {
      total,
      byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
    };
  }, [assets]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      if (filterMonth && !item.occurred_on.startsWith(filterMonth)) return false;
      if (filterCategory && item.category !== filterCategory) return false;
      if (filterType && item.transaction_type !== filterType) return false;
      if (searchText && !item.description.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [transactions, filterMonth, filterCategory, filterType, searchText]);

  const grocerySummary = useMemo(() => {
    const month = today.slice(0, 7);
    const monthItems = groceryItems.filter((item) => item.purchased_on.slice(0, 7) === month);
    const total = monthItems.reduce((acc, item) => acc + Number(item.amount), 0);
    const byCategory = monthItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] ?? 0) + Number(item.amount);
      return acc;
    }, {});

    return {
      total,
      items: monthItems,
      byCategory: Object.entries(byCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [groceryItems]);

  async function loadData() {
    if (!supabase || setupMissing) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: foundSharedCouple, error: sharedCoupleError } = await supabase
      .from("couples")
      .select("id, name, invite_code")
      .eq("name", "RareCouple")
      .limit(1)
      .maybeSingle();

    let sharedCouple = foundSharedCouple;

    if (sharedCoupleError) {
      setMessage(`${sharedCoupleError.message}. Confira se a migration 004 foi aplicada no Supabase.`);
      setLoading(false);
      return;
    }

    if (!sharedCouple) {
      const { data: createdCouple, error: coupleError } = await supabase
        .from("couples")
        .insert({ name: "RareCouple", owner_id: null })
        .select("id, name, invite_code")
        .single();

      if (coupleError || !createdCouple) {
        setMessage(coupleError?.message ?? "Não foi possível criar o casal.");
        setLoading(false);
        return;
      }

      sharedCouple = createdCouple as Couple;
    }

    setCouple(sharedCouple as Couple);

    const coupleId = sharedCouple.id;
    const [transactionResult, goalResult, assetResult, groceryResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("couple_id", coupleId)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("financial_goals")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false }),
      supabase
        .from("assets")
        .select("*")
        .eq("couple_id", coupleId)
        .order("estimated_value", { ascending: false }),
      supabase
        .from("grocery_items")
        .select("*")
        .eq("couple_id", coupleId)
        .order("purchased_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    const firstError = transactionResult.error ?? goalResult.error ?? assetResult.error ?? groceryResult.error;

    if (firstError) {
      setMessage(`${firstError.message}. Execute a migration 002 no Supabase se as tabelas ainda não existirem.`);
    } else {
      setTransactions((transactionResult.data ?? []) as Transaction[]);
      setGoals((goalResult.data ?? []) as FinancialGoal[]);
      setAssets((assetResult.data ?? []) as Asset[]);
      setGroceryItems((groceryResult.data ?? []) as GroceryItem[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await loadData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!evaBubble) return;
    const timeout = window.setTimeout(() => setEvaBubble(null), 6800);
    return () => window.clearTimeout(timeout);
  }, [evaBubble]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem("rarecouple-special-dates");
        if (stored) {
          const dates = JSON.parse(stored) as SpecialDate[];
          setSpecialDates(dates);
          const todayMMDD = today.slice(5);
          const soon = dates.find((d) => {
            const [am, ad] = d.date.split("-").map(Number);
            const [bm, bd] = todayMMDD.split("-").map(Number);
            return Math.abs(am * 31 + ad - (bm * 31 + bd)) <= 3;
          });
          if (soon) setSpecialDateAlert(soon.label);
        }
      } catch {
        // Ignore malformed local reminders.
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!supabase || !couple) return;

    const channel = supabase
      .channel(`rarecouple-${couple.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `couple_id=eq.${couple.id}` }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "financial_goals", filter: `couple_id=eq.${couple.id}` }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "assets", filter: `couple_id=eq.${couple.id}` }, () => void loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "grocery_items", filter: `couple_id=eq.${couple.id}` }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couple?.id]);

  async function saveTransaction(values: typeof initialForm, reset: () => void) {
    if (!supabase || !couple) return;
    const amount = Number(String(values.amount).replace(",", "."));

    if (!values.description.trim() || !amount || amount <= 0) {
      setMessage("Informe descrição e valor maior que zero.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("transactions").insert({
      couple_id: couple.id,
      created_by: null,
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
      summonEva(activeTab);
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

  async function handleImportFile(file: File | null) {
    if (!file) return;

    setImporting(true);
    setImportReport("");
    setMessage("");

    try {
      let text = "";

      if (file.name.toLowerCase().endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/import/pdf-text", { method: "POST", body: formData });
        const payload = (await response.json()) as { text?: string; message?: string };

        if (!response.ok) {
          throw new Error(payload.message ?? "Não foi possível ler o PDF.");
        }

        text = payload.text ?? "";
      } else {
        text = await file.text();
      }

      const rows = markDuplicates(parseImportText(text, file.name), transactions);
      setImportRows(rows);
      setImportReport(
        rows.length
          ? `${rows.length} lançamento(s) encontrados. Revise a prévia antes de salvar.`
          : "Não encontrei lançamentos nesse arquivo. Para PDF escaneado ou imagem, será preciso OCR dedicado.",
      );
      summonEva("import");
    } catch (error) {
      setImportRows([]);
      setImportReport(error instanceof Error ? error.message : "Não foi possível importar o arquivo.");
    } finally {
      setImporting(false);
    }
  }

  function updateImportRow(id: string, patch: Partial<ImportedTransactionDraft>) {
    setImportRows((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  async function saveImportedTransactions() {
    if (!supabase || !couple) return;
    const selectedRows = importRows.filter((row) => row.selected);

    if (!selectedRows.length) {
      setImportReport("Selecione pelo menos um lançamento para salvar.");
      return;
    }

    setImporting(true);
    setMessage("");

    const payload = selectedRows.map((row) => ({
      couple_id: couple.id,
      created_by: null,
      occurred_on: row.occurred_on,
      description: row.description.trim(),
      amount: Number(row.amount),
      transaction_type: row.transaction_type,
      category: row.category,
      payment_method: row.payment_method,
      installments_total: Number(row.installments_total) || 1,
      installment_number: Number(row.installment_number) || 1,
      is_fixed: row.is_fixed,
      is_recurring: row.is_recurring,
      notes: row.notes || `Importado de ${row.source}`,
    }));

    const { error } = await supabase.from("transactions").insert(payload);

    if (error) {
      setImportReport(error.message);
    } else {
      setImportRows([]);
      setImportReport(`${selectedRows.length} lançamento(s) importados com sucesso.`);
      await loadData();
      summonEva("import");
    }

    setImporting(false);
  }

  async function saveGoal() {
    if (!supabase || !couple) return;
    const target = Number(goalForm.target_amount.replace(",", "."));
    const current = Number(goalForm.current_amount.replace(",", ".")) || 0;

    if (!goalForm.title.trim() || !target || target <= 0) {
      setMessage("Informe nome da meta e valor alvo maior que zero.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("financial_goals").insert({
      couple_id: couple.id,
      created_by: null,
      owner_label: goalForm.owner_label,
      title: goalForm.title.trim(),
      target_amount: target,
      current_amount: current,
      monthly_action: goalForm.monthly_action || null,
      target_date: goalForm.target_date || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setGoalForm(initialGoalForm);
      await loadData();
      summonEva("goals");
    }
    setSaving(false);
  }

  async function saveAsset() {
    if (!supabase || !couple) return;
    const estimated = Number(assetForm.estimated_value.replace(",", "."));
    const acquisition = Number(assetForm.acquisition_value.replace(",", "."));

    if (!assetForm.name.trim() || Number.isNaN(estimated) || estimated < 0) {
      setMessage("Informe o bem e seu valor real estimado.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("assets").insert({
      couple_id: couple.id,
      created_by: null,
      name: assetForm.name.trim(),
      asset_type: assetForm.asset_type,
      estimated_value: estimated,
      acquisition_value: assetForm.acquisition_value ? acquisition : null,
      acquired_on: assetForm.acquired_on || null,
      notes: assetForm.notes || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setAssetForm(initialAssetForm);
      await loadData();
      summonEva("assets");
    }
    setSaving(false);
  }

  async function saveGroceryItem() {
    if (!supabase || !couple) return;
    const amount = Number(groceryForm.amount.replace(",", "."));
    const quantity = Number(groceryForm.quantity.replace(",", ".")) || 1;

    if (!groceryForm.item_name.trim() || !amount || amount <= 0) {
      setMessage("Informe o alimento/item e o valor gasto.");
      return;
    }

    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("grocery_items").insert({
      couple_id: couple.id,
      created_by: null,
      purchased_on: groceryForm.purchased_on,
      item_name: groceryForm.item_name.trim(),
      category: groceryForm.category,
      amount,
      quantity,
      store: groceryForm.store || null,
      notes: groceryForm.notes || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setGroceryForm(initialGroceryForm);
      await loadData();
      summonEva("groceries");
    }
    setSaving(false);
  }

  async function deleteTransaction(id: string) {
    if (!supabase) return;
    await supabase.from("transactions").delete().eq("id", id);
    await loadData();
    summonEva(activeTab);
  }

  async function deleteGroceryItem(id: string) {
    if (!supabase) return;
    await supabase.from("grocery_items").delete().eq("id", id);
    await loadData();
    summonEva("groceries");
  }

  async function updateGoalAmount(id: string, newAmount: number) {
    if (!supabase) return;
    await supabase.from("financial_goals").update({ current_amount: newAmount }).eq("id", id);
    await loadData();
    summonEva("goals");
  }

  function saveSpecialDate() {
    if (!specialDateForm.label.trim() || !specialDateForm.date) return;
    const newDate: SpecialDate = { id: String(Date.now()), label: specialDateForm.label.trim(), date: specialDateForm.date };
    const updated = [...specialDates, newDate];
    setSpecialDates(updated);
    localStorage.setItem("rarecouple-special-dates", JSON.stringify(updated));
    setSpecialDateForm({ label: "", date: "" });
    summonEva("security");
  }

  function removeSpecialDate(id: string) {
    const updated = specialDates.filter((d) => d.id !== id);
    setSpecialDates(updated);
    localStorage.setItem("rarecouple-special-dates", JSON.stringify(updated));
  }

  function prevMonth() {
    const [y, m] = filterMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [y, m] = filterMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key <= today.slice(0, 7)) setFilterMonth(key);
  }

  async function signOut() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function downloadCsv() {
    const headers = [
      "id",
      "data",
      "tipo",
      "descrição",
      "categoria",
      "valor",
      "metodo_pagamento",
      "parcela_atual",
      "parcelas_total",
      "despesa_fixa",
      "recorrente",
      "observações",
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
        item.is_fixed ? "sim" : "não",
        item.is_recurring ? "sim" : "não",
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
    summonEva("overview");
  }

  function downloadImportTemplate() {
    const blob = new Blob([`\uFEFF${csvImportTemplate()}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-importacao-rarecouple.csv";
    link.click();
    URL.revokeObjectURL(url);
    summonEva("import");
  }

  if (setupMissing) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-2xl rounded-2xl border border-border bg-panel p-8">
          <p className="text-sm font-semibold text-accent">Configuração pendente</p>
          <h1 className="mt-2 text-3xl font-semibold">RareCouple está pronto para conectar ao Supabase.</h1>
          <p className="mt-4 text-muted">
            Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background" onPointerMove={nudgeEva}>
      <header className="border-b border-[#ead7dd] bg-[#fff8f4]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#ffe0ea] text-[#b94075]">
              <Heart size={22} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-semibold text-accent">RareCouple</p>
              <h1 className="text-2xl font-semibold leading-tight">Painel financeiro compartilhado</h1>
              <p className="break-all text-sm text-muted">{userName} · {userEmail}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <HeaderMemoryStack />
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <IconButton label="Atualizar" onClick={loadData} icon={<RefreshCcw size={17} />} />
              <IconButton label="CSV" onClick={downloadCsv} icon={<Download size={17} />} />
              <IconButton label="Sair" onClick={signOut} icon={<LogOut size={17} />} />
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <nav className="flex gap-2 overflow-x-auto pb-2">
          <TabButton active={activeTab === "overview"} onClick={() => switchTab("overview")} label="Visão geral" icon={<BarChart3 size={17} />} />
          <TabButton active={activeTab === "entry"} onClick={() => switchTab("entry")} label="Lançar" icon={<Plus size={17} />} />
          <TabButton active={activeTab === "import"} onClick={() => switchTab("import")} label="Importar" icon={<FileUp size={17} />} />
          <TabButton active={activeTab === "analysis"} onClick={() => switchTab("analysis")} label="Análises" icon={<Sparkles size={17} />} />
          <TabButton active={activeTab === "goals"} onClick={() => switchTab("goals")} label="Metas" icon={<Target size={17} />} />
          <TabButton active={activeTab === "assets"} onClick={() => switchTab("assets")} label="Bens" icon={<Package size={17} />} />
          <TabButton active={activeTab === "groceries"} onClick={() => switchTab("groceries")} label="Feira" icon={<ShoppingBasket size={17} />} />
          <TabButton active={activeTab === "security"} onClick={() => switchTab("security")} label="Segurança" icon={<ShieldCheck size={17} />} />
        </nav>

        {message ? <p className="mt-3 rounded-2xl bg-[#fff4d8] p-3 text-sm text-[#6b4b09]">{message}</p> : null}

        {specialDateAlert ? (
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#ead7dd] bg-[#fff0f5] p-3">
            <Bell size={18} className="shrink-0 text-[#b94075]" />
            <p className="flex-1 text-sm font-semibold text-[#91365f]">
              Eva Flor lembra: <span className="font-bold">{specialDateAlert}</span> está chegando! Aproveitem juntos.
            </p>
            <button onClick={() => setSpecialDateAlert(null)} className="text-[#b94075] hover:opacity-70">
              <X size={16} />
            </button>
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric title="Entradas" value={money(totals.income)} icon={<ArrowDownToLine size={18} />} />
                <Metric title="Saídas" value={money(totals.expense)} icon={<CreditCard size={18} />} tone="danger" />
                <Metric title="Saldo" value={money(totals.balance)} icon={<Wallet size={18} />} />
                <Metric title="Poupança" value={`${totals.savingsRate}%`} icon={<PiggyBank size={18} />} />
              </div>

              <Panel title="Resumo de gastos" icon={<CalendarDays size={18} />}>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <PeriodCard title="Hoje" value={periodSummary.daily} helper="Gasto registrado no dia" />
                  <PeriodCard title="Semana" value={periodSummary.weekly} helper="Do domingo até hoje" />
                  <PeriodCard title="Mês" value={periodSummary.monthly} helper="Total do mês atual" />
                  <PeriodCard title="Média diária" value={periodSummary.dailyAverage} helper="Média do mês até agora" />
                </div>
              </Panel>

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

              <TransactionFilters
                filterMonth={filterMonth}
                filterCategory={filterCategory}
                filterType={filterType}
                searchText={searchText}
                onPrevMonth={prevMonth}
                onNextMonth={nextMonth}
                onCategoryChange={setFilterCategory}
                onTypeChange={setFilterType}
                onSearchChange={setSearchText}
                isCurrentMonth={filterMonth === today.slice(0, 7)}
              />
              <RecentTransactions loading={loading} transactions={filteredTransactions} onDelete={deleteTransaction} />
            </div>

            <div className="grid content-start gap-5">
              <QuickEntry
                quickForm={quickForm}
                setQuickForm={setQuickForm}
                saving={saving}
                onSave={saveQuickTransaction}
              />
              <CouplePanel couple={couple} />
              <MemoryPanel />
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
              <Panel title="Dica de lançamento" icon={<Sparkles size={18} />}>
                <p className="text-sm leading-6 text-muted">
                  Use o lançamento rápido para gastos do dia. Use o formulario completo quando houver parcelas,
                  despesa fixa, recorrência ou observações importantes para o CSV.
                </p>
              </Panel>
              <EvaCard tab="entry" />
            </div>
          </div>
        ) : null}

        {activeTab === "import" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <ImportPanel
              importing={importing}
              report={importReport}
              rows={importRows}
              onFile={handleImportFile}
              onDownloadTemplate={downloadImportTemplate}
              onSave={saveImportedTransactions}
            />
            <ImportPreview
              rows={importRows}
              importing={importing}
              onChange={updateImportRow}
            />
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
              <Panel title="Tendência de saldo" icon={<LineChartIcon size={18} />}>
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
                  <Ratio label="Investimentos" value={totals.investmentRate} helper="Ajuda a transformar renda em patrimônio." />
                  <Ratio
                    label="Parcelas"
                    value={totals.expense ? Math.round((totals.installments / totals.expense) * 100) : 0}
                    helper="Quanto menor, mais liberdade no mês seguinte."
                  />
                </div>
              </Panel>
            </section>
            <Panel title="Mapa de decisões do casal" icon={<Heart size={18} />}>
              <div className="grid gap-3 md:grid-cols-3">
                <Decision title="Hoje" text={`Registrar tudo acima de ${money(Math.max(totals.dailyPace * 0.3, 20))} para manter precisão.`} />
                <Decision title="Semana" text="Olhar a categoria dominante antes de compras por impulso." />
                <Decision title="Mês" text={`Se a projeção passar de ${money(totals.income)}, revisem despesas variáveis antes das fixas.`} />
              </div>
            </Panel>
            <MemoryPanel wide />
          </div>
        ) : null}

        {activeTab === "goals" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <GoalForm goalForm={goalForm} setGoalForm={setGoalForm} saving={saving} onSave={saveGoal} />
            <div className="grid content-start gap-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric title="Guardado" value={money(goalSummary.current)} icon={<PiggyBank size={18} />} />
                <Metric title="Alvo total" value={money(goalSummary.target)} icon={<Target size={18} />} />
                <Metric title="Progresso" value={`${goalSummary.progress}%`} icon={<TrendingUp size={18} />} />
              </div>
              <Panel title="Metas coletivas e individuais" icon={<Target size={18} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  {goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} onUpdate={updateGoalAmount} />
                  ))}
                  {!goals.length ? <EmptyState text="Nenhuma meta ainda. Comecem por uma coletiva pequena e clara." /> : null}
                </div>
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "assets" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <AssetForm assetForm={assetForm} setAssetForm={setAssetForm} saving={saving} onSave={saveAsset} />
            <div className="grid content-start gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric title="Patrimônio listado" value={money(assetSummary.total)} icon={<Package size={18} />} />
                <Metric title="Itens cadastrados" value={String(assets.length)} icon={<Sparkles size={18} />} />
              </div>
              <Panel title="Bens por tipo" icon={<BarChart3 size={18} />}>
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={assetSummary.byType}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ead7dd" />
                      <XAxis dataKey="name" stroke="#7a6a70" />
                      <YAxis stroke="#7a6a70" width={68} tickFormatter={(value) => compactMoney(Number(value))} />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Bar dataKey="value" fill="#2f9f90" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>
              <Panel title="Lista de bens" icon={<Package size={18} />}>
                <SimpleList
                  items={assets.map((asset) => ({
                    id: asset.id,
                    title: asset.name,
                    detail: `${asset.asset_type}${asset.notes ? ` · ${asset.notes}` : ""}`,
                    value: money(Number(asset.estimated_value)),
                  }))}
                  empty="Cadastre bens como carro, equipamentos, reservas, joias ou outros itens de valor."
                />
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "groceries" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)]">
            <GroceryForm groceryForm={groceryForm} setGroceryForm={setGroceryForm} saving={saving} onSave={saveGroceryItem} />
            <div className="grid content-start gap-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric title="Feira do mês" value={money(grocerySummary.total)} icon={<ShoppingBasket size={18} />} />
                <Metric title="Itens do mês" value={String(grocerySummary.items.length)} icon={<Package size={18} />} />
                <Metric title="Média por item" value={money(grocerySummary.items.length ? grocerySummary.total / grocerySummary.items.length : 0)} icon={<Wallet size={18} />} />
              </div>
              <Panel title="Relatório de comida no mês" icon={<BarChart3 size={18} />}>
                <ChartFrame>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={grocerySummary.byCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ead7dd" />
                      <XAxis dataKey="name" stroke="#7a6a70" />
                      <YAxis stroke="#7a6a70" width={68} tickFormatter={(value) => compactMoney(Number(value))} />
                      <Tooltip formatter={(value) => money(Number(value))} />
                      <Bar dataKey="value" fill="#d96b9d" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
              </Panel>
              <Panel title="Itens comprados" icon={<ShoppingBasket size={18} />}>
                <SimpleList
                  items={grocerySummary.items.map((item) => ({
                    id: item.id,
                    title: item.item_name,
                    detail: `${item.purchased_on} · ${item.category}${item.store ? ` · ${item.store}` : ""}`,
                    value: money(Number(item.amount)),
                  }))}
                  empty="Cadastre alimentos, mercado, acougue, hortifruti, delivery e outras compras de comida."
                  onDelete={deleteGroceryItem}
                />
              </Panel>
            </div>
          </div>
        ) : null}

        {activeTab === "security" ? (
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Panel title="Datas especiais" icon={<Bell size={18} />}>
              <div className="grid gap-3">
                <div className="grid grid-cols-[1fr_140px_auto] gap-2 max-[520px]:grid-cols-1">
                  <label className="label">
                    Nome da data
                    <input
                      className="field"
                      placeholder="Ex: Aniversário do casal"
                      value={specialDateForm.label}
                      onChange={(e) => setSpecialDateForm({ ...specialDateForm, label: e.target.value })}
                    />
                  </label>
                  <label className="label">
                    Mês e dia
                    <input
                      className="field"
                      type="date"
                      value={specialDateForm.date ? `2000-${specialDateForm.date}` : ""}
                      onChange={(e) => setSpecialDateForm({ ...specialDateForm, date: e.target.value.slice(5) })}
                    />
                  </label>
                  <div className="label">
                    <span className="invisible text-xs">add</span>
                    <button
                      onClick={saveSpecialDate}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong"
                    >
                      <Plus size={16} />
                      Salvar
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  A Eva Flor aparece automaticamente nos 3 dias antes de cada data cadastrada aqui.
                  As datas ficam salvas neste dispositivo.
                </p>
                {specialDates.length > 0 ? (
                  <div className="grid gap-2">
                    {specialDates.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold">{d.label}</p>
                          <p className="text-xs text-muted">{d.date} (todo ano)</p>
                        </div>
                        <button onClick={() => removeSpecialDate(d.id)} className="text-muted hover:text-danger">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-white p-3 text-sm text-muted">
                    Nenhuma data cadastrada ainda. Adicionem o aniversario do casal!
                  </p>
                )}
              </div>
            </Panel>
            <Panel title="Acesso exclusivo" icon={<ShieldCheck size={18} />}>
              <div className="grid gap-3">
                <SecurityItem title="Dois acessos internos" text="Somente Samuel e Stephanie entram com os identificadores definidos no app." done />
                <SecurityItem title="Sem criação pública" text="A tela não cria contas e não envia email; ela abre uma sessao privada no proprio app." done />
                <SecurityItem title="Senha compartilhada" text="A senha atual foi configurada conforme combinado. Troque quando quiser aumentar a segurança." />
                <SecurityItem title="Casa única" text="Depois do login, os dois perfis veem a mesma casa financeira RareCouple." done />
              </div>
            </Panel>
            <Panel title="Conta compartilhada" icon={<Heart size={18} />}>
              <div className="grid gap-3 text-sm leading-6 text-muted">
                <p>Casa: <strong className="text-foreground">{couple?.name ?? "RareCouple"}</strong></p>
                <p>Código interno: <strong className="font-mono text-foreground">{couple?.invite_code ?? "pendente"}</strong></p>
                <p>
                  Os dois acessos internos usam a mesma casa financeira. Não depende de email real nem confirmação.
                </p>
              </div>
            </Panel>
            <EvaCard tab="security" />
          </div>
        ) : null}
      </section>
      <EvaBubble bubble={evaBubble} />
    </main>
  );
}

function HeaderMemoryStack() {
  return (
    <div className="flex -space-x-3 self-start sm:self-auto" aria-label="Memorias do RareCouple">
      {memories.slice(0, 4).map((memory) => (
        <Image
          key={memory.src}
          src={memory.src}
          alt={memory.alt}
          width={40}
          height={40}
          className="size-10 rounded-full border-2 border-[#fff8f4] object-cover shadow-sm"
        />
      ))}
    </div>
  );
}

function MemoryPanel({ wide = false }: { wide?: boolean }) {
  const shown = wide ? memories.slice(0, 8) : memories.slice(0, 5);

  return (
    <Panel title="A cara da casa" icon={<Heart size={18} />}>
      <div className={`grid gap-2 ${wide ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {shown.map((memory, index) => (
          <div
            key={memory.src}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-white ${
              wide && index === 0 ? "sm:col-span-2 sm:row-span-2" : ""
            }`}
          >
            <Image
              src={memory.src}
              alt={memory.alt}
              fill
              sizes={wide ? "(max-width: 640px) 50vw, 25vw" : "120px"}
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
            <div className={wide && index === 0 ? "aspect-[2/1.08]" : "aspect-square"} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs font-semibold text-white">{memory.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function EvaCard({ tab }: { tab?: string }) {
  const [quote, setQuote] = useState(() => getEvaQuote(tab));
  const [photo, setPhoto] = useState(() => getRandomEvaPhoto());
  const [key, setKey] = useState(0);

  function newQuote() {
    setQuote(getEvaQuote(tab));
    setPhoto(getRandomEvaPhoto());
    setKey((k) => k + 1);
  }

  return (
    <Panel title="Recado da Eva Flor" icon={<Sparkles size={18} />}>
      <div className="flex items-start gap-3">
        <button
          onClick={newQuote}
          className="eva-wiggle shrink-0 overflow-hidden rounded-2xl border-2 border-[#ead7dd] focus:outline-none focus:ring-2 focus:ring-[#d96b9d]"
          title="Clique para novo recado"
          style={{ width: 64, height: 64 }}
        >
          <Image
            key={photo}
            src={photo}
            alt="Eva Flor"
            width={64}
            height={64}
            className="size-16 object-cover transition duration-300 hover:scale-105"
          />
        </button>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b94075]">Eva Flor</p>
          <p key={key} className="eva-enter mt-2 text-sm leading-6 text-muted">
            {quote}
          </p>
          <button
            onClick={newQuote}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#ead7dd] bg-[#fff0f5] px-2.5 py-1 text-xs font-semibold text-[#b94075] hover:bg-[#ffe0ea] transition"
          >
            <RefreshCcw size={11} />
            Novo recado
          </button>
        </div>
      </div>
    </Panel>
  );
}

function EvaBubble({ bubble }: { bubble: { id: number; quote: string; photo: string } | null }) {
  if (!bubble) return null;

  return (
    <div key={bubble.id} className="eva-enter pointer-events-none fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:right-5 sm:max-w-sm">
      <div className="ml-auto flex max-w-sm items-end gap-3 rounded-2xl border border-[#ead7dd] bg-white p-3 shadow-[0_18px_60px_rgba(73,37,58,0.18)]">
        <div className="shrink-0 overflow-hidden rounded-2xl border-2 border-[#ffe0ea]" style={{ width: 56, height: 56 }}>
          <Image
            src={bubble.photo}
            alt="Eva Flor"
            width={56}
            height={56}
            className="size-14 object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b94075]">Eva Flor</p>
          <p className="mt-1 text-sm leading-5 text-foreground">{bubble.quote}</p>
        </div>
      </div>
    </div>
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
    <Panel title="Lançamento rápido" icon={<Wallet size={18} />}>
      <div className="grid gap-3">
        <div className="grid grid-cols-[1fr_120px] gap-3 max-[420px]:grid-cols-1">
          <label className="label">
            O que foi?
            <input className="field" placeholder="Ex: almoço, mercado, táxi" value={quickForm.description} onChange={(e) => setQuickForm({ ...quickForm, description: e.target.value })} />
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
          Salvar rápido
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
    <Panel title="Lançamento completo" icon={<Plus size={18} />}>
      <div className="grid gap-3">
        <label className="label">
          Descrição
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
          Observações
          <textarea className="field min-h-20 resize-y" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          Salvar lançamento
        </button>
      </div>
    </Panel>
  );
}

function GoalForm({
  goalForm,
  setGoalForm,
  saving,
  onSave,
}: {
  goalForm: typeof initialGoalForm;
  setGoalForm: (value: typeof initialGoalForm) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Panel title="Nova meta" icon={<Target size={18} />}>
      <div className="grid gap-3">
        <Select label="Dona da meta" value={goalForm.owner_label} onChange={(value) => setGoalForm({ ...goalForm, owner_label: value })} options={["Coletiva", "Samuel", "Esposa"]} />
        <label className="label">
          Meta
          <input className="field" placeholder="Ex: viagem, reserva, reforma" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <label className="label">
            Valor alvo
            <input className="field" inputMode="decimal" value={goalForm.target_amount} onChange={(e) => setGoalForm({ ...goalForm, target_amount: e.target.value })} />
          </label>
          <label className="label">
            Ja juntamos
            <input className="field" inputMode="decimal" value={goalForm.current_amount} onChange={(e) => setGoalForm({ ...goalForm, current_amount: e.target.value })} />
          </label>
        </div>
        <label className="label">
          Ação combinada
          <input className="field" placeholder="Ex: guardar 500 por mês" value={goalForm.monthly_action} onChange={(e) => setGoalForm({ ...goalForm, monthly_action: e.target.value })} />
        </label>
        <label className="label">
          Data alvo
          <input className="field" type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} />
        </label>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Target size={18} />}
          Salvar meta
        </button>
      </div>
    </Panel>
  );
}

function AssetForm({
  assetForm,
  setAssetForm,
  saving,
  onSave,
}: {
  assetForm: typeof initialAssetForm;
  setAssetForm: (value: typeof initialAssetForm) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Panel title="Novo bem" icon={<Package size={18} />}>
      <div className="grid gap-3">
        <label className="label">
          Bem
          <input className="field" placeholder="Ex: carro, notebook, reserva" value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
        </label>
        <Select label="Tipo" value={assetForm.asset_type} onChange={(value) => setAssetForm({ ...assetForm, asset_type: value })} options={["Veículo", "Eletrônico", "Reserva", "Investimento", "Casa", "Joia", "Outro"]} />
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <label className="label">
            Valor real hoje
            <input className="field" inputMode="decimal" value={assetForm.estimated_value} onChange={(e) => setAssetForm({ ...assetForm, estimated_value: e.target.value })} />
          </label>
          <label className="label">
            Valor de compra
            <input className="field" inputMode="decimal" value={assetForm.acquisition_value} onChange={(e) => setAssetForm({ ...assetForm, acquisition_value: e.target.value })} />
          </label>
        </div>
        <label className="label">
          Data de aquisição
          <input className="field" type="date" value={assetForm.acquired_on} onChange={(e) => setAssetForm({ ...assetForm, acquired_on: e.target.value })} />
        </label>
        <label className="label">
          Observações
          <textarea className="field min-h-20 resize-y" value={assetForm.notes} onChange={(e) => setAssetForm({ ...assetForm, notes: e.target.value })} />
        </label>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Package size={18} />}
          Salvar bem
        </button>
      </div>
    </Panel>
  );
}

function GroceryForm({
  groceryForm,
  setGroceryForm,
  saving,
  onSave,
}: {
  groceryForm: typeof initialGroceryForm;
  setGroceryForm: (value: typeof initialGroceryForm) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <Panel title="Adicionar na feira" icon={<ShoppingBasket size={18} />}>
      <div className="grid gap-3">
        <label className="label">
          Alimento ou compra
          <input className="field" placeholder="Ex: arroz, carne, frutas" value={groceryForm.item_name} onChange={(e) => setGroceryForm({ ...groceryForm, item_name: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <label className="label">
            Valor
            <input className="field" inputMode="decimal" value={groceryForm.amount} onChange={(e) => setGroceryForm({ ...groceryForm, amount: e.target.value })} />
          </label>
          <label className="label">
            Quantidade
            <input className="field" inputMode="decimal" value={groceryForm.quantity} onChange={(e) => setGroceryForm({ ...groceryForm, quantity: e.target.value })} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[420px]:grid-cols-1">
          <Select label="Categoria" value={groceryForm.category} onChange={(value) => setGroceryForm({ ...groceryForm, category: value })} options={["Alimentos", "Hortifruti", "Carnes", "Laticínios", "Padaria", "Bebidas", "Delivery", "Limpeza", "Outros"]} />
          <label className="label">
            Data
            <input className="field" type="date" value={groceryForm.purchased_on} onChange={(e) => setGroceryForm({ ...groceryForm, purchased_on: e.target.value })} />
          </label>
        </div>
        <label className="label">
          Mercado/local
          <input className="field" value={groceryForm.store} onChange={(e) => setGroceryForm({ ...groceryForm, store: e.target.value })} />
        </label>
        <button className="flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong" disabled={saving} onClick={onSave}>
          {saving ? <Loader2 className="animate-spin" size={18} /> : <ShoppingBasket size={18} />}
          Salvar item
        </button>
      </div>
    </Panel>
  );
}

function ImportPanel({
  importing,
  report,
  rows,
  onFile,
  onDownloadTemplate,
  onSave,
}: {
  importing: boolean;
  report: string;
  rows: ImportedTransactionDraft[];
  onFile: (file: File | null) => void;
  onDownloadTemplate: () => void;
  onSave: () => void;
}) {
  const selected = rows.filter((row) => row.selected).length;
  const duplicates = rows.filter((row) => row.duplicate).length;

  return (
    <div className="grid content-start gap-5">
      <Panel title="Importar fatura ou planilha" icon={<FileUp size={18} />}>
        <div className="grid gap-4">
          <label className="grid cursor-pointer place-items-center rounded-2xl border border-dashed border-[#d96b9d] bg-[#fff8f4] p-6 text-center hover:bg-[#fff0f5]">
            <input
              className="sr-only"
              type="file"
              accept=".csv,.ofx,.txt,.pdf,text/csv,application/pdf"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
            <Upload size={26} className="text-[#b94075]" />
            <span className="mt-3 text-sm font-semibold">Escolher CSV, OFX, TXT ou PDF</span>
            <span className="mt-1 text-xs leading-5 text-muted">
              CSV do Nubank funciona melhor. PDF precisa ter texto selecionável; imagem escaneada ainda precisa de OCR dedicado.
            </span>
          </label>

          <button
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold hover:border-accent"
            onClick={onDownloadTemplate}
          >
            <FileSpreadsheet size={17} />
            Baixar modelo CSV
          </button>

          {report ? (
            <div className="rounded-2xl border border-border bg-white p-3 text-sm leading-6 text-muted">
              {report}
              {duplicates ? <span className="block text-[#b94075]">{duplicates} possível(is) duplicado(s) foram desmarcados.</span> : null}
            </div>
          ) : null}

          <button
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={importing || selected === 0}
            onClick={onSave}
          >
            {importing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            Salvar {selected || ""} lançamento{selected === 1 ? "" : "s"}
          </button>
        </div>
      </Panel>

      <Panel title="Como organizar as parcelas" icon={<CreditCard size={18} />}>
        <div className="grid gap-3 text-sm leading-6 text-muted">
          <p>Quando o arquivo trouxer algo como 1/10, 02/03 ou colunas de parcela, o RareCouple já preenche parcela atual e total.</p>
          <p>Antes de salvar, revise categoria, pagamento e valor. Assim a fatura entra limpa no dashboard e no CSV.</p>
        </div>
      </Panel>

      <EvaCard tab="import" />
    </div>
  );
}

function ImportPreview({
  rows,
  importing,
  onChange,
}: {
  rows: ImportedTransactionDraft[];
  importing: boolean;
  onChange: (id: string, patch: Partial<ImportedTransactionDraft>) => void;
}) {
  if (!rows.length) {
    return (
      <Panel title="Prévia da importação" icon={<FileSpreadsheet size={18} />}>
        <div className="rounded-2xl border border-dashed border-border bg-white p-6 text-sm leading-6 text-muted">
          Importe uma fatura ou use o modelo CSV. A prévia aparece aqui para você conferir antes de gravar no app.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={`Prévia da importação (${rows.length})`} icon={<FileSpreadsheet size={18} />}>
      <div className="grid gap-3">
        {rows.map((row) => (
          <div key={row.id} className={`rounded-2xl border p-3 ${row.duplicate ? "border-[#f2b6c9] bg-[#fff0f5]" : "border-border bg-white"}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={row.selected}
                  disabled={importing}
                  onChange={(event) => onChange(row.id, { selected: event.target.checked })}
                />
                Importar
              </label>
              <div className="flex items-center gap-2 text-xs text-muted">
                {row.duplicate ? <AlertTriangle size={14} className="text-[#b94075]" /> : null}
                {row.confidence}% confiança
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-[130px_minmax(180px,1fr)_120px]">
              <label className="label">
                Data
                <input className="field" type="date" value={row.occurred_on} onChange={(event) => onChange(row.id, { occurred_on: event.target.value })} />
              </label>
              <label className="label">
                Descrição
                <input className="field" value={row.description} onChange={(event) => onChange(row.id, { description: event.target.value })} />
              </label>
              <label className="label">
                Valor
                <input className="field" inputMode="decimal" value={row.amount} onChange={(event) => onChange(row.id, { amount: event.target.value })} />
              </label>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-4">
              <Select label="Categoria" value={row.category} options={categories} onChange={(value) => onChange(row.id, { category: value })} />
              <Select label="Pagamento" value={row.payment_method} options={paymentMethods} onChange={(value) => onChange(row.id, { payment_method: value })} />
              <label className="label">
                Parcela atual
                <input className="field" type="number" min="1" value={row.installment_number} onChange={(event) => onChange(row.id, { installment_number: event.target.value })} />
              </label>
              <label className="label">
                Total parcelas
                <input className="field" type="number" min="1" value={row.installments_total} onChange={(event) => onChange(row.id, { installments_total: event.target.value })} />
              </label>
            </div>

            <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_2fr]">
              <Select
                label="Tipo"
                value={row.transaction_type}
                options={["expense", "income", "investment", "transfer"]}
                labels={typeLabel}
                onChange={(value) => onChange(row.id, { transaction_type: value as TransactionType })}
              />
              <Check label="Recorrente" checked={row.is_recurring} onChange={(value) => onChange(row.id, { is_recurring: value })} />
              <label className="label">
                Observações
                <input className="field" value={row.notes} onChange={(event) => onChange(row.id, { notes: event.target.value })} />
              </label>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RecentTransactions({
  loading,
  transactions,
  onDelete,
}: {
  loading: boolean;
  transactions: Transaction[];
  onDelete: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  }

  return (
    <Panel title={`Lançamentos (${transactions.length})`} icon={<CreditCard size={18} />}>
      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted">
          <Loader2 className="animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white p-4 text-sm text-muted">
          Nenhum lançamento encontrado para os filtros selecionados.
        </p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-border">
                  <th className="py-3">Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Parcela</th>
                  <th className="text-right">Valor</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b border-border/70 hover:bg-[#fff8f4]">
                    <td className="py-3 font-mono text-xs">{item.occurred_on}</td>
                    <td className="font-medium">{item.description}</td>
                    <td>{item.category}</td>
                    <td>{typeLabel(item.transaction_type)}</td>
                    <td>{item.installment_number}/{item.installments_total}</td>
                    <td className="text-right font-semibold">{money(Number(item.amount))}</td>
                    <td className="pl-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        title={confirmId === item.id ? "Clique de novo para confirmar" : "Excluir"}
                        className={`rounded-lg p-1.5 transition ${confirmId === item.id ? "bg-danger text-white" : "text-muted hover:text-danger"}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 md:hidden">
            {transactions.slice(0, 20).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.description}</p>
                    <p className="text-xs text-muted">{item.occurred_on} · {item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="shrink-0 font-semibold">{money(Number(item.amount))}</p>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`rounded-lg p-1.5 ${confirmId === item.id ? "bg-danger text-white" : "text-muted hover:text-danger"}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
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
        <p>Código: <strong className="font-mono text-foreground">{couple?.invite_code ?? "pendente"}</strong></p>
        <p>Todos os lançamentos ficam padronizados para CSV e análises futuras.</p>
      </div>
    </Panel>
  );
}

function GoalCard({ goal, onUpdate }: { goal: FinancialGoal; onUpdate: (id: string, amount: number) => void }) {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const progress = target ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(current));
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    const val = Number(String(inputVal).replace(",", "."));
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    await onUpdate(goal.id, val);
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b94075]">{goal.owner_label}</p>
          <h3 className="mt-1 font-semibold">{goal.title}</h3>
        </div>
        <span className="rounded-full bg-[#ffe0ea] px-3 py-1 text-xs font-semibold text-[#91365f]">{progress}%</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#f3e7ea]">
        <div className="h-full rounded-full bg-[#d96b9d]" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex justify-between gap-3 text-sm text-muted">
        <span>{money(current)}</span>
        <span>{money(target)}</span>
      </div>
      {goal.monthly_action ? <p className="mt-3 text-sm leading-6 text-muted">{goal.monthly_action}</p> : null}
      {editing ? (
        <div className="mt-3 flex gap-2">
          <input
            className="field h-9 flex-1 text-sm"
            inputMode="decimal"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Valor atual"
          />
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-xs font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : null}
            Salvar
          </button>
          <button onClick={() => setEditing(false)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:text-foreground">
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => { setInputVal(String(current)); setEditing(true); }}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#ead7dd] bg-[#fff0f5] px-2.5 py-1 text-xs font-semibold text-[#b94075] hover:bg-[#ffe0ea] transition"
        >
          <Plus size={11} />
          Atualizar progresso
        </button>
      )}
    </div>
  );
}

function SimpleList({
  items,
  empty,
  onDelete,
}: {
  items: Array<{ id: string; title: string; detail: string; value: string }>;
  empty: string;
  onDelete?: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (!onDelete) return;
    if (confirmId === id) {
      onDelete(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  }

  if (!items.length) {
    return <EmptyState text={empty} />;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-white p-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm leading-6 text-muted">{item.detail}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="font-semibold">{item.value}</p>
            {onDelete ? (
              <button
                onClick={() => handleDelete(item.id)}
                title={confirmId === item.id ? "Clique de novo para confirmar" : "Excluir"}
                className={`rounded-lg p-1.5 transition ${confirmId === item.id ? "bg-danger text-white" : "text-muted hover:text-danger"}`}
              >
                <Trash2 size={13} />
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionFilters({
  filterMonth,
  filterCategory,
  filterType,
  searchText,
  onPrevMonth,
  onNextMonth,
  onCategoryChange,
  onTypeChange,
  onSearchChange,
  isCurrentMonth,
}: {
  filterMonth: string;
  filterCategory: string;
  filterType: string;
  searchText: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCategoryChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  isCurrentMonth: boolean;
}) {
  const label = (() => {
    const [y, m] = filterMonth.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();

  return (
    <div className="rounded-2xl border border-border bg-panel p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* Navegação de mês */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-white px-1">
          <button onClick={onPrevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[130px] text-center text-sm font-semibold capitalize">{label}</span>
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-foreground disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Filtro de categoria */}
        <select
          className="field h-9 w-auto min-w-[130px] text-sm"
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Todas categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Filtro de tipo */}
        <select
          className="field h-9 w-auto text-sm"
          value={filterType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="">Todos tipos</option>
          <option value="expense">Despesa</option>
          <option value="income">Receita</option>
          <option value="investment">Investimento</option>
        </select>

        {/* Busca por texto */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="field h-9 pl-8 text-sm"
            placeholder="Buscar descrição..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Limpar filtros */}
        {(filterCategory || filterType || searchText) ? (
          <button
            onClick={() => { onCategoryChange(""); onTypeChange(""); onSearchChange(""); }}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-sm text-muted hover:text-foreground"
          >
            <X size={13} /> Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-2xl border border-dashed border-border bg-white p-4 text-sm leading-6 text-muted">{text}</p>;
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

function PeriodCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm font-semibold text-[#b94075]">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{money(value)}</p>
      <p className="mt-1 text-sm text-muted">{helper}</p>
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

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
    transfer: "Transferência",
  };
  return labels[value] ?? value;
}
