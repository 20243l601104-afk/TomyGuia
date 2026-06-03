import type { FixedExpense, Expense } from '../types';

export interface AssistantMessage {
  text: string;
  emoji: string;
  type: 'warning' | 'alert' | 'suggestion' | 'celebration' | 'neutral' | 'sad';
  priority: number; // 0-100, mayor = más importante
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
  recentActivityCount: number = 0,
  expenses: Expense[] = [],           // todos los gastos del mes
): AssistantMessage {

  const messages: AssistantMessage[] = [];
  const wantsPercent = wantsBudget > 0 ? (wantsSpent / wantsBudget) * 100 : 0;
  const efPercent    = emergencyFundGoal > 0 ? (emergencyFund / emergencyFundGoal) * 100 : 0;

  // ═══════════════════════════════════════════════
  // 🚨 ALERTAS CRÍTICAS (prioridad 90-100)
  // ═══════════════════════════════════════════════

  // Presupuesto de gustos completamente agotado
  if (wantsPercent >= 100) {
    messages.push({
      text: `¡Ya gastaste todo tu presupuesto de gustos este mes! Intenta no gastar más hasta el próximo 🛑`,
      emoji: '🛑',
      type: 'alert',
      priority: 100,
    });
  }

  // Pago que vence HOY
  const unpaidToday = fixedExpenses.filter(e =>
    !paidBills.some(p => p.id === e.id) && e.day === today.getDate()
  );
  if (unpaidToday.length > 0) {
    messages.push({
      text: `¡Hoy vence ${unpaidToday[0].title}! No dejes pasar el día sin pagarlo 🔔`,
      emoji: '🔔',
      type: 'alert',
      priority: 98,
    });
  }

  // Pago vencido (día ya pasó este mes y no está pagado)
  const overdue = fixedExpenses.filter(e =>
    !paidBills.some(p => p.id === e.id) &&
    e.day !== null && e.day < today.getDate()
  );
  if (overdue.length > 0) {
    messages.push({
      text: `Tienes ${overdue.length} pago${overdue.length > 1 ? 's' : ''} vencido${overdue.length > 1 ? 's' : ''}: ${overdue[0].title}. ¡Revísalo cuanto antes! ⚠️`,
      emoji: '⚠️',
      type: 'alert',
      priority: 97,
    });
  }

  // Saldo de necesidades muy bajo para cubrir facturas pendientes
  const unpaidBillsTotal = fixedExpenses
    .filter(e => !paidBills.some(p => p.id === e.id))
    .reduce((a, e) => a + e.amount, 0);
  if (unpaidBillsTotal > 0 && needsBudget < unpaidBillsTotal * 0.5) {
    messages.push({
      text: `Tu saldo de necesidades está muy bajo para cubrir tus facturas pendientes ($${unpaidBillsTotal.toLocaleString('es-MX')}). Ten cuidado 😰`,
      emoji: '😰',
      type: 'alert',
      priority: 93,
    });
  }

  // ═══════════════════════════════════════════════
  // ⚠️ ADVERTENCIAS (prioridad 70-89)
  // ═══════════════════════════════════════════════

  // Pago próximo en menos de 3 días
  const nextPayment = fixedExpenses
    .filter(e => !paidBills.some(p => p.id === e.id) && e.day !== null)
    .sort((a, b) => (a.day || 31) - (b.day || 31))[0];

  if (nextPayment?.day) {
    const daysLeft = nextPayment.day > today.getDate()
      ? nextPayment.day - today.getDate()
      : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + nextPayment.day;

    if (daysLeft > 0 && daysLeft <= 3) {
      messages.push({
        text: `${nextPayment.title} vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}. Asegúrate de tener el dinero listo 💳`,
        emoji: '⏰',
        type: 'warning',
        priority: 88,
      });
    }
  }

  // Gustos al 80-99%
  if (wantsPercent >= 80 && wantsPercent < 100) {
    messages.push({
      text: `Llevas el ${Math.round(wantsPercent)}% de tu presupuesto de gustos. Ya casi lo agotás, ve con calma 💛`,
      emoji: '⚠️',
      type: 'warning',
      priority: 78,
    });
  }

  // ═══════════════════════════════════════════════
  // 📊 DETECCIÓN DE GASTOS POR CATEGORÍA
  // ═══════════════════════════════════════════════

  if (expenses.length > 0) {

    // Agrupar gastos de "wants" por etiqueta
    const wantsExpenses = expenses.filter(e => e.category === 'wants');
    const byLabel: Record<string, number> = {};
    for (const e of wantsExpenses) {
      const key = e.label.toLowerCase();
      byLabel[key] = (byLabel[key] || 0) + e.amount;
    }

    // Detectar si alguna categoría supera el 30% del presupuesto de gustos
    for (const [label, total] of Object.entries(byLabel)) {
      const pct = wantsBudget > 0 ? (total / wantsBudget) * 100 : 0;
      if (pct >= 30) {
        messages.push({
          text: `Llevas $${total.toLocaleString('es-MX')} en "${label}" este mes. Eso es el ${Math.round(pct)}% de tus gustos 👀`,
          emoji: '👀',
          type: 'warning',
          priority: 72,
        });
        break; // Solo avisar de la categoría más alta
      }
    }

    // Muchos gastos pequeños (más de 10 gastos de wants en el mes)
    if (wantsExpenses.length > 10) {
      messages.push({
        text: `Tienes ${wantsExpenses.length} gastos de gustos este mes. Los gastos pequeños se acumulan más de lo que crees 🧾`,
        emoji: '🧾',
        type: 'suggestion',
        priority: 55,
      });
    }

    // Día con gasto inusualmente alto (un solo gasto > 20% del presupuesto de gustos)
    const bigExpense = wantsExpenses.find(e => wantsBudget > 0 && (e.amount / wantsBudget) * 100 > 20);
    if (bigExpense) {
      messages.push({
        text: `Registré un gasto grande en "${bigExpense.label}": $${bigExpense.amount.toLocaleString('es-MX')}. ¿Fue planeado? 🤔`,
        emoji: '🤔',
        type: 'suggestion',
        priority: 65,
      });
    }
  }

  // ═══════════════════════════════════════════════
  // 💡 SUGERENCIAS (prioridad 40-69)
  // ═══════════════════════════════════════════════

  // Tienes saldo para pagar un recibo
  const payableBill = fixedExpenses
    .filter(e => !paidBills.some(p => p.id === e.id) && needsBudget >= e.amount)
    [0];
  if (payableBill) {
    messages.push({
      text: `Ya tienes para cubrir ${payableBill.title} ($${payableBill.amount.toLocaleString('es-MX')}). ¿Lo pagamos hoy? 💳`,
      emoji: '💳',
      type: 'suggestion',
      priority: 68,
    });
  }

  // Fondo de emergencia bajo
  if (efPercent > 0 && efPercent < 30) {
    messages.push({
      text: `Tu fondo de emergencia va al ${Math.round(efPercent)}% de la meta. Intenta guardar un poco más este mes 💚`,
      emoji: '🛡️',
      type: 'suggestion',
      priority: 60,
    });
  }

  // Vas bien con los gustos (menos del 40%)
  if (wantsPercent > 0 && wantsPercent < 40) {
    messages.push({
      text: `¡Vas muy bien! Solo llevas el ${Math.round(wantsPercent)}% de tus gustos. ¡Sigue así! ⭐`,
      emoji: '⭐',
      type: 'suggestion',
      priority: 50,
    });
  }

  // Sin actividad reciente
  if (recentActivityCount === 0) {
    messages.push({
      text: `No olvides registrar tus gastos de hoy. Así mantenemos el control juntas 📝`,
      emoji: '📝',
      type: 'suggestion',
      priority: 42,
    });
  }

  // ═══════════════════════════════════════════════
  // 🎉 CELEBRACIONES (prioridad 80-95)
  // ═══════════════════════════════════════════════

  // Fondo de emergencia completo
  if (efPercent >= 100) {
    messages.push({
      text: `¡Increíble! Completaste tu fondo de emergencia. ¡Eres una campeona del ahorro! 🏆`,
      emoji: '🏆',
      type: 'celebration',
      priority: 95,
    });
  }

  // Pagó todos los gastos fijos del mes
  const totalBills = fixedExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalPaid  = paidBills.reduce((a, p) => a + p.amount, 0);
  if (totalBills > 0 && totalPaid >= totalBills * 0.9) {
    messages.push({
      text: `¡Wow! Ya cubriste casi todos tus gastos fijos del mes. ¡Así se hace! 🎉`,
      emoji: '🎉',
      type: 'celebration',
      priority: 85,
    });
  }

  // ═══════════════════════════════════════════════
  // 😴 NEUTROS / FALLBACK
  // ═══════════════════════════════════════════════

  if (messages.length === 0) {
    const neutral = [
      { text: `¡Hola! Todo parece estar en orden por aquí. Sigue así 😊`, emoji: '😊', priority: 10 },
      { text: `Recuerda revisar tus gastos cada día para no perder el control 💡`, emoji: '💡', priority: 12 },
      { text: `Tu fondo de emergencia es tu mejor aliada. ¡No pares de ahorrar! 💚`, emoji: '💚', priority: 14 },
      { text: `Cada peso que ahorras hoy es una preocupación menos mañana 🌸`, emoji: '🌸', priority: 11 },
    ];
    const pick = neutral[Math.floor(Math.random() * neutral.length)];
    messages.push({ text: pick.text, emoji: pick.emoji, type: 'neutral', priority: pick.priority });
  }

  // Retornar el mensaje con mayor prioridad
  return messages.sort((a, b) => b.priority - a.priority)[0];
}
