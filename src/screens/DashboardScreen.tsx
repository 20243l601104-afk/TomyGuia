import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarWidget } from '../components/CalendarWidget';
import { BottomChat } from '../components/BottomChat';
import { BankConnectModal } from '../components/BankConnectModal';
import { TomasaSVG } from '../components/TomasaSVG';
import { FloatingAssistant } from '../components/FloatingAssistant';
import type { FixedExpenseSeed, FixedExpense, Expense, ConnectedBank, BankTransaction, UserProfile } from '../types';

interface Props {
  emergencyFundGoal: number;
  totalBalance: number;
  seedExpenses: FixedExpenseSeed[];
  monthlyIncome: number;
  profile: UserProfile;
  onProfilePress: () => void;
  onAddFlowers: (amount: number, achievementId?: string) => void;
}

export function DashboardScreen({ emergencyFundGoal, totalBalance, seedExpenses, monthlyIncome, profile, onProfilePress, onAddFlowers }: Props) {
  const ins = useSafeAreaInsets();

  /* ─── Distribución 50/30/20 del balance inicial ─── */
  const initial50 = Math.round(totalBalance * 0.5);
  const initial30 = Math.round(totalBalance * 0.3);
  const initial20 = totalBalance - initial50 - initial30;

  const [needsBudget, setNeedsBudget] = useState(initial50);
  const [wantsBudget, setWantsBudget] = useState(initial30);
  const [ef, setEf] = useState(initial20);

  const totalBal = needsBudget + wantsBudget + ef;

  /* ─── Fondo de emergencia ─── */
  const ep = emergencyFundGoal > 0 ? Math.min((ef / emergencyFundGoal) * 100, 100) : 0;
  const me = emergencyFundGoal > 0 ? emergencyFundGoal / 3 : 0;
  const mp = me > 0 ? (ef / me).toFixed(1) : '0';

  /* ─── Logros del fondo de emergencia (fuera del render para evitar el error) ─── */
  useEffect(() => {
    if (emergencyFundGoal <= 0) return;
    const pct = (ef / emergencyFundGoal) * 100;
    if (pct >= 10) onAddFlowers(10, 'emergency_10');
    if (pct >= 50) onAddFlowers(20, 'emergency_50');
    if (pct >= 100) onAddFlowers(50, 'emergency_100');
  }, [ef]);

  /* ─── Dinero libre para hoy (30% gustos) ─── */
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - today.getDate() + 1);
  const dailyFree = Math.max(0, Math.floor(wantsBudget / remainingDays));
  const weeklyFree = Math.max(0, Math.round(wantsBudget / Math.ceil(remainingDays / 7)));
  const tl = today.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });

  /* ─── Calendario de necesidades ─── */
  const [ne, setNe] = useState(false);
  const seedTotal = seedExpenses.reduce((a: number, e: any) => a + e.amount, 0);
  const [nt, setNt] = useState({ paid: 0, total: seedTotal });
  const [fel, setFel] = useState<FixedExpense[]>([]);
  const onTot = useCallback((t: { paid: number; total: number }) => setNt(t), []);
  const onExp = useCallback((l: FixedExpense[]) => setFel(l), []);
  const ft = nt.total > 0 ? nt.total : me;
  const remainingBills = Math.max(0, ft - nt.paid);
  const np = remainingBills > 0 ? Math.min((needsBudget / remainingBills) * 100, 100) : 100;

  /* ─── Gastos ─── */
  const [exps, setExps] = useState<Expense[]>([]);
  const [paidBills, setPaidBills] = useState<{ id: string; title: string; amount: number }[]>([]);

  /* ─── Banco ─── */
  const [bmo, setBmo] = useState(false);
  const [cb, setCb] = useState<ConnectedBank | null>(null);
  const onBC = useCallback((bank: ConnectedBank, txs: BankTransaction[]) => {
    setCb(bank);
    setExps(p => [...p, ...txs]);
    const im = txs.reduce((a, b) => a + b.amount, 0);
    setWantsBudget(p => Math.max(0, p - im));
  }, []);

  /* ─── Gasto desde el chat ─── */
  const firstExpenseTracked = useRef(false);
  const onEA = (amt: number, cat: 'needs' | 'wants', lbl: string) => {
    setExps(p => [...p, { id: Date.now(), amount: amt, category: cat, label: lbl, source: 'chat' }]);
    if (cat === 'needs') {
      setNeedsBudget(p => Math.max(0, p - amt));
    } else {
      setWantsBudget(p => Math.max(0, p - amt));
    }
    if (!firstExpenseTracked.current) {
      firstExpenseTracked.current = true;
      onAddFlowers(3, 'first_expense');
    }
  };

  /* ─── Ingreso nuevo ─── */
  const firstIncomeTracked = useRef(false);
  const onIA = (amt: number, al: { needs: number; wants: number; savings: number }) => {
    setNeedsBudget(p => p + al.needs);
    setWantsBudget(p => p + al.wants);
    setEf(p => p + al.savings);
    if (!firstIncomeTracked.current) {
      firstIncomeTracked.current = true;
      onAddFlowers(3, 'first_income');
    }
  };

  /* ─── Pago de recibo fijo desde el chat ─── */
  const onBillPaid = (expenseId: string, title: string, amount: number) => {
    setNeedsBudget(p => Math.max(0, p - amount));
    setNt(p => ({ ...p, paid: p.paid + amount }));
    setPaidBills(p => [...p, { id: expenseId, title, amount }]);
  };

  const fr = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 60000);
    if (d < 1) return 'ahora';
    if (d < 60) return `hace ${d} min`;
    const h = Math.floor(d / 60);
    if (h < 24) return `hace ${h} h`;
    return `hace ${Math.floor(h / 24)} d`;
  };

  return (
    <View style={[s.con, { paddingTop: ins.top }]}>
      <View style={[s.bl, s.b1]} /><View style={[s.bl, s.b2]} />

      {/* Header */}
      <View style={s.hd}>
        <View><Text style={s.gr}>¡Hola{profile.name ? `, ${profile.name}` : ''}!</Text><Text style={s.sg}>Lista para crecer</Text></View>
        <TouchableOpacity style={s.av} onPress={onProfilePress} activeOpacity={0.7}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={s.ai} />
          ) : (
            <View style={s.incognito}><TomasaSVG size={32} floating={false} /></View>
          )}
          <View style={s.flowerBadge}><Text style={s.flowerBadgeTxt}>🌼{profile.flowers}</Text></View>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.sc} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* ═══ 1. NECESIDADES (Rosa #F4ACB7) — 50% ═══ */}
        <View style={s.cardNec}>
          <View style={s.cardHead}>
            <View style={s.nt2}><Ionicons name="receipt-outline" size={16} color="#F4ACB7" /><Text style={s.ntx}>Necesidades</Text></View>
            <View style={[s.tg, { backgroundColor: '#F4ACB7' }]}><Text style={s.tt}>{np.toFixed(0)}% cubierto</Text></View>
          </View>
          <View style={s.na}><Text style={[s.nab, { color: '#F4ACB7' }]}>${needsBudget.toLocaleString('es-MX')}</Text><Text style={s.nas}>/ ${remainingBills.toLocaleString('es-MX')} por pagar</Text></View>
          <View style={s.pt}><View style={[s.pf, { width: `${np}%` as any, backgroundColor: '#F4ACB7' }]} /></View>
          {paidBills.length > 0 && (
            <View style={{ marginTop: 8, gap: 4 }}>
              {paidBills.map((b, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(133,168,158,0.1)', borderRadius: 10, padding: 8, gap: 8 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#85A89E" />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#9D8189' }}>{b.title}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#F4ACB7' }}>-${b.amount.toLocaleString('es-MX')}</Text>
                </View>
              ))}
            </View>
          )}
          {exps.filter(e => e.category === 'needs').length > 0 && (
            <View style={{ marginTop: 4, gap: 4 }}>
              {exps.filter(e => e.category === 'needs').map(e => (
                <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(244,172,183,0.08)', borderRadius: 10, padding: 8, gap: 8 }}>
                  <Ionicons name="cart-outline" size={14} color="#F4ACB7" />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#9D8189' }}>{e.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#F4ACB7' }}>-${e.amount.toLocaleString('es-MX')}</Text>
                </View>
              ))}
            </View>
          )}
          <TouchableOpacity style={s.ct} onPress={() => setNe(!ne)}>
            <Ionicons name="calendar-outline" size={14} color="#F4ACB7" />
            <Text style={s.ctt}>Ver calendario de pagos</Text>
            <Ionicons name={ne ? 'chevron-up' : 'chevron-down'} size={16} color="#F4ACB7" />
          </TouchableOpacity>
          {ne && <View style={{ marginTop: 16 }}><CalendarWidget seedExpenses={seedExpenses} onTotalsChange={onTot} onExpensesChange={onExp} /></View>}
        </View>

        {/* ═══ 2. GUSTOS / DINERO LIBRE (Amarillo #F3C57C) — 30% ═══ */}
        <View style={s.cardGus}>
          <View style={s.cardHead}>
            <View style={s.nt2}><Ionicons name="sunny-outline" size={16} color="#F3C57C" /><Text style={[s.ntx, { color: '#B58A3A' }]}>Gustos · Dinero libre</Text></View>
            <View style={[s.tg, { backgroundColor: '#F3C57C' }]}><Text style={s.tt}>30% gustos</Text></View>
          </View>
          <View style={s.bc}><Text style={[s.bcu, { color: '#F3C57C' }]}>$</Text><Text style={[s.bam, { color: '#F3C57C' }]}>{dailyFree.toLocaleString('es-MX')}</Text><Text style={s.bday}>/día</Text></View>
          <Text style={s.bs}>{tl} · ${weeklyFree.toLocaleString('es-MX')} semana</Text>
          <View style={s.balRow}><Text style={s.balLabel}>Cajón gustos:</Text><Text style={[s.balValue, { color: '#B58A3A' }]}>${wantsBudget.toLocaleString('es-MX')}</Text></View>
          {exps.filter(e => e.category === 'wants').length > 0 && (
            <View style={{ marginTop: 4, gap: 4 }}>
              {exps.filter(e => e.category === 'wants').map(e => (
                <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(243,197,124,0.1)', borderRadius: 10, padding: 8, gap: 8 }}>
                  <Ionicons name="cafe-outline" size={14} color="#F3C57C" />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#9D8189' }}>{e.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#B58A3A' }}>-${e.amount.toLocaleString('es-MX')}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ─── Conectar banco ─── */}
        {!cb ? (
          <TouchableOpacity style={s.bb} onPress={() => setBmo(true)} activeOpacity={0.8}>
            <View style={[s.ib, { backgroundColor: '#FFCAD440', marginRight: 12 }]}><Ionicons name="add" size={18} color="#F4ACB7" /></View>
            <View style={{ flex: 1 }}><Text style={s.bnt}>Conectar cuenta bancaria</Text><Text style={s.bst}>Registra y categoriza automáticamente</Text></View>
            <Ionicons name="business-outline" size={18} color="#F4ACB7AA" />
          </TouchableOpacity>
        ) : (
          <View style={[s.bcc, { backgroundColor: cb.color }]}>
            <View style={s.bcr}><Ionicons name="business-outline" size={14} color="#fff" /><Text style={s.bcl}>Cuenta conectada</Text><TouchableOpacity onPress={() => setCb({ ...cb, connectedAt: Date.now() })} style={s.rs}><Ionicons name="refresh-outline" size={11} color="#fff" /><Text style={s.rt2}>Sincronizar</Text></TouchableOpacity></View>
            <Text style={s.bnn}>{cb.name}</Text><Text style={s.bl4}>•••• {cb.last4} · {fr(cb.connectedAt)}</Text>
          </View>
        )}

        {/* ═══ 3. FUTURO (Verde #85A89E) — 20% ═══ */}
        <View style={s.cardFut}>
          <View style={s.cardHead}>
            <View style={s.nt2}><Ionicons name="shield-checkmark-outline" size={16} color="#85A89E" /><Text style={[s.ntx, { color: '#5B776F' }]}>Futuro</Text></View>
            <View style={[s.tg, { backgroundColor: '#85A89E' }]}><Text style={s.tt}>{ep.toFixed(0)}% cubierto</Text></View>
          </View>
          <View style={s.na}><Text style={[s.nab, { color: '#5B776F' }]}>${ef.toLocaleString('es-MX')}</Text><Text style={s.nas}>/ ${emergencyFundGoal.toLocaleString('es-MX')} · 3 meses</Text></View>
          <View style={s.pt}><View style={[s.pf, { width: `${ep}%` as any, backgroundColor: '#85A89E' }]} /></View>
          <Text style={s.fp}>🛡️ {mp} meses de seguridad asegurados</Text>
        </View>

        {/* ─── Resumen 50/30/20 ─── */}
        <View style={s.summary}>
          <Text style={s.sumTitle}>DISTRIBUCIÓN 50/30/20</Text>
          <View style={s.sumBar}>
            <View style={[s.sumSeg, { flex: 50, backgroundColor: '#F4ACB7' }]} />
            <View style={[s.sumSeg, { flex: 30, backgroundColor: '#F3C57C' }]} />
            <View style={[s.sumSeg, { flex: 20, backgroundColor: '#85A89E' }]} />
          </View>
          <View style={s.sumRow}>
            <View style={s.sumItem}><View style={[s.sumDot, { backgroundColor: '#F4ACB7' }]} /><Text style={s.sumLabel}>Necesidades</Text><Text style={[s.sumVal, { color: '#F4ACB7' }]}>${needsBudget.toLocaleString('es-MX')}</Text></View>
            <View style={s.sumItem}><View style={[s.sumDot, { backgroundColor: '#F3C57C' }]} /><Text style={s.sumLabel}>Gustos</Text><Text style={[s.sumVal, { color: '#B58A3A' }]}>${wantsBudget.toLocaleString('es-MX')}</Text></View>
            <View style={s.sumItem}><View style={[s.sumDot, { backgroundColor: '#85A89E' }]} /><Text style={s.sumLabel}>Futuro</Text><Text style={[s.sumVal, { color: '#5B776F' }]}>${ef.toLocaleString('es-MX')}</Text></View>
          </View>
          <Text style={s.sumTotal}>Balance total: ${totalBal.toLocaleString('es-MX')}</Text>
        </View>
      </ScrollView>

      <View style={s.cbr}><BottomChat onIncomeAdded={onIA} onExpenseAdded={onEA} onBillPaid={onBillPaid} fixedExpenses={seedExpenses} currentNeeds={needsBudget} currentWants={wantsBudget} currentSavings={ef} totalBalance={totalBal} /></View>
<FloatingAssistant
        wantsBudget={wantsBudget}
        wantsSpent={exps.filter(e => e.category === 'wants').reduce((a, e) => a + e.amount, 0)}
        needsBudget={needsBudget}
        emergencyFundGoal={emergencyFundGoal}
        emergencyFund={ef}
        fixedExpenses={fel}
        paidBills={paidBills}
        recentActivityCount={exps.filter(e => Date.now() - e.id < 2 * 60 * 60 * 1000).length}
        expenses={exps}
      />     
 <BankConnectModal isOpen={bmo} onClose={() => setBmo(false)} onConnected={onBC} />
    </View>
  );
}

const s = StyleSheet.create({
  con: { flex: 1, backgroundColor: '#FFE5D9' },
  bl: { position: 'absolute', borderRadius: 999 },
  b1: { top: '-10%', right: '-10%', width: 256, height: 256, backgroundColor: '#F4ACB730' },
  b2: { bottom: '20%', left: '-20%', width: 320, height: 320, backgroundColor: '#D8E2DC40' },
  hd: { paddingTop: 12, paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  gr: { fontSize: 24, fontWeight: '800', color: '#F4ACB7' },
  sg: { fontSize: 13, color: '#9D8189', opacity: 0.8 },
  av: { width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)', backgroundColor: '#fff' },
  ai: { width: '100%', height: '100%', borderRadius: 26 },
  incognito: { width: '100%', height: '100%', borderRadius: 26, backgroundColor: '#FFCAD4', alignItems: 'center', justifyContent: 'center' },
  flowerBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 5, paddingVertical: 1, elevation: 4, borderWidth: 1, borderColor: '#F3C57C40' },
  flowerBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#E8963B' },
  sc: { flex: 1, paddingHorizontal: 24, paddingTop: 8, zIndex: 10 },
  // Tarjetas con colores por categoría
  cardNec: { backgroundColor: '#F4ACB710', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#F4ACB730' },
  cardGus: { backgroundColor: '#F3C57C10', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#F3C57C30' },
  cardFut: { backgroundColor: '#85A89E10', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#85A89E30' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nt2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ntx: { fontSize: 14, fontWeight: '700', color: '#9D8189' },
  tg: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  tt: { fontSize: 9, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  ib: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  // Dinero libre
  bc: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, marginBottom: 6 },
  bcu: { fontSize: 20, fontWeight: '500', opacity: 0.6, paddingBottom: 6 },
  bam: { fontSize: 52, fontWeight: '900' },
  bday: { fontSize: 14, fontWeight: '600', color: '#9D8189', opacity: 0.5, paddingBottom: 8 },
  bs: { fontSize: 11, color: '#9D8189', opacity: 0.6, textAlign: 'center', textTransform: 'capitalize', marginBottom: 8 },
  // Necesidades
  na: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
  nab: { fontSize: 24, fontWeight: '800' },
  nas: { fontSize: 12, fontWeight: '600', color: '#9D8189', opacity: 0.6 },
  pt: { height: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 99, overflow: 'hidden', marginBottom: 12 },
  pf: { height: '100%', borderRadius: 99 },
  balRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 8 },
  balLabel: { fontSize: 10, fontWeight: '600', color: '#9D8189', opacity: 0.7 },
  balValue: { fontSize: 12, fontWeight: '800' },
  ct: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  ctt: { flex: 1, fontSize: 12, fontWeight: '700', color: '#9D8189' },
  // Futuro
  fp: { fontSize: 11, color: '#74928A', opacity: 0.8, marginTop: 8 },
  // Banco
  bb: { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 16, borderWidth: 1.5, borderColor: '#F4ACB760', borderStyle: 'dashed' },
  bnt: { fontSize: 14, fontWeight: '700', color: '#F4ACB7' },
  bst: { fontSize: 11, color: '#9D8189', opacity: 0.7 },
  bcc: { borderRadius: 24, padding: 16, marginBottom: 16 },
  bcr: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bcl: { flex: 1, fontSize: 10, fontWeight: '800', color: '#fff', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 },
  rs: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  rt2: { fontSize: 10, fontWeight: '700', color: '#fff' },
  bnn: { fontSize: 18, fontWeight: '800', color: '#fff' },
  bl4: { fontSize: 11, color: '#fff', opacity: 0.8 },
  // Resumen
  summary: { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  sumTitle: { fontSize: 10, fontWeight: '800', color: '#9D8189', opacity: 0.6, letterSpacing: 1.5, textAlign: 'center', marginBottom: 10 },
  sumBar: { flexDirection: 'row', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 12, gap: 2 },
  sumSeg: { height: '100%', borderRadius: 99 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumItem: { alignItems: 'center', flex: 1 },
  sumDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 4 },
  sumLabel: { fontSize: 10, fontWeight: '700', color: '#9D8189', opacity: 0.7 },
  sumVal: { fontSize: 12, fontWeight: '800' },
  sumTotal: { fontSize: 11, fontWeight: '700', color: '#9D8189', opacity: 0.6, textAlign: 'center' },
  cbr: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40 },
});
