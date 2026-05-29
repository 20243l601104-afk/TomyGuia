import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TomasaSVG } from '../components/TomasaSVG';
import type { FixedExpenseSeed } from '../types';

const C = { ROSA: '#F4ACB7', CLARO: '#FFCAD4', MELON: '#FFE5D9', MENTA: '#D8E2DC', MALVA: '#9D8189', VCLARO: '#85A89E', AMARILLO: '#F3C57C', MORADO: '#D977A0' };

type StepId = 'welcome' | 'tip' | 'housing-choice' | 'housing-rent' | 'utilities-water' | 'utilities-light' | 'utilities-internet' | 'transport-choice' | 'transport-gas' | 'transport-public' | 'food-week' | 'subs-choice' | 'subs-amount' | 'income' | 'balance-debit' | 'balance-cash' | 'summary';

interface Answers {
  housing: 'own' | 'rent' | null; rent: number; water: number; light: number; internet: number;
  transport: 'car' | 'public' | 'none' | null; gasWeekly: number; publicWeekly: number;
  foodWeekly: number; hasSubs: boolean | null; subs: number; monthlyIncome: number; debit: number; cash: number;
}

const INIT: Answers = { housing: null, rent: 0, water: 0, light: 0, internet: 0, transport: null, gasWeekly: 0, publicWeekly: 0, foodWeekly: 0, hasSubs: null, subs: 0, monthlyIncome: 0, debit: 0, cash: 0 };

function ns(cur: StepId, a: Answers): StepId | null {
  switch (cur) {
    case 'welcome': return 'tip';
    case 'tip': return 'housing-choice';
    case 'housing-choice': return a.housing === 'rent' ? 'housing-rent' : 'utilities-water';
    case 'housing-rent': return 'utilities-water';
    case 'utilities-water': return 'utilities-light';
    case 'utilities-light': return 'utilities-internet';
    case 'utilities-internet': return 'transport-choice';
    case 'transport-choice': return a.transport === 'car' ? 'transport-gas' : a.transport === 'public' ? 'transport-public' : 'food-week';
    case 'transport-gas': return 'food-week';
    case 'transport-public': return 'food-week';
    case 'food-week': return 'subs-choice';
    case 'subs-choice': return a.hasSubs ? 'subs-amount' : 'income';
    case 'subs-amount': return 'income';
    case 'income': return 'balance-debit';
    case 'balance-debit': return 'balance-cash';
    case 'balance-cash': return 'summary';
    case 'summary': return null;
  }
}

function walk(a: Answers): StepId[] {
  const o: StepId[] = ['welcome'];
  let s: StepId | null = 'welcome';
  while (s) { const n = ns(s, a); if (!n) break; o.push(n); s = n; }
  return o;
}

/* ──────────────────────────────────────────────
   AmountInput: componente EXTERNO para evitar
   que el teclado salte al re-renderizar
   ────────────────────────────────────────────── */
interface AmountInputProps {
  label: string;
  suffix?: string;
  skip?: boolean;
  required?: boolean;
  onSubmit: (value: number) => void;
  onSkip?: () => void;
}

function AmountInput({ label, suffix, skip, required, onSubmit, onSkip }: AmountInputProps) {
  const [draft, setDraft] = useState('');
  const disabled = required && (Number(draft) || 0) <= 0;

  return (
    <View style={s.st}>
      <View style={s.tw}><TomasaSVG size={56} /></View>
      <View style={s.bub}><Text style={s.bt}>{label}</Text></View>
      <View style={s.aw}>
        <Text style={s.dl}>$</Text>
        <TextInput
          style={s.ai}
          value={draft}
          onChangeText={setDraft}
          placeholder="0"
          keyboardType="numeric"
          autoFocus
          returnKeyType="done"
          placeholderTextColor={C.MALVA + '50'}
          onSubmitEditing={() => !disabled && onSubmit(Number(draft) || 0)}
        />
        {suffix ? <Text style={s.sf}>{suffix}</Text> : null}
      </View>
      <View style={s.rw}>
        {skip && (
          <TouchableOpacity style={[s.bn, s.bns, { flex: 1, marginRight: 8 }]} onPress={onSkip}>
            <Text style={s.bnt}>No aplica</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.bn, s.bnp, { flex: 2, opacity: disabled ? 0.4 : 1 }]}
          disabled={!!disabled}
          onPress={() => onSubmit(Number(draft) || 0)}
        >
          <Text style={s.bpt}>Siguiente</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ──────────────────────────────────────────────
   OnboardingScreen
   ────────────────────────────────────────────── */
interface Props {
  onComplete: (r: { fixedExpenses: FixedExpenseSeed[]; totalBalance: number; emergencyFundGoal: number; monthlyIncome: number }) => void;
}

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState<StepId>('welcome');
  const [ans, setAns] = useState<Answers>(INIT);

  const flow = walk(ans);
  const idx = Math.max(0, flow.indexOf(step));
  const prog = ((idx + 1) / flow.length) * 100;

  const adv = useCallback((patch: Partial<Answers> = {}) => {
    setAns(prev => {
      const m = { ...prev, ...patch };
      const n = ns(step, m);
      if (n) setStep(n);
      return m;
    });
  }, [step]);

  const handleAmount = useCallback((k: keyof Answers, value: number) => {
    const patch = { [k]: value } as Partial<Answers>;
    adv(patch);
  }, [adv]);

  const handleSkip = useCallback((k: keyof Answers) => {
    adv({ [k]: 0 } as Partial<Answers>);
  }, [adv]);

  const exps: FixedExpenseSeed[] = (() => {
    const l: FixedExpenseSeed[] = [];
    if (ans.housing === 'rent' && ans.rent > 0) l.push({ id: 'rent', title: 'Renta', color: C.ROSA, amount: ans.rent, iconKey: 'home' });
    if (ans.water > 0) l.push({ id: 'water', title: 'Agua', color: C.VCLARO, amount: ans.water, iconKey: 'droplet' });
    if (ans.light > 0) l.push({ id: 'light', title: 'Luz', color: C.AMARILLO, amount: ans.light, iconKey: 'zap' });
    if (ans.internet > 0) l.push({ id: 'internet', title: 'Internet', color: C.MORADO, amount: ans.internet, iconKey: 'wifi' });
    if (ans.transport === 'car' && ans.gasWeekly > 0) l.push({ id: 'gas', title: 'Gasolina', color: C.MALVA, amount: ans.gasWeekly * 4, iconKey: 'car' });
    if (ans.transport === 'public' && ans.publicWeekly > 0) l.push({ id: 'transport', title: 'Transporte', color: C.MALVA, amount: ans.publicWeekly * 4, iconKey: 'bus' });
    if (ans.foodWeekly > 0) l.push({ id: 'food', title: 'Despensa', color: C.CLARO, amount: ans.foodWeekly * 4, iconKey: 'cart' });
    if (ans.hasSubs && ans.subs > 0) l.push({ id: 'subs', title: 'Suscripciones', color: C.MENTA, amount: ans.subs, iconKey: 'tv' });
    return l;
  })();

  const tot = exps.reduce((a, b) => a + b.amount, 0);
  const goal = tot * 3;
  const bal = ans.debit + ans.cash;

  const Ch = ({ icon, label, onPress }: { icon?: string; label: string; onPress: () => void }) => (
    <TouchableOpacity style={s.chb} onPress={onPress}>
      {icon ? <Ionicons name={icon as any} size={22} color={C.ROSA} /> : null}
      <Text style={s.cht}>{label}</Text>
    </TouchableOpacity>
  );

  const render = () => {
    switch (step) {
      case 'welcome':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={64} /></View>
            <View style={s.bub}><Text style={s.bt}>¡Hola! Soy Tomasa 🌸. Vamos a registrar tus gastos fijos en 2 minutos.</Text></View>
            <View style={s.hi}>
              <Ionicons name="receipt-outline" size={14} color={C.ROSA} />
              <Text style={s.ht}>Ten a la mano tus recibos recientes</Text>
            </View>
            <TouchableOpacity style={[s.bn, s.bnp]} onPress={() => adv()}>
              <Text style={s.bpt}>¡Empecemos!</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      case 'tip':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={64} /></View>
            <View style={s.bub}><Text style={s.bt}>¿Sabes la regla 50/30/20? 💡 50% necesidades, 30% gustos, 20% futuro. Vamos a aplicarla juntas.</Text></View>
            <TouchableOpacity style={[s.bn, s.bnp]} onPress={() => adv()}>
              <Text style={s.bpt}>Estoy lista</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      case 'housing-choice':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={56} /></View>
            <View style={s.bub}><Text style={s.bt}>¿Tienes casa propia o alquilas?</Text></View>
            <View style={s.g2}>
              <Ch icon="home-outline" label="Casa propia" onPress={() => adv({ housing: 'own', rent: 0 })} />
              <Ch icon="key-outline" label="Alquilo" onPress={() => adv({ housing: 'rent' })} />
            </View>
          </View>
        );
      /* ─── Inputs numéricos: cada uno usa key={step} para resetear el estado interno ─── */
      case 'housing-rent':
        return <AmountInput key="housing-rent" label="¿Cuánto pagas de renta al mes? 🏡" suffix="al mes" required onSubmit={v => handleAmount('rent', v)} />;
      case 'utilities-water':
        return <AmountInput key="utilities-water" label="¿Cuánto pagas de agua al mes? 💧" suffix="al mes" skip onSubmit={v => handleAmount('water', v)} onSkip={() => handleSkip('water')} />;
      case 'utilities-light':
        return <AmountInput key="utilities-light" label="¿Y de luz al mes? ⚡" suffix="al mes" skip onSubmit={v => handleAmount('light', v)} onSkip={() => handleSkip('light')} />;
      case 'utilities-internet':
        return <AmountInput key="utilities-internet" label="¿Internet o teléfono al mes? 📶" suffix="al mes" skip onSubmit={v => handleAmount('internet', v)} onSkip={() => handleSkip('internet')} />;
      case 'transport-choice':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={56} /></View>
            <View style={s.bub}><Text style={s.bt}>¿Cómo te transportas?</Text></View>
            <View style={s.g3}>
              <Ch icon="car-outline" label="Carro" onPress={() => adv({ transport: 'car' })} />
              <Ch icon="bus-outline" label="Autobús" onPress={() => adv({ transport: 'public' })} />
              <Ch icon="walk-outline" label="Ninguno" onPress={() => adv({ transport: 'none', gasWeekly: 0, publicWeekly: 0 })} />
            </View>
          </View>
        );
      case 'transport-gas':
        return <AmountInput key="transport-gas" label="¿Cuánto cargas de gasolina por semana? ⛽" suffix="por semana" required onSubmit={v => handleAmount('gasWeekly', v)} />;
      case 'transport-public':
        return <AmountInput key="transport-public" label="¿Cuánto gastas en transporte por semana? 🚌" suffix="por semana" required onSubmit={v => handleAmount('publicWeekly', v)} />;
      case 'food-week':
        return <AmountInput key="food-week" label="¿Cuánto gastas en despensa por semana? 🛒" suffix="por semana" required onSubmit={v => handleAmount('foodWeekly', v)} />;
      case 'subs-choice':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={56} /></View>
            <View style={s.bub}><Text style={s.bt}>¿Tienes suscripciones activas? (Netflix, Spotify…) 📺</Text></View>
            <View style={s.g2}>
              <Ch icon="tv-outline" label="Sí" onPress={() => adv({ hasSubs: true })} />
              <Ch icon="close-circle-outline" label="No" onPress={() => adv({ hasSubs: false, subs: 0 })} />
            </View>
          </View>
        );
      case 'subs-amount':
        return <AmountInput key="subs-amount" label="¿Cuánto suman tus suscripciones al mes?" suffix="al mes" required onSubmit={v => handleAmount('subs', v)} />;
      case 'income':
        return <AmountInput key="income" label="¿Cuánto dinero recibes al mes? 💰" suffix="al mes" required onSubmit={v => handleAmount('monthlyIncome', v)} />;
      case 'balance-debit':
        return <AmountInput key="balance-debit" label="¿Cuánto tienes en tu cuenta de débito? 🏦" suffix="actual" onSubmit={v => handleAmount('debit', v)} />;
      case 'balance-cash':
        return <AmountInput key="balance-cash" label="¿Cuánto efectivo cargas? 💵" suffix="en cartera" onSubmit={v => handleAmount('cash', v)} />;
      case 'summary':
        return (
          <View style={s.st}>
            <View style={s.tw}><TomasaSVG size={64} /></View>
            <View style={s.sc}>
              <Text style={s.sct}>Tu meta de Fondo de Emergencia</Text>
              <View style={s.sa}><Text style={s.sat}>${goal.toLocaleString('es-MX')}</Text></View>
              <Text style={s.ss}>3 meses × ${tot.toLocaleString('es-MX')} gastos fijos</Text>
              <View style={s.dv} />
              <Text style={s.slt}>AGREGAREMOS AL CALENDARIO:</Text>
              {exps.map(e => (
                <View key={e.id} style={s.sr}>
                  <View style={[s.dot, { backgroundColor: e.color }]} />
                  <Text style={s.sl}>{e.title}</Text>
                  <Text style={s.sv}>${e.amount.toLocaleString('es-MX')}</Text>
                </View>
              ))}
              {exps.length === 0 && <Text style={s.se}>Sin gastos fijos registrados.</Text>}
            </View>
            <TouchableOpacity style={[s.bn, s.bnp]} onPress={() => onComplete({ fixedExpenses: exps, totalBalance: bal, emergencyFundGoal: goal, monthlyIncome: ans.monthlyIncome })}>
              <Text style={s.bpt}>Ir a mi dashboard</Text>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      default: return null;
    }
  };

  return (
    <LinearGradient colors={[C.MELON, C.MENTA]} style={s.con}>
      <View style={s.pw}>
        <View style={s.pt}><View style={[s.pf, { width: `${prog}%` as any }]} /></View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.sc2} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {render()}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  con: { flex: 1 },
  pw: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 },
  pt: { height: 6, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 99, overflow: 'hidden' },
  pf: { height: '100%', backgroundColor: '#F4ACB7', borderRadius: 99 },
  sc2: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },
  st: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 32, gap: 16 },
  tw: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFCAD4', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#fff', elevation: 8 },
  bub: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24, borderTopLeftRadius: 4, padding: 16, width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', elevation: 2 },
  bt: { fontSize: 15, color: '#9D8189', fontWeight: '500', lineHeight: 22 },
  hi: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFCAD440', borderWidth: 1, borderColor: '#FFCAD4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  ht: { fontSize: 12, color: '#F4ACB7', fontWeight: '700' },
  aw: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, width: '100%' },
  dl: { fontSize: 22, fontWeight: '700', color: '#F4ACB7', paddingRight: 4 },
  ai: { flex: 1, fontSize: 22, fontWeight: '700', color: '#9D8189', paddingVertical: 16 },
  sf: { fontSize: 10, fontWeight: '700', color: '#9D8189', opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 },
  rw: { flexDirection: 'row', width: '100%' },
  g2: { flexDirection: 'row', gap: 12, width: '100%' },
  g3: { flexDirection: 'row', gap: 8, width: '100%' },
  chb: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)' },
  cht: { fontSize: 13, fontWeight: '700', color: '#9D8189', textAlign: 'center' },
  bn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16 },
  bnp: { width: '100%', backgroundColor: '#F4ACB7', elevation: 6 },
  bpt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  bns: { backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  bnt: { color: '#9D8189', fontWeight: '700', fontSize: 14 },
  sc: { width: '100%', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 20, alignItems: 'center' },
  sct: { fontSize: 13, color: '#9D8189', opacity: 0.8, marginBottom: 8 },
  sa: { backgroundColor: '#FFE5D9', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 16, marginBottom: 8 },
  sat: { fontSize: 32, fontWeight: '800', color: '#F4ACB7' },
  ss: { fontSize: 12, color: '#9D8189', opacity: 0.7, textAlign: 'center', marginBottom: 12 },
  dv: { width: '100%', height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginBottom: 12 },
  slt: { fontSize: 10, fontWeight: '800', color: '#9D8189AA', letterSpacing: 1, alignSelf: 'flex-start', marginBottom: 8 },
  sr: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sl: { flex: 1, fontSize: 13, fontWeight: '700', color: '#9D8189' },
  sv: { fontSize: 13, fontWeight: '700', color: '#9D8189CC' },
  se: { fontSize: 13, color: '#9D8189', opacity: 0.5, fontStyle: 'italic' },
});
