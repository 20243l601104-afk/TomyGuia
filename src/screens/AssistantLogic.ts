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

  // ═══ CELEBRACIONES (prioridad alta — siempre positivo) ═══

  // Fondo de emergencia completo
  if (efPercent >= 100) {
    messages.push({
      text: '¡Lo lograste! Tu fondo de emergencia está completo. Eso es independencia financiera real 🏆',
      emoji: '🏆',
      type: 'celebration',
      priority: 95,
    });
  }

  // Pagó casi todos los recibos del mes
  const totalBills = fixedExpenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalPaid  = paidBills.reduce((a, p) => a + p.amount, 0);
  if (totalBills > 0 && totalPaid >= totalBills * 0.9) {
    messages.push({
      text: '¡Qué organizada! Ya cubriste casi todos tus gastos fijos del mes. Sigue así 🌸',
      emoji: '🎉',
      type: 'celebration',
      priority: 85,
    });
  }

  // Va muy bien con los gustos
  if (wantsPercent > 0 && wantsPercent < 40) {
    messages.push({
      text: `¡Vas muy bien! Solo llevas el ${Math.round(wantsPercent)}% de tus gustos. Tienes espacio para darte un gusto sin culpa 💛`,
      emoji: '⭐',
      type: 'celebration',
      priority: 50,
    });
  }

  // ═══ SUGERENCIAS AMABLES ═══

  // Tiene dinero para pagar un recibo
  for (const bill of unpaidBills) {
    if (needsBudget >= bill.amount) {
      messages.push({
        text: `Tienes listos los $${bill.amount.toLocaleString('es-MX')} para ${bill.title}. ¿Lo pagamos hoy? 💳`,
        emoji: '💳',
        type: 'suggestion',
        priority: 70,
      });
      break;
    }
  }

  // Pago próximo en menos de 3 días — tono de recordatorio amable
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
          ? `Mañana vence ${nextPayment.title}. ¡Ya casi! Solo un recordatorio 🌼`
          : `${nextPayment.title} vence en ${daysLeft} días. Vas con tiempo, ¡tú puedes! 🌼`,
        emoji: '🌼',
        type: 'warning',
        priority: 80,
      });
    }
  }

  // Gustos al 80%+ — suave, sin regaño
  if (wantsPercent >= 80 && wantsPercent < 100) {
    messages.push({
      text: `Llevas el ${Math.round(wantsPercent)}% de tus gustos este mes. Queda poquito — ¡tú decides cómo usarlo! 💛`,
      emoji: '💛',
      type: 'warning',
      priority: 65,
    });
  }

  // Gustos agotados — comprensivo, no dramático
  if (wantsPercent >= 100) {
    messages.push({
      text: 'Ya cubriste todos tus gustos del mes. ¡Buen trabajo! El próximo mes vuelve a tener presupuesto 🌸',
      emoji: '🌸',
      type: 'warning',
      priority: 72,
    });
  }

  // Fondo de emergencia bajo — motivador
  if (efPercent > 0 && efPercent < 30) {
    messages.push({
      text: `Tu fondo de emergencia va al ${Math.round(efPercent)}%. Cada peso que agregas cuenta — ¡sin prisa pero sin pausa! 💚`,
      emoji: '🛡️',
      type: 'suggestion',
      priority: 55,
    });
  }

  // Sin actividad reciente — invitación, no recordatorio de obligación
  if (recentActivityCount === 0) {
    messages.push({
      text: '¿Cómo vas hoy? Puedes registrar tus gastos aquí cuando quieras 📝',
      emoji: '📝',
      type: 'suggestion',
      priority: 40,
    });
  }

  // ═══ MENSAJES NEUTROS / MOTIVADORES (fallback) ═══
  if (messages.length === 0) {
    const neutral = [
      { text: '¡Hola! Todo va bien por aquí. Recuerda que cada pequeño ahorro suma 🌱', emoji: '🌱', priority: 10 },
      { text: 'Registrar tus gastos es un acto de amor propio. ¡Tú puedes! 💪', emoji: '💪', priority: 12 },
      { text: 'Tu fondo de emergencia es tu red de seguridad. Sigue construyéndola 💚', emoji: '💚', priority: 11 },
      { text: 'Cada mes que llevas tus finanzas en orden es un logro. ¡Orgullosa de ti! 🌸', emoji: '🌸', priority: 13 },
      { text: '¿Sabías que el 50/30/20 es solo una guía? Adáptala a tu vida 💡', emoji: '💡', priority: 10 },
    ];
    const pick = neutral[Math.floor(Math.random() * neutral.length)];
    messages.push({ text: pick.text, emoji: pick.emoji, type: 'neutral', priority: pick.priority });
  }

  return messages.sort((a, b) => b.priority - a.priority)[0];
}
