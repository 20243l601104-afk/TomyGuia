import { BELVO_CONFIG } from '../constants/belvoConfig';

const BASE_URL = BELVO_CONFIG.sandboxUrl;
const AUTH = btoa(`${BELVO_CONFIG.secretId}:${BELVO_CONFIG.secretPassword}`);

const headers = {
  'Authorization': `Basic ${AUTH}`,
  'Content-Type': 'application/json',
};

// Obtener cuentas bancarias del link
export async function getBelvoAccounts(linkId: string) {
  const res = await fetch(`${BASE_URL}/api/accounts/?link=${linkId}`, { headers });
  if (!res.ok) throw new Error('Error obteniendo cuentas');
  const data = await res.json();
  return data.results;
}

// Obtener transacciones del mes actual
export async function getBelvoTransactions(linkId: string) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];

  const res = await fetch(
    `${BASE_URL}/api/transactions/?link=${linkId}&date_from=${firstDay}&date_to=${today}`,
    { headers }
  );
  if (!res.ok) throw new Error('Error obteniendo transacciones');
  const data = await res.json();
  return data.results;
}

// Convertir transacciones de Belvo al formato de Expense de la app
export function mapBelvoToExpenses(transactions: any[]): {
  label: string;
  amount: number;
  category: 'needs' | 'wants';
}[] {
  return transactions
    .filter(t => t.type === 'OUTFLOW' && t.amount > 0)
    .map(t => {
      const label = t.merchant?.name || t.description || 'Gasto bancario';
      const category = classifyExpense(label, t.category);
      return {
        label,
        amount: Math.abs(t.amount),
        category,
      };
    });
}

// Clasificar automáticamente el gasto como need o want
function classifyExpense(label: string, belvoCategory: string): 'needs' | 'wants' {
  const labelLower = label.toLowerCase();
  const catLower = (belvoCategory || '').toLowerCase();

  const needs = [
    'supermercado', 'super', 'walmart', 'chedraui', 'soriana', 'costco',
    'farmacia', 'hospital', 'médico', 'doctor', 'salud',
    'luz', 'agua', 'gas', 'telmex', 'telcel', 'internet', 'renta',
    'gasolina', 'transporte', 'uber', 'camion', 'metro',
    'groceries', 'utilities', 'health', 'transport',
  ];

  const wants = [
    'restaurante', 'cafe', 'café', 'starbucks', 'oxxo', 'seven',
    'netflix', 'spotify', 'amazon', 'mercado libre', 'ropa', 'tienda',
    'cine', 'entretenimiento', 'bar', 'antro',
    'entertainment', 'shopping', 'food_and_drink',
  ];

  for (const w of wants) {
    if (labelLower.includes(w) || catLower.includes(w)) return 'wants';
  }
  for (const n of needs) {
    if (labelLower.includes(n) || catLower.includes(n)) return 'needs';
  }

  return 'wants'; // default
}
