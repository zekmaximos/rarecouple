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

export const categories = [
  "Moradia",
  "Mercado",
  "Restaurantes",
  "Transporte",
  "Saude",
  "Lazer",
  "Educacao",
  "Assinaturas",
  "Cartao",
  "Investimentos",
  "Receita",
  "Outros",
];

export const paymentMethods = [
  "Pix",
  "Debito",
  "Credito",
  "Dinheiro",
  "Boleto",
  "Transferencia",
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

