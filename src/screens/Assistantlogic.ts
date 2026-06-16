import type { FixedExpense } from '../types';

export interface AssistantMessage {
  text: string;
  emoji: string;
  type: 'warning' | 'suggestion' | 'celebration' | 'neutral';
  priority: number;
}

export function generateAssistantMessage(
  wantsBudget: number,
  wantsSpent: number,
  needsBudget: number,
  emergencyFundGoal: number,
  emergencyFund: number,
  fixedExpenses: FixedExpense[],
  paidBills: { id: string; title: string; amount: number }[],
  today: Date,
  recentActivityCount: number = 0
): AssistantMessage {
  const messages: AssistantMessage[] = [];
  const wantsPercent = wantsBudget > 0 ? (wantsSpent / wantsBudget) * 100 : 0;
  const efPercent    = emergencyFundGoal > 0 ? (emergencyFund / emergencyFundGoal) * 100 : 0;
  const unpaidBills  = fixedExpenses.filter(e => !paidBills.some(p => p.id === e.id));

  // CELEBRACIONES

  if (efPercent >= 100) {
    messages.push({
      text: 'Tu fondo de emergencia esta completo. Eso es independencia financiera de verdad.',
      emoji: '',
      type: 'celebration',
      priority: 95,
    });
  }

  const totalBills = fixedExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalPaid  = paidBills.reduce((a, p) => a + p.amount, 0);
  if (totalBills > 0 && totalPaid >= totalBills * 0.9) {
    messages.push({
      text: 'Ya cubriste casi todos tus gastos fijos del mes. Muy bien.',
      emoji: '',
      type: 'celebration',
      priority: 85,
    });
  }

  if (wantsPercent > 0 && wantsPercent < 40) {
    messages.push({
      text: `Llevas solo el ${Math.round(wantsPercent)}% de tus gustos. Tienes espacio para darte algo sin preocuparte.`,
      emoji: '',
      type: 'celebration',
      priority: 50,
    });
  }

  // SUGERENCIAS

  for (const bill of unpaidBills) {
    if (needsBudget >= bill.amount) {
      messages.push({
        text: `Tienes los $${bill.amount.toLocaleString('es-MX')} para ${bill.title}. Puedes marcarlo como pagado cuando lo hagas.`,
        emoji: '',
        type: 'suggestion',
        priority: 70,
      });
      break;
    }
  }

  const nextPayment = unpaidBills
    .filter(e => e.day !== null)
    .sort((a, b) => (a.day || 31) - (b.day || 31))[0];

  if (nextPayment?.day) {
    const daysLeft = nextPayment.day > today.getDate()
      ? nextPayment.day - today.getDate()
      : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + nextPayment.day;

    if (daysLeft > 0 && daysLeft <= 3) {
      messages.push({
        text: daysLeft === 1
          ? `Manana vence ${nextPayment.title}. Ya tienes tiempo de prepararlo.`
          : `${nextPayment.title} vence en ${daysLeft} dias.`,
        emoji: '',
        type: 'warning',
        priority: 80,
      });
    }
  }

  if (wantsPercent >= 80 && wantsPercent < 100) {
    messages.push({
      text: `Llevas el ${Math.round(wantsPercent)}% de tu presupuesto de gustos este mes.`,
      emoji: '',
      type: 'warning',
      priority: 65,
    });
  }

  if (wantsPercent >= 100) {
    messages.push({
      text: 'Agotaste el presupuesto de gustos por este mes. El proximo mes se renueva.',
      emoji: '',
      type: 'warning',
      priority: 72,
    });
  }

  if (efPercent > 0 && efPercent < 30) {
    messages.push({
      text: `Tu fondo de emergencia esta al ${Math.round(efPercent)}%. No hay prisa, solo sigue sumando.`,
      emoji: '',
      type: 'suggestion',
      priority: 55,
    });
  }

  if (recentActivityCount === 0) {
    messages.push({
      text: 'Puedes registrar lo que gastas aqui cuando quieras.',
      emoji: '',
      type: 'suggestion',
      priority: 40,
    });
  }

  // NEUTROS
  if (messages.length === 0) {
    const neutral = [
      { text: 'Todo en orden por aqui. Cada peso que registras te da mas claridad.', priority: 10 },
      { text: 'Llevar tus finanzas no tiene que ser complicado. Ya lo estas haciendo.', priority: 12 },
      { text: 'Tu fondo de emergencia es tu respaldo. Sigue construyendolo a tu ritmo.', priority: 11 },
      { text: 'Cada mes que registras tus gastos es un mes que tienes el control.', priority: 13 },
      { text: 'El 50/30/20 es solo una guia. Adaptalo a lo que funciona para ti.', priority: 10 },
    ];
    const pick = neutral[Math.floor(Math.random() * neutral.length)];
    messages.push({ text: pick.text, emoji: '', type: 'neutral', priority: pick.priority });
  }

  return messages.sort((a, b) => b.priority - a.priority)[0];
}
