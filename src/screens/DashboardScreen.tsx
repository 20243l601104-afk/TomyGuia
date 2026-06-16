import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarWidget } from '../components/CalendarWidget';
import { BottomChat } from '../components/BottomChat';
import { BankConnectModal } from '../components/BankConnectModal';
import { configurarNotificaciones } from '../services/notifications';
import { TomasaSVG } from '../components/TomasaSVG';
import { FloatingAssistant } from '../components/FloatingAssistant';
import type { FixedExpenseSeed, FixedExpense, Expense, ConnectedBank, BankTransaction, UserProfile } from '../types';
import { loadDashboardState, saveDashboardState } from '../services/storage';

interface Props {
  emergencyFundGoal: number;
  totalBalance: number;
  seedExpenses: FixedExpenseSeed[];
  monthlyIncome: number;
  profile: UserProfile;
  onProfilePress: () => void;
  onAddFlowers: (amount: number, achievementId?: string) => void;
}

interface PagoAnual {
  id: string;
  nombre: string;
  monto: number;       // meta total
  ahorrado: number;    // lo que llevas
  mesVence: number;    // 1-12
  anioVence: number;
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
  const [dataLoaded, setDataLoaded] = useState(false);

  const totalBal = needsBudget + wantsBudget + ef;

  /* ─── Fondo de emergencia ─── */
  const ep = emergencyFundGoal > 0 ? Math.min((ef / emergencyFundGoal) * 100, 100) : 0;
  const me = emergencyFundGoal > 0 ? emergencyFundGoal / 3 : 0;
  const mp = me > 0 ? parseFloat((ef / me).toFixed(1)) : 0;

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
  // [cálculos de barras — ver abajo]

  /* ─── Gastos ─── */
  const [exps, setExps] = useState<Expense[]>([]);
  const [paidBills, setPaidBills] = useState<{ id: string; title: string; amount: number }[]>([]);
  const [pagosAnuales, setPagosAnuales] = useState<PagoAnual[]>([]);
  const [showAddPago, setShowAddPago] = useState(false);
  const [newPagoNombre, setNewPagoNombre] = useState('');
  const [newPagoMonto, setNewPagoMonto] = useState('');
  const [newPagoMes, setNewPagoMes] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2);
  const [showCierreMes, setShowCierreMes] = useState(false);
  const [sobranteCierre, setSobranteCierre] = useState({ needs: 0, wants: 0 });
  const [showAbonar, setShowAbonar] = useState(false);
  const [abonarPagoId, setAbonarPagoId] = useState<string | null>(null);
  const [abonarMonto, setAbonarMonto] = useState('');

  // ── Cargar estado guardado al montar ──────────────────
  // Configurar notificaciones al cargar
  useEffect(() => {
    if (seedExpenses.length > 0) {
      configurarNotificaciones(
        fel.map((e: import('../types').FixedExpense) => ({ title: e.title, amount: e.amount, day: e.day }))
      ).catch(() => {});
    }
  }, [seedExpenses]);

  useEffect(() => {
    const load = async () => {
      const saved = await loadDashboardState(initial50, initial30, initial20);

      if (saved.isNewMonth) {
        // Calcular sobrantes del mes anterior
        const sobrNeedsVal = Math.max(0, saved.needsBudget - 
          (saved.exps || []).filter((e: any) => e.category === 'needs').reduce((a: number, e: any) => a + e.amount, 0));
        const sobrWantsVal = Math.max(0, saved.wantsBudget - 
          (saved.exps || []).filter((e: any) => e.category === 'wants').reduce((a: number, e: any) => a + e.amount, 0));

        if (sobrNeedsVal > 0 || sobrWantsVal > 0) {
          setSobranteCierre({ needs: sobrNeedsVal, wants: sobrWantsVal });
          setShowCierreMes(true);
        }
      }

      setNeedsBudget(saved.needsBudget);
      setWantsBudget(saved.wantsBudget);
      setEf(saved.ef);
      setExps(saved.exps);
      setPaidBills(saved.paidBills);
      if (saved.bank) setCb(saved.bank);
      if (saved.pagosAnuales) setPagosAnuales(saved.pagosAnuales);
      setDataLoaded(true);
    };
    load();
  }, []);

  /* ─── Banco ─── */
  const [bmo, setBmo] = useState(false);
  const [cb, setCb] = useState<ConnectedBank | null>(null);
  const onBC = useCallback((bank: ConnectedBank, txs: BankTransaction[]) => {
    setCb(bank);
    setExps(p => [...p, ...txs]);
    const im = txs.reduce((a, b) => a + b.amount, 0);
    setWantsBudget(p => Math.max(0, p - im));
  }, []);

  // ── Guardar estado cuando cambia algo ─────────────────
  useEffect(() => {
    if (!dataLoaded) return; // no guardar antes de cargar
    const timer = setTimeout(() => {
      saveDashboardState({ needsBudget, wantsBudget, ef, exps, paidBills, bank: cb, pagosAnuales });
    }, 500); // debounce 500ms
    return () => clearTimeout(timer);
  }, [needsBudget, wantsBudget, ef, exps, paidBills, cb, dataLoaded, pagosAnuales]);

  // Barra 1: % de recibos pagados
  const totalBillsCount   = seedExpenses.length;
  const paidBillsCount    = paidBills.length;
  const np = totalBillsCount > 0
    ? Math.round((paidBillsCount / totalBillsCount) * 100)
    : 0;
  // Barra 2: % de dinero disponible vs recibos pendientes
  const pendingBillsAmount = seedExpenses
    .filter((e: any) => !paidBills.some((p: any) => p.id === e.id))
    .reduce((a: number, e: any) => a + e.amount, 0);
  const moneyPct = pendingBillsAmount > 0
    ? Math.min(Math.round((needsBudget / pendingBillsAmount) * 100), 100)
    : 100;

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

  // ── Helpers para pagos anuales ────────────────────────
  const getMesesRestantes = (mesVence: number, anioVence: number) => {
    const hoy   = new Date();
    const vence = new Date(anioVence, mesVence - 1, 1);
    const diff  = (vence.getFullYear() - hoy.getFullYear()) * 12 + (vence.getMonth() - hoy.getMonth());
    return Math.max(1, diff);
  };

  const getAhorroMensual = (pago: PagoAnual) => {
    const falta    = Math.max(0, pago.monto - pago.ahorrado);
    const meses    = getMesesRestantes(pago.mesVence, pago.anioVence);
    return Math.ceil(falta / meses);
  };

  const handleAddPago = () => {
    const monto = Number(newPagoMonto);
    if (!newPagoNombre.trim() || monto <= 0) return;
    const anio = newPagoMes <= new Date().getMonth() + 1
      ? new Date().getFullYear() + 1
      : new Date().getFullYear();
    const nuevo: PagoAnual = {
      id:         Date.now().toString(),
      nombre:     newPagoNombre.trim(),
      monto,
      ahorrado:   0,
      mesVence:   newPagoMes,
      anioVence:  anio,
    };
    setPagosAnuales(p => [...p, nuevo]);
    setNewPagoNombre(''); setNewPagoMonto('');
    setNewPagoMes(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2);
    setShowAddPago(false);
  };

  const handleAbonarPago = (id: string) => {
    setAbonarPagoId(id);
    setAbonarMonto('');
    setShowAbonar(true);
  };

  const confirmarAbono = () => {
    const amt = Number(abonarMonto);
    if (!amt || amt <= 0 || !abonarPagoId) return;
    setPagosAnuales(p => p.map(x =>
      x.id === abonarPagoId
        ? { ...x, ahorrado: Math.min(x.monto, x.ahorrado + amt) }
        : x
    ));
    setEf(prev => Math.max(0, prev - amt));
    setShowAbonar(false);
    setAbonarPagoId(null);
    setAbonarMonto('');
  };


  return (
    <KeyboardAvoidingView style={[s.con, { paddingTop: ins.top }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <View style={[s.bl, s.b1]} /><View style={[s.bl, s.b2]} />

      {/* Header */}
      <View style={s.hd}>
        <View><Text style={s.gr}>¡Hola{profile.name ? `, ${profile.name}` : ''}!</Text><Text style={s.sg}>{new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).replace(/^./, (m: string) => m.toUpperCase())}</Text></View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.av} onPress={onProfilePress} activeOpacity={0.7}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={s.ai} />
          ) : (
            <View style={s.incognito}><TomasaSVG size={32} floating={false} /></View>
          )}
          <View style={s.flowerBadge}>
              <Text style={{ fontSize: 12, color: '#E8963B' }}>*</Text>
              <Text style={s.flowerBadgeTxt}>{profile.flowers}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.sc} contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* ═══ 1. NECESIDADES (Rosa #F4ACB7) — 50% ═══ */}
        <View style={s.cardNec}>
          <View style={s.cardHead}>
            <View style={s.nt2}><Ionicons name="receipt-outline" size={16} color="#F4ACB7" /><Text style={s.ntx}>Necesidades</Text></View>
            <View style={[s.tg, { backgroundColor: '#F4ACB7' }]}><Text style={s.tt}>{paidBillsCount}/{totalBillsCount} recibos</Text></View>
          </View>
          {/* Barra 1 — Recibos pagados */}
          <View style={s.barraBloque}>
            <View style={s.barraLabelRow}>
              <View style={s.barraLabelLeft}>
                <Ionicons name="receipt-outline" size={13} color="#F4ACB7" />
                <Text style={s.barraLabel}>Recibos pagados</Text>
              </View>
              <Text style={s.barraValor}>{paidBillsCount} de {totalBillsCount}</Text>
            </View>
            <View style={s.pt}>
              <View style={[s.pf, { width: `${np}%` as any, backgroundColor: '#F4ACB7' }]} />
            </View>
            <Text style={s.barraSubtexto}>{np}% completado</Text>
          </View>

          {/* Barra 2 — Dinero disponible vs recibos pendientes */}
          <View style={s.barraBloque}>
            <View style={s.barraLabelRow}>
              <View style={s.barraLabelLeft}>
                <Ionicons name="wallet-outline" size={13} color={moneyPct >= 100 ? '#85A89E' : moneyPct >= 50 ? '#F3C57C' : '#FF8A80'} />
                <Text style={s.barraLabel}>Dinero apartado</Text>
              </View>
              <Text style={[s.barraValor, { color: moneyPct >= 100 ? '#85A89E' : moneyPct >= 50 ? '#B58A3A' : '#D64545' }]}>
                ${needsBudget.toLocaleString('es-MX')} de ${pendingBillsAmount.toLocaleString('es-MX')}
              </Text>
            </View>
            <View style={s.pt}>
              <View style={[s.pf, {
                width: `${moneyPct}%` as any,
                backgroundColor: moneyPct >= 100 ? '#85A89E' : moneyPct >= 50 ? '#F3C57C' : '#FF8A80'
              }]} />
            </View>
            <Text style={[s.barraSubtexto, { color: moneyPct < 50 ? '#D64545' : '#9D818970' }]}>
              {moneyPct >= 100 ? 'Tienes para cubrir todo lo que falta'
                : moneyPct >= 50 ? `Cubre el ${moneyPct}% de lo que queda por pagar`
                : `Aun te faltan $${(pendingBillsAmount - needsBudget).toLocaleString('es-MX')} — agrega mas a necesidades`}
            </Text>
          </View>
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
          {seedExpenses.length === 0 && (
            <Text style={{ fontSize: 11, color: '#9D8189', marginBottom: 6, lineHeight: 16 }}>
              {'Agrega tus gastos fijos aqui — renta, luz, agua, internet — para saber cuanto necesitas cada mes.'}
            </Text>
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
          {dailyFree < 50 && wantsBudget < 500 && (
            <Text style={{ fontSize: 11, color: '#B58A3A', marginTop: 4, lineHeight: 16 }}>
              {'Este monto se ve bajo porque aun no registras tu ingreso completo. Escribe cuanto cobraste en el chat de abajo.'}
            </Text>
          )}
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
          <Text style={s.fp}>{mp > 0 ? `${mp} ${mp === 1 ? 'mes' : 'meses'} de respaldo cubiertos` : 'Aun sin colchon de emergencia — cada pesito cuenta'}</Text>
          {ef === 0 && (
            <Text style={{ fontSize: 11, color: '#85A89E', marginTop: 4, lineHeight: 16 }}>
              {'Para empezar escribe algo como: aparte 200 para emergencias'}
            </Text>
          )}
        </View>

        {/* ═══ 4. PAGOS ANUALES (Morado #9D8189) ═══ */}
        <View style={s.cardPago}>
          <View style={s.cardHead}>
            <View style={s.nt2}>
              <Ionicons name="calendar-outline" size={16} color="#9D8189" />
              <Text style={[s.ntx, { color: '#6D5A62' }]}>Pagos del año</Text>
            </View>
            <TouchableOpacity
              style={[s.tg, { backgroundColor: '#9D818920', borderWidth: 1, borderColor: '#9D818940' }]}
              onPress={() => setShowAddPago(true)}
            >
              <Ionicons name="add" size={14} color="#9D8189" />
              <Text style={[s.tt, { color: '#9D8189' }]}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {pagosAnuales.length === 0 ? (
            /* Estado vacío — Tomasa invita */
            <TouchableOpacity style={s.pagoVacio} onPress={() => setShowAddPago(true)}>
              
              <Text style={s.pagoVacioTitulo}>Planea tus pagos del año</Text>
              <Text style={s.pagoVacioDesc}>
                Predial, tenencia, seguro... agrégalos aquí y te digo cuánto ahorrar cada mes para no sorprenderte
              </Text>
              <View style={s.pagoVacioBtn}>
                <Ionicons name="add-circle-outline" size={16} color="#9D8189" />
                <Text style={s.pagoVacioBtnTxt}>Agregar primer pago</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 12 }}>
              {pagosAnuales.map(pago => {
                const pct          = Math.min((pago.ahorrado / pago.monto) * 100, 100);
                const mesesRest    = getMesesRestantes(pago.mesVence, pago.anioVence);
                const ahorroMes    = getAhorroMensual(pago);
                const falta        = Math.max(0, pago.monto - pago.ahorrado);
                const mesNombre    = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][pago.mesVence - 1];
                const isUrgente    = mesesRest <= 2 && pct < 100;
                const isCompleto   = pct >= 100;

                return (
                  <View key={pago.id} style={[s.pagoCard, isUrgente && s.pagoCardUrgente, isCompleto && s.pagoCardCompleto]}>
                    <View style={s.pagoCardHead}>
                      <Text style={s.pagoNombre}>{pago.nombre}</Text>
                      <Text style={[s.pagoFecha, isUrgente && { color: '#D64545' }]}>
                        {mesNombre} {pago.anioVence}
                      </Text>
                    </View>

                    {/* Barra de progreso */}
                    <View style={s.pt}>
                      <View style={[s.pf, {
                        width: `${pct}%` as any,
                        backgroundColor: isCompleto ? '#85A89E' : isUrgente ? '#F4ACB7' : '#9D8189',
                      }]} />
                    </View>

                    <View style={s.pagoCardFoot}>
                      <Text style={s.pagoAhorrado}>
                        ${pago.ahorrado.toLocaleString('es-MX')} de ${pago.monto.toLocaleString('es-MX')}
                      </Text>
                      {isCompleto ? (
                        <Text style={s.pagoCompleto}>Pagado</Text>
                      ) : (
                        <Text style={[s.pagoMensual, isUrgente && { color: '#D64545' }]}>
                          ${ahorroMes.toLocaleString('es-MX')}/mes
                        </Text>
                      )}
                    </View>

                    {!isCompleto && (
                      <Text style={s.pagoMsg}>
                        {isUrgente
                          ? `Quedan ${mesesRest} mes${mesesRest > 1 ? 'es' : ''}. Falta $${falta.toLocaleString('es-MX')}`
                          : `Aparta $${ahorroMes.toLocaleString('es-MX')} al mes — faltan ${mesesRest} meses`}
                      </Text>
                    )}

                    <View style={s.pagoActions}>
                      <TouchableOpacity
                        style={s.pagoAbonarBtn}
                        onPress={() => handleAbonarPago(pago.id)}
                        disabled={isCompleto}
                      >
                        <Ionicons name="add-circle-outline" size={14} color={isCompleto ? '#9D818960' : '#9D8189'} />
                        <Text style={[s.pagoAbonarTxt, isCompleto && { opacity: 0.4 }]}>Abonar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.pagoEliminarBtn}
                        onPress={() => {
                          Alert.alert('Eliminar', `¿Eliminar "${pago.nombre}"?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            { text: 'Eliminar', style: 'destructive', onPress: () => {
                              setPagosAnuales(p => p.filter(x => x.id !== pago.id));
                              setEf(prev => prev + pago.ahorrado);
                            }},
                          ]);
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#FFCAD4" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ══ MODAL: ABONAR A PAGO ANUAL ══ */}
      <Modal visible={showAbonar} transparent animationType="fade" onRequestClose={() => setShowAbonar(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowAbonar(false)} />
        <View style={[s.modalSheet, { paddingBottom: 40 }]}>
          <View style={s.modalHandle} />
          <Text style={s.modalTitulo}>Abonar al ahorro</Text>
          <Text style={s.modalDesc}>
            {pagosAnuales.find(p => p.id === abonarPagoId)
              ? `Falta $${Math.max(0, (pagosAnuales.find(p => p.id === abonarPagoId)?.monto || 0) - (pagosAnuales.find(p => p.id === abonarPagoId)?.ahorrado || 0)).toLocaleString('es-MX')} para completar ${pagosAnuales.find(p => p.id === abonarPagoId)?.nombre}`
              : '¿Cuánto quieres agregar?'}
          </Text>
          <Text style={s.modalLabel}>Monto a abonar</Text>
          <View style={s.modalInputRow}>
            <Text style={s.modalDolar}>$</Text>
            <TextInput
              style={[s.modalInput, { flex: 1 }]}
              value={abonarMonto}
              onChangeText={setAbonarMonto}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor="#9D818960"
              autoFocus
            />
          </View>
          <Text style={{ fontSize: 12, color: '#9D818980', marginBottom: 16, marginTop: -8 }}>
            Se descontará de tu fondo de emergencia
          </Text>
          <TouchableOpacity
            style={[s.modalBtn, (!abonarMonto || Number(abonarMonto) <= 0) && { opacity: 0.4 }]}
            onPress={confirmarAbono}
            disabled={!abonarMonto || Number(abonarMonto) <= 0}
          >
            <Text style={s.modalBtnTxt}>Confirmar abono</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ══ MODAL: EMERGENCIA ══ */}

      {/* ══ MODAL: CIERRE DE MES ══ */}
      <Modal visible={showCierreMes} transparent animationType="fade" onRequestClose={() => setShowCierreMes(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: 40 }]}>
            <View style={s.modalHandle} />

            {/* Header con Tomasa */}
            <View style={{ alignItems: 'center', marginBottom: 20, gap: 8 }}>
              
              <Text style={[s.modalTitulo, { textAlign: 'center' }]}>¡Cerraste el mes!</Text>
              <Text style={[s.modalDesc, { textAlign: 'center' }]}>
                Te sobraron recursos del mes pasado. ¿Qué hacemos con ellos?
              </Text>
            </View>

            {/* Sobrantes */}
            <View style={s.cierreSobrantes}>
              {sobranteCierre.needs > 0 && (
                <View style={s.cierreSobranteRow}>
                  <View style={[s.cierreDot, { backgroundColor: '#F4ACB7' }]} />
                  <Text style={s.cierreSobranteTxt}>Necesidades</Text>
                  <Text style={s.cierreSobranteVal}>${sobranteCierre.needs.toLocaleString('es-MX')}</Text>
                </View>
              )}
              {sobranteCierre.wants > 0 && (
                <View style={s.cierreSobranteRow}>
                  <View style={[s.cierreDot, { backgroundColor: '#F3C57C' }]} />
                  <Text style={s.cierreSobranteTxt}>Gustos</Text>
                  <Text style={s.cierreSobranteVal}>${sobranteCierre.wants.toLocaleString('es-MX')}</Text>
                </View>
              )}
              <View style={[s.cierreSobranteRow, { borderTopWidth: 1, borderTopColor: '#F0E0E5', paddingTop: 8, marginTop: 4 }]}>
                <Text style={[s.cierreSobranteTxt, { fontWeight: '800' }]}>Total sobrante</Text>
                <Text style={[s.cierreSobranteVal, { color: '#F4ACB7', fontWeight: '800' }]}>
                  ${(sobranteCierre.needs + sobranteCierre.wants).toLocaleString('es-MX')}
                </Text>
              </View>
            </View>

            {/* Opciones */}
            <View style={s.cierreOpciones}>
              {/* Opción 1: Fondo de emergencia */}
              <TouchableOpacity
                style={s.cierreOpcion}
                onPress={() => {
                  setEf(prev => prev + sobranteCierre.needs + sobranteCierre.wants);
                  setShowCierreMes(false);
                }}
              >
                
                <View style={{ flex: 1 }}>
                  <Text style={s.cierreOpcionTitulo}>Fondo de emergencia</Text>
                  <Text style={s.cierreOpcionDesc}>Súmalo a tu ahorro de seguridad</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#85A89E" />
              </TouchableOpacity>

              {/* Opción 2: Pagos anuales */}
              {pagosAnuales.length > 0 && (
                <TouchableOpacity
                  style={s.cierreOpcion}
                  onPress={() => {
                    const total = sobranteCierre.needs + sobranteCierre.wants;
                    // Distribuir entre pagos anuales pendientes
                    const pendientes = pagosAnuales.filter(p => p.ahorrado < p.monto);
                    if (pendientes.length > 0) {
                      const porPago = Math.floor(total / pendientes.length);
                      setPagosAnuales(prev => prev.map(p =>
                        p.ahorrado < p.monto
                          ? { ...p, ahorrado: Math.min(p.monto, p.ahorrado + porPago) }
                          : p
                      ));
                    }
                    setShowCierreMes(false);
                  }}
                >
                  
                  <View style={{ flex: 1 }}>
                    <Text style={s.cierreOpcionTitulo}>Pagos del año</Text>
                    <Text style={s.cierreOpcionDesc}>Abonarlo a tus pagos anuales pendientes</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9D8189" />
                </TouchableOpacity>
              )}

              {/* Opción 3: Dejarlo */}
              <TouchableOpacity
                style={[s.cierreOpcion, { borderColor: '#F0E0E5' }]}
                onPress={() => setShowCierreMes(false)}
              >
                
                <View style={{ flex: 1 }}>
                  <Text style={s.cierreOpcionTitulo}>Lo decido después</Text>
                  <Text style={s.cierreOpcionDesc}>Cerrar sin mover el dinero</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#9D818960" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal agregar pago anual */}
        <Modal visible={showAddPago} transparent animationType="slide" onRequestClose={() => setShowAddPago(false)}>
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowAddPago(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitulo}>Nuevo pago del año</Text>
            <Text style={s.modalDesc}>Agrega un pago anual y te digo cuánto guardar cada mes</Text>

            <Text style={s.modalLabel}>¿Qué vas a pagar?</Text>
            <TextInput
              style={s.modalInput}
              value={newPagoNombre}
              onChangeText={setNewPagoNombre}
              placeholder="Ej. Predial, Tenencia, Seguro..."
              placeholderTextColor="#9D818960"
            />

            <Text style={s.modalLabel}>¿Cuánto cuesta aproximadamente?</Text>
            <View style={s.modalInputRow}>
              <Text style={s.modalDolar}>$</Text>
              <TextInput
                style={[s.modalInput, { flex: 1 }]}
                value={newPagoMonto}
                onChangeText={setNewPagoMonto}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9D818960"
              />
            </View>

            <Text style={s.modalLabel}>¿En qué mes vence?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.mesBtn, newPagoMes === i + 1 && s.mesBtnActive]}
                    onPress={() => setNewPagoMes(i + 1)}
                  >
                    <Text style={[s.mesBtnTxt, newPagoMes === i + 1 && s.mesBtnTxtActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {newPagoMonto && Number(newPagoMonto) > 0 && (
              <View style={s.modalPreview}>
                <Text style={s.modalPreviewTxt}>
                  Sugerencia: aparta ~${Math.ceil(Number(newPagoMonto) / Math.max(1, (() => {
                    const hoy = new Date();
                    const vence = new Date(newPagoMes <= hoy.getMonth() + 1 ? hoy.getFullYear() + 1 : hoy.getFullYear(), newPagoMes - 1, 1);
                    return Math.max(1, (vence.getFullYear() - hoy.getFullYear()) * 12 + (vence.getMonth() - hoy.getMonth()));
                  })())).toLocaleString('es-MX')} al mes
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.modalBtn, (!newPagoNombre.trim() || !newPagoMonto) && { opacity: 0.4 }]}
              onPress={handleAddPago}
              disabled={!newPagoNombre.trim() || !newPagoMonto}
            >
              <Text style={s.modalBtnTxt}>Agregar pago</Text>
            </TouchableOpacity>
          </View>
        </Modal>

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

      <View style={s.cbr}><BottomChat onIncomeAdded={onIA} onExpenseAdded={onEA} onBillPaid={onBillPaid} fixedExpenses={seedExpenses} currentNeeds={needsBudget} currentWants={wantsBudget} currentSavings={ef} totalBalance={totalBal} monthlyIncome={monthlyIncome} userName={profile.name} /></View>
<FloatingAssistant
        wantsBudget={wantsBudget}
        wantsSpent={exps.filter(e => e.category === 'wants').reduce((a, e) => a + e.amount, 0)}
        needsBudget={needsBudget}
        emergencyFundGoal={emergencyFundGoal}
        emergencyFund={ef}
        fixedExpenses={fel}
        paidBills={paidBills}

      />     
 <BankConnectModal isOpen={bmo} onClose={() => setBmo(false)} onConnected={onBC} />
    </KeyboardAvoidingView>
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
  barraBloque:    { gap: 4, marginBottom: 10 },
  barraLabelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  barraLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barraLabel:     { fontSize: 12, fontWeight: '600', color: '#9D8189', opacity: 0.8 },
  barraValor:     { fontSize: 12, fontWeight: '800', color: '#9D8189' },
  barraSubtexto:  { fontSize: 11, color: '#9D818970', marginTop: 1 },
  // Modal cierre de mes
  cierreSobrantes:    { backgroundColor: '#FFF8F9', borderRadius: 16, padding: 14, marginBottom: 16, gap: 8 },
  cierreSobranteRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cierreDot:          { width: 10, height: 10, borderRadius: 5 },
  cierreSobranteTxt:  { flex: 1, fontSize: 14, fontWeight: '600', color: '#9D8189' },
  cierreSobranteVal:  { fontSize: 14, fontWeight: '700', color: '#6D5A62' },
  cierreOpciones:     { gap: 10 },
  cierreOpcion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#FFCAD4',
  },
  cierreOpcionEmoji:  { fontSize: 28 },
  cierreOpcionTitulo: { fontSize: 14, fontWeight: '800', color: '#6D5A62', marginBottom: 2 },
  cierreOpcionDesc:   { fontSize: 12, color: '#9D8189', opacity: 0.7 },
  // Pagos anuales
  cardPago:         { backgroundColor: '#9D818910', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#9D818930' },
  pagoVacio:        { alignItems: 'center', paddingVertical: 20, gap: 8 },
  pagoVacioEmoji:   { fontSize: 40 },
  pagoVacioTitulo:  { fontSize: 16, fontWeight: '800', color: '#6D5A62' },
  pagoVacioDesc:    { fontSize: 13, color: '#9D8189', textAlign: 'center', lineHeight: 19, opacity: 0.8, paddingHorizontal: 8 },
  pagoVacioBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#9D818920', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  pagoVacioBtnTxt:  { fontSize: 13, fontWeight: '700', color: '#9D8189' },
  pagoCard:         { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12, gap: 6, borderWidth: 1, borderColor: '#9D818920' },
  pagoCardUrgente:  { borderColor: '#F4ACB7', backgroundColor: '#FFF5F7' },
  pagoCardCompleto: { borderColor: '#85A89E40', backgroundColor: '#F0F9F4' },
  pagoCardHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagoNombre:       { fontSize: 14, fontWeight: '800', color: '#6D5A62' },
  pagoFecha:        { fontSize: 12, fontWeight: '600', color: '#9D8189', opacity: 0.7 },
  pagoCardFoot:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagoAhorrado:     { fontSize: 12, color: '#9D8189', fontWeight: '600' },
  pagoMensual:      { fontSize: 12, fontWeight: '800', color: '#9D8189' },
  pagoCompleto:     { fontSize: 12, fontWeight: '800', color: '#85A89E' },
  pagoMsg:          { fontSize: 11, color: '#9D8189', opacity: 0.75 },
  pagoActions:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  pagoAbonarBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#9D818915', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  pagoAbonarTxt:    { fontSize: 12, fontWeight: '700', color: '#9D8189' },
  pagoEliminarBtn:  { padding: 6 },
  // Modal pagos anuales
  modalOverlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, elevation: 20 },
  modalHandle:      { width: 48, height: 5, backgroundColor: '#D8E2DC', borderRadius: 99, alignSelf: 'center', marginBottom: 20 },
  modalTitulo:      { fontSize: 20, fontWeight: '800', color: '#9D8189', marginBottom: 4 },
  modalDesc:        { fontSize: 13, color: '#9D8189', opacity: 0.7, marginBottom: 20, lineHeight: 19 },
  modalLabel:       { fontSize: 11, fontWeight: '700', color: '#9D8189', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  modalInput:       { backgroundColor: '#FFF8F9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: '#9D8189', marginBottom: 16, borderWidth: 1, borderColor: '#9D818930' },
  modalInputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalDolar:       { fontSize: 18, fontWeight: '700', color: '#9D8189' },
  mesBtn:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#9D818930' },
  mesBtnActive:     { backgroundColor: '#9D8189', borderColor: '#9D8189' },
  mesBtnTxt:        { fontSize: 12, fontWeight: '600', color: '#9D818980' },
  mesBtnTxtActive:  { color: '#fff', fontWeight: '800' },
  modalPreview:     { backgroundColor: '#9D818915', borderRadius: 12, padding: 12, marginBottom: 16 },
  modalPreviewTxt:  { fontSize: 13, color: '#9D8189', fontWeight: '600', textAlign: 'center' },
  modalBtn:         { backgroundColor: '#9D8189', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  modalBtnTxt:      { color: '#fff', fontWeight: '800', fontSize: 15 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  cbr: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: 'transparent' },
});
