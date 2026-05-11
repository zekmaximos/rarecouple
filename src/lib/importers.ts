import { categories, paymentMethods, Transaction, TransactionType } from "@/lib/finance";

export type ImportedTransactionDraft = {
  id: string;
  occurred_on: string;
  description: string;
  amount: string;
  transaction_type: TransactionType;
  category: string;
  payment_method: string;
  installments_total: string;
  installment_number: string;
  is_fixed: boolean;
  is_recurring: boolean;
  notes: string;
  source: string;
  confidence: number;
  selected: boolean;
  duplicate: boolean;
};

export const importTemplateHeaders = [
  "data",
  "descricao",
  "valor",
  "tipo",
  "categoria",
  "metodo_pagamento",
  "parcela_atual",
  "parcelas_total",
  "despesa_fixa",
  "recorrente",
  "observacoes",
];

export function csvImportTemplate() {
  const rows = [
    importTemplateHeaders,
    ["2026-05-11", "Mercado do mês", "325,40", "expense", "Mercado", "Crédito", "1", "1", "não", "não", "Compra no Nubank"],
    ["2026-05-11", "Notebook 1/10", "249,90", "expense", "Eletrônico", "Crédito", "1", "10", "não", "não", "Parcela do cartão"],
    ["2026-05-11", "Salário", "4500,00", "income", "Receita", "Pix", "1", "1", "não", "sim", "Entrada mensal"],
  ];

  return rows.map((row) => row.map(csvCell).join(";")).join("\n");
}

export function parseImportText(text: string, sourceName: string) {
  const source = sourceName.toLowerCase();
  if (source.endsWith(".csv")) return parseCsvTransactions(text, sourceName);
  if (source.endsWith(".ofx") || source.endsWith(".txt")) return parseStatementText(text, sourceName);
  return parseStatementText(text, sourceName);
}

export function markDuplicates(rows: ImportedTransactionDraft[], transactions: Transaction[]) {
  return rows.map((row) => {
    const duplicate = transactions.some((item) => {
      return (
        item.occurred_on === row.occurred_on &&
        normalizeKey(item.description) === normalizeKey(row.description) &&
        Number(item.amount).toFixed(2) === Number(row.amount).toFixed(2)
      );
    });

    return { ...row, duplicate, selected: !duplicate };
  });
}

function parseCsvTransactions(text: string, sourceName: string) {
  const table = parseDelimited(text);
  if (table.length < 2) return [];

  const headers = table[0].map((header) => normalizeHeader(header));
  const dataRows = table.slice(1).filter((row) => row.some((cell) => cell.trim()));

  return dataRows
    .map((row, index) => rowToDraft(row, headers, sourceName, index))
    .filter((row): row is ImportedTransactionDraft => Boolean(row));
}

function rowToDraft(row: string[], headers: string[], sourceName: string, index: number) {
  const pick = (...names: string[]) => {
    const normalizedNames = names.map(normalizeHeader);
    const position = headers.findIndex((header) => normalizedNames.includes(header));
    return position >= 0 ? row[position]?.trim() ?? "" : "";
  };

  const description = pick("descricao", "descrição", "description", "title", "nome", "estabelecimento", "detalhes");
  const amountText = pick("valor", "amount", "quantia", "preco", "preço");
  const dateText = pick("data", "date", "occurred_on", "posted date", "post date");
  const amount = parseMoney(amountText);
  const occurredOn = parseDate(dateText);

  if (!description || !amount || !occurredOn) return null;

  const explicitType = normalizeType(pick("tipo", "type", "transaction_type"));
  const installment = parseInstallment(description, pick("parcela_atual", "installment_number"), pick("parcelas_total", "installments_total"));
  const paymentMethod = normalizePayment(pick("metodo_pagamento", "método_pagamento", "payment_method", "cartao", "cartão"), sourceName);
  const category = normalizeCategory(pick("categoria", "category"), description);
  const isExpense = explicitType ? explicitType === "expense" : true;

  return {
    id: `${sourceName}-${index}-${description}`,
    occurred_on: occurredOn,
    description: cleanDescription(description),
    amount: Math.abs(amount).toFixed(2),
    transaction_type: explicitType ?? (amount < 0 || isExpense ? "expense" : "income"),
    category,
    payment_method: paymentMethod,
    installments_total: String(installment.total),
    installment_number: String(installment.current),
    is_fixed: parseBoolean(pick("despesa_fixa", "fixa", "fixed")),
    is_recurring: parseBoolean(pick("recorrente", "recurring")),
    notes: pick("observacoes", "observações", "notes", "memo") || `Importado de ${sourceName}`,
    source: sourceName,
    confidence: 92,
    selected: true,
    duplicate: false,
  };
}

function parseStatementText(text: string, sourceName: string) {
  const year = extractYear(text);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return lines
    .map((line, index) => lineToDraft(line, sourceName, index, year))
    .filter((row): row is ImportedTransactionDraft => Boolean(row));
}

function lineToDraft(line: string, sourceName: string, index: number, fallbackYear: number) {
  const numericDate = line.match(
    /(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\s+(.+?)\s+(?:R\$\s*)?(-?\d{1,3}(?:[.\s]\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2})$/,
  );
  const monthNameDate = line.match(
    /(\d{1,2})\s+(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\.?\s+(.+?)\s+(?:R\$\s*)?(-?\d{1,3}(?:[.\s]\d{3})*,\d{2}|-?\d+,\d{2}|-?\d+\.\d{2})$/i,
  );

  const amount = parseMoney(numericDate?.[3] ?? monthNameDate?.[4] ?? "");
  if (!amount) return null;

  const occurredOn = numericDate?.[1]
    ? parseDate(numericDate[1], fallbackYear)
    : monthNameDate?.[1] && monthNameDate[2]
      ? dateFromMonthName(monthNameDate[1], monthNameDate[2], fallbackYear)
      : null;

  if (!occurredOn) return null;

  const rawDescription = numericDate?.[2] ?? monthNameDate?.[3] ?? "";
  const description = cleanDescription(rawDescription);
  if (description.length < 2 || shouldIgnoreLine(description)) return null;

  const installment = parseInstallment(description);
  return {
    id: `${sourceName}-${index}-${description}`,
    occurred_on: occurredOn,
    description,
    amount: Math.abs(amount).toFixed(2),
    transaction_type: amount > 0 ? "expense" : "expense",
    category: normalizeCategory("", description),
    payment_method: normalizePayment("", sourceName),
    installments_total: String(installment.total),
    installment_number: String(installment.current),
    is_fixed: false,
    is_recurring: false,
    notes: `Importado de ${sourceName}. Conferir antes de salvar.`,
    source: sourceName,
    confidence: installment.total > 1 ? 82 : 76,
    selected: true,
    duplicate: false,
  };
}

function parseDelimited(text: string) {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const delimiter = [";", ",", "\t"].sort((a, b) => count(firstLine, b) - count(firstLine, a))[0] ?? ";";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((item) => item.some((cellValue) => cellValue.trim()));
}

function parseMoney(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalSeparator = lastComma > lastDot ? "," : ".";
  const normalized = cleaned
    .replace(new RegExp(`\\${decimalSeparator === "," ? "." : ","}`, "g"), "")
    .replace(decimalSeparator, ".");
  return Number(normalized);
}

function parseDate(value: string, fallbackYear = new Date().getFullYear()) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3] ? normalizeYear(match[3]) : fallbackYear;
  if (!day || !month || month > 12) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateFromMonthName(day: string, monthName: string, year: number) {
  const months: Record<string, number> = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
  const month = months[normalizeHeader(monthName).slice(0, 3)];
  if (!month) return "";
  return `${year}-${String(month).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`;
}

function extractYear(text: string) {
  const match = text.match(/20\d{2}/);
  return match ? Number(match[0]) : new Date().getFullYear();
}

function parseInstallment(description: string, currentValue = "", totalValue = "") {
  const explicitCurrent = Number(currentValue) || 0;
  const explicitTotal = Number(totalValue) || 0;
  const match =
    description.match(/(?:^|\D)(\d{1,2})\s*\/\s*(\d{1,2})(?:\D|$)/) ??
    description.match(/parcela\s*(\d{1,2})\s*(?:de|\/)\s*(\d{1,2})/i);

  return {
    current: explicitCurrent || Number(match?.[1]) || 1,
    total: explicitTotal || Number(match?.[2]) || 1,
  };
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeKey(value: string) {
  return normalizeHeader(value).replace(/[^a-z0-9]/g, "");
}

function cleanDescription(value: string) {
  return value.replace(/\s+/g, " ").replace(/\s+-\s+$/, "").trim();
}

function normalizeType(value: string): TransactionType | null {
  const normalized = normalizeHeader(value);
  if (["expense", "despesa", "saida", "saidas"].includes(normalized)) return "expense";
  if (["income", "receita", "entrada", "entradas"].includes(normalized)) return "income";
  if (["investment", "investimento", "investimentos"].includes(normalized)) return "investment";
  if (["transfer", "transferencia"].includes(normalized)) return "transfer";
  return null;
}

function normalizePayment(value: string, sourceName: string) {
  const source = normalizeHeader(`${value} ${sourceName}`);
  if (source.includes("credito") || source.includes("nubank") || source.includes("cartao")) return "Crédito";
  if (source.includes("debito")) return "Débito";
  if (source.includes("boleto")) return "Boleto";
  if (source.includes("dinheiro")) return "Dinheiro";
  if (source.includes("transfer")) return "Transferência";
  if (source.includes("pix")) return "Pix";
  return paymentMethods[0] ?? "Pix";
}

function normalizeCategory(value: string, description: string) {
  const explicit = categories.find((category) => normalizeHeader(category) === normalizeHeader(value));
  if (explicit) return explicit;

  const text = normalizeHeader(description);
  if (/(mercado|supermercado|atacadao|assai|carrefour|ifood|restaurante|padaria|hortifruti|acougue)/.test(text)) return "Mercado";
  if (/(uber|99|combustivel|posto|estacionamento|metro|onibus)/.test(text)) return "Transporte";
  if (/(farmacia|drogaria|medico|consulta|exame|saude)/.test(text)) return "Saúde";
  if (/(netflix|spotify|prime|assinatura|icloud|google|apple)/.test(text)) return "Assinaturas";
  if (/(cinema|show|lazer|bar|jogo)/.test(text)) return "Lazer";
  if (/(salario|pix recebido|rendimento)/.test(text)) return "Receita";
  return categories.includes("Cartão") ? "Cartão" : "Outros";
}

function parseBoolean(value: string) {
  return ["sim", "s", "true", "1", "yes"].includes(normalizeHeader(value));
}

function shouldIgnoreLine(value: string) {
  return /total|pagamento recebido|limite disponivel|vencimento|fatura|subtotal/i.test(value);
}

function normalizeYear(value: string) {
  const year = Number(value);
  return year < 100 ? 2000 + year : year;
}

function count(value: string, search: string) {
  return value.split(search).length - 1;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
