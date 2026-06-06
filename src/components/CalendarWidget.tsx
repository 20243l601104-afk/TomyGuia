import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, TextInput, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { TomasaSVG } from './TomasaSVG';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FixedExpenseSeed, FixedExpense } from '../types';

const STORAGE_KEY = 'tomy_calendar_days'; // guarda { [expenseId]: dayNumber }

const IM: Record<FixedExpenseSeed['iconKey'], keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline', droplet: 'water-outline', zap: 'flash-outline', wifi: 'wifi-outline',
  car: 'car-outline', bus: 'bus-outline', cart: 'cart-outline', tv: 'tv-outline',
};

const ICON_OPTIONS: { key: FixedExpenseSeed['iconKey']; label: string }[] = [
  { key: 'home', label: '🏠 Vivienda' }, { key: 'droplet', label: '💧 Agua' },
  { key: 'zap', label: '⚡ Luz' },       { key: 'wifi', label: '📶 Internet' },
  { key: 'car', label: '🚗 Auto' },      { key: 'bus', label: '🚌 Transporte' },
  { key: 'cart', label: '🛒 Despensa' }, { key: 'tv', label: '📺 Suscripción' },
];

const COLORS_LIST = ['#F4ACB7','#85A89E','#F3C57C','#D977A0','#9D8189','#FFCAD4','#D8E2DC','#A8DADC'];

interface Props {
  seedExpenses?: FixedExpenseSeed[];
  onTotalsChange?: (t: { paid: number; total: number }) => void;
  onExpensesChange?: (e: FixedExpense[]) => void;
}

export function CalendarWidget({ seedExpenses, onTotalsChange, onExpensesChange }: Props) {
  const today = new Date();

  // ── Estado ──────────────────────────────────────────
  const [viewDate, setViewDate]   = useState(today);           // mes visible
  const [pend, setPend]           = useState<FixedExpense | null>(null);
  const [sel, setSel]             = useState<number | null>(null);
  const [showAdd, setShowAdd]     = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newIcon, setNewIcon]     = useState<FixedExpenseSeed['iconKey']>('home');

  // dayMap: { [expenseId]: dayOfMonth } — persiste en AsyncStorage
  const [dayMap, setDayMap] = useState<Record<string, number>>({});

  // Estado de pagos: solo aplica al mes/año actual
  const [paidMap, setPaidMap] = useState<Record<string, boolean>>({});

  // Gastos extras personalizados
  const [extras, setExtras] = useState<FixedExpense[]>([]);

  // ── Cargar días guardados ────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setDayMap(JSON.parse(raw));
    });
  }, []);

  // ── Guardar días cuando cambian ──────────────────────
  const saveDayMap = useCallback(async (map: Record<string, number>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }, []);

  // ── Construir lista de gastos del mes visible ────────
  const baseExpenses: FixedExpense[] = seedExpenses && seedExpenses.length > 0
    ? seedExpenses.map(s => ({
        id: s.id, title: s.title, color: s.color,
        amount: s.amount, iconKey: s.iconKey,
        day: dayMap[s.id] ?? null,
        isPaid: paidMap[s.id] ?? false,
      }))
    : [
        { id: '1', title: 'Renta',    color: '#F4ACB7', amount: 800, day: dayMap['1'] ?? null, isPaid: paidMap['1'] ?? false, iconKey: 'home' as const },
        { id: '2', title: 'Agua',     color: '#85A89E', amount: 30,  day: dayMap['2'] ?? null, isPaid: paidMap['2'] ?? false, iconKey: 'droplet' as const },
        { id: '3', title: 'Luz',      color: '#F3C57C', amount: 45,  day: dayMap['3'] ?? null, isPaid: paidMap['3'] ?? false, iconKey: 'zap' as const },
        { id: '4', title: 'Internet', color: '#D977A0', amount: 60,  day: dayMap['4'] ?? null, isPaid: paidMap['4'] ?? false, iconKey: 'wifi' as const },
      ];

  const exps: FixedExpense[] = [
    ...baseExpenses,
    ...extras.map(e => ({ ...e, day: dayMap[e.id] ?? null, isPaid: paidMap[e.id] ?? false })),
  ];

  // ── Notificar cambios al padre ───────────────────────
  useEffect(() => {
    const isCurrentMonth =
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear();

    if (onTotalsChange) {
      const t = exps.reduce((a, e) => a + e.amount, 0);
      const p = isCurrentMonth ? exps.filter(e => e.isPaid).reduce((a, e) => a + e.amount, 0) : 0;
      onTotalsChange({ paid: p, total: t });
    }
    if (onExpensesChange) onExpensesChange(exps);
  }, [dayMap, paidMap, extras, viewDate]);

  // ── Helpers de calendario ────────────────────────────
  const ms  = startOfMonth(viewDate);
  const me  = endOfMonth(ms);
  const dim = eachDayOfInterval({ start: ms, end: me });
  const sdi = getDay(ms);
  const mn  = format(ms, 'MMMM yyyy', { locale: es });
  const isCurrentMonth =
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const efd = (d: number) => exps.filter(e => e.day === d);
  const unassigned = exps.filter(e => e.day === null);

  // ── Acciones ─────────────────────────────────────────
  const onDay = (d: number) => {
    if (pend) {
      const newMap = { ...dayMap, [pend.id]: d };
      setDayMap(newMap);
      saveDayMap(newMap);
      setPend(null); setSel(null);
    } else {
      setSel(d === sel ? null : d);
    }
  };

  const onExpPress = (e: FixedExpense) => {
    if (e.day === null) {
      setPend(e);
    } else {
      const actions: any[] = [];
      // Solo permitir marcar como pagado en el mes actual
      if (isCurrentMonth) {
        actions.push({
          text: e.isPaid ? '↩ Marcar pendiente' : '✓ Marcar como pagado',
          onPress: () => setPaidMap(p => ({ ...p, [e.id]: !e.isPaid })),
        });
      }
      actions.push({
        text: 'Cambiar día',
        onPress: () => { setPend(e); setSel(null); },
      });
      actions.push({
        text: 'Eliminar',
        style: 'destructive' as const,
        onPress: () => {
          const newMap = { ...dayMap };
          delete newMap[e.id];
          setDayMap(newMap);
          saveDayMap(newMap);
          if (extras.some(x => x.id === e.id)) {
            setExtras(p => p.filter(x => x.id !== e.id));
          }
        },
      });
      actions.push({ text: 'Cancelar', style: 'cancel' as const });
      Alert.alert(
        e.title,
        `$${e.amount.toLocaleString('es-MX')} · Día ${e.day} de cada mes`,
        actions
      );
    }
  };

  const handleAddExpense = () => {
    if (!newTitle.trim() || !newAmount.trim()) return;
    const amount = Number(newAmount) || 0;
    if (amount <= 0) return;
    const colorIdx = exps.length % COLORS_LIST.length;
    const newExp: FixedExpense = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim(),
      color: COLORS_LIST[colorIdx],
      amount, day: null, isPaid: false,
      iconKey: newIcon,
    };
    setExtras(p => [...p, newExp]);
    setNewTitle(''); setNewAmount(''); setNewIcon('home'); setShowAdd(false);
  };

  // ── Render ────────────────────────────────────────────
  return (
    <View style={s.c}>

      {/* Instrucción / estado */}
      <View style={s.tr}>
        <View style={s.th}>
          <TomasaSVG size={32} />
          <Text style={s.tt}>
            {pend
              ? `Toca el día en que pagas "${pend.title}" cada mes 📅`
              : unassigned.length > 0
                ? `Tienes ${unassigned.length} gasto${unassigned.length > 1 ? 's' : ''} sin fecha. ¡Toca una burbuja y asígnala! 🌸`
                : '¡Todo asignado! Los días se repiten cada mes automáticamente ✅'}
          </Text>
        </View>

        {/* Burbujas sin asignar */}
        {unassigned.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.ch}>
              {unassigned.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={[s.cp, { backgroundColor: e.color + (pend?.id === e.id ? 'FF' : '33'), borderColor: e.color }]}
                  onPress={() => onExpPress(e)}
                >
                  <Ionicons name={IM[e.iconKey]} size={14} color={pend?.id === e.id ? '#fff' : e.color} />
                  <Text style={[s.ct, { color: pend?.id === e.id ? '#fff' : e.color }]}>{e.title}</Text>
                  <Text style={[s.ca, { color: pend?.id === e.id ? '#ffffffCC' : e.color + 'CC' }]}>${e.amount.toLocaleString('es-MX')}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Botón agregar */}
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add-circle" size={16} color="#F4ACB7" />
          <Text style={s.addTxt}>Agregar gasto fijo</Text>
        </TouchableOpacity>
      </View>

      {/* Navegación de meses */}
      <View style={s.navRow}>
        <TouchableOpacity style={s.navBtn} onPress={() => { setViewDate(d => subMonths(d, 1)); setSel(null); }}>
          <Ionicons name="chevron-back" size={18} color="#F4ACB7" />
        </TouchableOpacity>
        <Text style={s.mn}>{mn.charAt(0).toUpperCase() + mn.slice(1)}</Text>
        <TouchableOpacity style={s.navBtn} onPress={() => { setViewDate(d => addMonths(d, 1)); setSel(null); }}>
          <Ionicons name="chevron-forward" size={18} color="#F4ACB7" />
        </TouchableOpacity>
      </View>

      {/* Badge mes actual */}
      {isCurrentMonth && (
        <View style={s.currentBadge}>
          <Ionicons name="ellipse" size={8} color="#85A89E" />
          <Text style={s.currentBadgeTxt}>Mes actual — puedes marcar pagados aquí</Text>
        </View>
      )}

      {/* Días de la semana */}
      <View style={s.wr}>
        {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => (
          <Text key={d} style={s.wd}>{d}</Text>
        ))}
      </View>

      {/* Grid del calendario */}
      <View style={s.gr}>
        {Array.from({ length: sdi }).map((_, i) => <View key={`ph${i}`} style={s.dc} />)}
        {dim.map(date => {
          const d = date.getDate();
          const dayExps = efd(d);
          const isSel = sel === d;
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <TouchableOpacity
              key={d}
              style={[s.dc, isSel && s.dcs, !!pend && s.dcp, isToday && s.dcToday]}
              onPress={() => onDay(d)}
            >
              <Text style={[s.dn, isSel && s.dns, isToday && s.dnToday]}>{d}</Text>
              <View style={s.dotsRow}>
                {dayExps.slice(0, 3).map(e => (
                  <TouchableOpacity key={e.id} onPress={() => onExpPress(e)}>
                    <View style={[s.ed, { backgroundColor: e.color, opacity: e.isPaid ? 0.35 : 1 }]}>
                      <Ionicons name={IM[e.iconKey]} size={7} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
                {dayExps.length > 3 && (
                  <Text style={s.moreExps}>+{dayExps.length - 3}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de gastos asignados */}
      {exps.filter(e => e.day !== null).length > 0 && (
        <View style={s.lg}>
          <Text style={s.lgTitle}>Gastos del mes</Text>
          {exps
            .filter(e => e.day !== null)
            .sort((a, b) => (a.day || 0) - (b.day || 0))
            .map(e => (
              <TouchableOpacity key={e.id} style={[s.li, e.isPaid && s.liPaid]} onPress={() => onExpPress(e)}>
                <View style={[s.ld, { backgroundColor: e.color, opacity: e.isPaid ? 0.4 : 1 }]} />
                <Text style={[s.ltit, e.isPaid && s.lpd]}>{e.title}</Text>
                <Text style={s.ldy}>día {e.day}</Text>
                <Text style={s.lam}>${e.amount.toLocaleString('es-MX')}</Text>
                {e.isPaid
                  ? <Ionicons name="checkmark-circle" size={16} color="#85A89E" />
                  : isCurrentMonth && e.day !== null && e.day <= today.getDate()
                    ? <View style={s.dueBadge}><Text style={s.dueTxt}>vence hoy</Text></View>
                    : null
                }
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Modal agregar gasto */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={s.mo}>
          <View style={s.mc}>
            <View style={s.mh}>
              <Text style={s.mtit}>Nuevo gasto fijo</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color="#9D8189" />
              </TouchableOpacity>
            </View>
            <Text style={s.mlbl}>Nombre</Text>
            <TextInput
              style={s.mi} value={newTitle} onChangeText={setNewTitle}
              placeholder="Ej. Teléfono, Gym, Seguro..." placeholderTextColor="#9D818960"
            />
            <Text style={s.mlbl}>Monto mensual</Text>
            <View style={s.mar}>
              <Text style={s.mds}>$</Text>
              <TextInput
                style={[s.mi, { flex: 1 }]} value={newAmount} onChangeText={setNewAmount}
                placeholder="0" keyboardType="numeric" placeholderTextColor="#9D818960"
              />
            </View>
            <Text style={s.mlbl}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {ICON_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.ico, newIcon === opt.key && s.icos]}
                    onPress={() => setNewIcon(opt.key)}
                  >
                    <Text style={[s.icot, newIcon === opt.key && s.icots]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[s.msb, (!newTitle.trim() || !newAmount.trim()) && { opacity: 0.4 }]}
              onPress={handleAddExpense}
              disabled={!newTitle.trim() || !newAmount.trim()}
            >
              <Ionicons name="add-circle" size={18} color="#fff" />
              <Text style={s.mst}>Agregar gasto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  c:   { gap: 12 },
  tr:  { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 12, gap: 10 },
  th:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tt:  { flex: 1, fontSize: 11, color: '#9D8189', lineHeight: 16 },
  ch:  { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  cp:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5 },
  ct:  { fontSize: 11, fontWeight: '700' },
  ca:  { fontSize: 10, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5, borderColor: '#F4ACB7', borderStyle: 'dashed', backgroundColor: '#FFCAD420', alignSelf: 'flex-start' },
  addTxt: { fontSize: 12, fontWeight: '700', color: '#F4ACB7' },
  // Navegación
  navRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  navBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFCAD430', alignItems: 'center', justifyContent: 'center' },
  mn:       { fontSize: 15, fontWeight: '800', color: '#9D8189', textAlign: 'center', flex: 1 },
  currentBadge:    { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  currentBadgeTxt: { fontSize: 11, color: '#85A89E', fontWeight: '600' },
  // Calendario
  wr: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  wd: { width: '14.28%', textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#9D8189', opacity: 0.5 },
  gr: { flexDirection: 'row', flexWrap: 'wrap' },
  dc: { width: '14.28%', aspectRatio: 0.7, alignItems: 'center', paddingTop: 4, gap: 2, borderRadius: 10 },
  dcs:     { backgroundColor: '#F4ACB744' },
  dcp:     { backgroundColor: '#D8E2DC44' },
  dcToday: { backgroundColor: '#FFCAD430', borderWidth: 1.5, borderColor: '#F4ACB7' },
  dn:      { fontSize: 12, fontWeight: '600', color: '#9D8189' },
  dns:     { color: '#F4ACB7', fontWeight: '800' },
  dnToday: { color: '#F4ACB7', fontWeight: '900' },
  dotsRow: { flexDirection: 'row', gap: 2, flexWrap: 'wrap', justifyContent: 'center' },
  ed:      { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  moreExps:{ fontSize: 8, color: '#9D8189', fontWeight: '800' },
  // Lista
  lg:      { gap: 6 },
  lgTitle: { fontSize: 11, fontWeight: '800', color: '#9D818970', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  li:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: 10 },
  liPaid:  { opacity: 0.6, backgroundColor: 'rgba(133,168,158,0.08)' },
  ld:      { width: 8, height: 8, borderRadius: 4 },
  ltit:    { flex: 1, fontSize: 12, fontWeight: '700', color: '#9D8189' },
  lpd:     { textDecorationLine: 'line-through', opacity: 0.5 },
  ldy:     { fontSize: 11, color: '#9D8189', opacity: 0.6 },
  lam:     { fontSize: 12, fontWeight: '700', color: '#9D8189' },
  dueBadge:{ backgroundColor: '#FFCAD4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  dueTxt:  { fontSize: 9, fontWeight: '800', color: '#fff' },
  // Modal
  mo:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  mc:   { backgroundColor: '#FFF5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  mh:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  mtit: { fontSize: 18, fontWeight: '800', color: '#9D8189' },
  mlbl: { fontSize: 11, fontWeight: '700', color: '#9D8189', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  mi:   { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontWeight: '600', color: '#9D8189', marginBottom: 16, borderWidth: 1, borderColor: '#FFCAD460' },
  mar:  { flexDirection: 'row', alignItems: 'center' },
  mds:  { fontSize: 18, fontWeight: '700', color: '#F4ACB7', marginRight: 8 },
  ico:  { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#FFCAD460' },
  icos: { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' },
  icot: { fontSize: 12, fontWeight: '600', color: '#9D8189' },
  icots:{ color: '#fff' },
  msb:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F4ACB7', borderRadius: 16, paddingVertical: 14 },
  mst:  { fontSize: 15, fontWeight: '700', color: '#fff' },
});
