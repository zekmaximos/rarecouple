export type TransactionType = "expense" | "income" | "investment" | "transfer";

export type Transaction = {
  id: string;
  couple_id: string;
  created_by: string;
  occurred_on: string;
  description: string;
  amount: number;
  transaction_type: TransactionType;
  category: string;
  payment_method: string;
  installments_total: number;
  installment_number: number;
  is_fixed: boolean;
  is_recurring: boolean;
  notes: string | null;
  created_at: string;
};

export type FinancialGoal = {
  id: string;
  couple_id: string;
  created_by: string | null;
  owner_label: string;
  title: string;
  target_amount: number;
  current_amount: number;
  monthly_action: string | null;
  target_date: string | null;
  status: "active" | "paused" | "done";
  created_at: string;
};

export type Asset = {
  id: string;
  couple_id: string;
  created_by: string | null;
  name: string;
  asset_type: string;
  estimated_value: number;
  acquisition_value: number | null;
  acquired_on: string | null;
  notes: string | null;
  created_at: string;
};

export type GroceryItem = {
  id: string;
  couple_id: string;
  created_by: string | null;
  purchased_on: string;
  item_name: string;
  category: string;
  amount: number;
  quantity: number;
  store: string | null;
  notes: string | null;
  created_at: string;
};

export const categories = [
  "Moradia",
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
  "Cartão",
  "Investimentos",
  "Receita",
  "Outros",
];

export const paymentMethods = [
  "Pix",
  "Débito",
  "Crédito",
  "Dinheiro",
  "Boleto",
  "Transferência",
];

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function signedAmount(transaction: Pick<Transaction, "amount" | "transaction_type">) {
  if (transaction.transaction_type === "expense") {
    return -Math.abs(Number(transaction.amount));
  }

  if (transaction.transaction_type === "transfer") {
    return 0;
  }

  return Math.abs(Number(transaction.amount));
}
