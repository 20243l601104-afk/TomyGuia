import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TomasaSVG } from './TomasaSVG';
import type { Allocation } from '../types';

const C = { ROSA: '#F4ACB7', CLARO: '#FFCAD4', MELON: '#FFE5D9', MALVA: '#9D8189', VERDE: '#5B776F', VCLARO: '#85A89E', AMARILLO: '#F3C57C' };

const r10 = (n: number) => Math.max(0, Math.round(n / 10) * 10);

function sug(amt: number, bal: number, cur: Allocation): Allocation {
  if (amt <= 0) return { needs: 0, wants: 0, savings: 0 };
  const nb = bal + amt;
  const gN = Math.max(0, nb * .5 - cur.needs);
  const gW = Math.max(0, nb * .3 - cur.wants);
  const gS = Math.max(0, nb * .2 - cur.savings);
  const tot = gN + gW + gS;
  let n: number, w: number, sv: number;
  if (tot <= 0) { n = amt * .5; w = amt * .3; sv = amt * .2; }
  else { n = (gN / tot) * amt; w = (gW / tot) * amt; sv = (gS / tot) * amt; }
  const rN = r10(n), rW = r10(w), rS = r10(sv);
  const diff = amt - rN - rW - rS;
  const res = { needs: rN, wants: rW, savings: rS };
  if (diff !== 0) {
    const big = (Object.keys(res) as (keyof Allocation)[]).reduce((a, b) => res[a] >= res[b] ? a : b);
    res[big] = Math.max(0, res[big] + diff);
  }
  return res;
}

interface Props {
  isOpen: boolean; onClose: () => void; amount: number;
  onConfirm: (a: Allocation) => void;
  currentNeeds: number; currentWants: number; currentSavings: number; totalBalance: number;
}

export function IncomeAllocationModal({ isOpen, onClose, amount, onConfirm, currentNeeds, currentWants, currentSavings, totalBalance }: Props) {
  const sugg = useMemo(() => sug(amount, totalBalance, { needs: currentNeeds, wants: currentWants, savings: currentSavings }), [amount, totalBalance, currentNeeds, currentWants, currentSavings]);
  const [alloc, setAlloc] = useState<Allocation>(sugg);
  useEffect(() => { if (isOpen) setAlloc(sugg); }, [isOpen]);

  const assigned = alloc.needs + alloc.wants + alloc.savings;
  const remaining = amount - assigned;
  const isValid = assigned === amount && amount > 0;
  const pct = (n: number) => amount > 0 ? Math.round((n / amount) * 100) : 0;

  const tip = useMemo(() => {
    if (amount <= 0) return '';
    const nb = totalBalance + amount;
    const gN = nb * .5 - currentNeeds, gW = nb * .3 - currentWants, gS = nb * .2 - currentSavings;
    const m = Math.max(gN, gW, gS);
    if (m <= 0) return '¡Vas increíble! Sugiero el reparto 50/30/20.';
    if (m === gN) return 'Tus necesidades están bajitas: refuerza ahí.';
    if (m === gS) return 'Tu ahorro va atrás: buen momento para empujarlo.';
    return 'Tu cajón de gustos está bajito: ¡date un gusto!';
  }, [amount, totalBalance, currentNeeds, currentWants, currentSavings]);

  const adj = (key: keyof Allocation, delta: number) => {
    setAlloc(prev => {
      const nv = Math.max(0, Math.min(amount, prev[key] + delta));
      const oth = (Object.keys(prev) as (keyof Allocation)[]).filter(k => k !== key);
      const os = oth.reduce((a, k) => a + prev[k], 0);
      const lft = amount - nv;
      const nx: Allocation = { ...prev, [key]: nv };
      if (os <= 0) { nx[oth[0]] = Math.floor(lft / 2); nx[oth[1]] = lft - nx[oth[0]]; }
      else {
        oth.forEach((k, i) => {
          if (i === oth.length - 1) { nx[k] = Math.max(0, lft - oth.slice(0, i).reduce((a, kk) => a + nx[kk], 0)); }
          else { nx[k] = Math.max(0, Math.round((prev[k] / os) * lft)); }
        });
      }
      return nx;
    });
  };

  /* ─── ORDEN Y COLORES CORRECTOS ───
     1. Necesidades → Rosa (#F4ACB7) — 50%
     2. Gustos     → Amarillo (#F3C57C) — 30%
     3. Futuro     → Verde (#85A89E) — 20%
  */
  const BK = [
    { key: 'needs' as keyof Allocation, label: 'Necesidades', hint: 'Gastos fijos y recibos', icon: 'receipt-outline', color: C.ROSA, textColor: C.ROSA, pctLabel: '50%' },
    { key: 'wants' as keyof Allocation, label: 'Gustos', hint: 'Tu dinero libre de culpa', icon: 'sunny-outline', color: C.AMARILLO, textColor: '#B58A3A', pctLabel: '30%' },
    { key: 'savings' as keyof Allocation, label: 'Futuro', hint: 'Fondo de emergencia y metas', icon: 'shield-checkmark-outline', color: C.VCLARO, textColor: C.VERDE, pctLabel: '20%' },
  ];

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={st.ov} activeOpacity={1} onPress={onClose} />
      <View style={st.sh}>
        <View style={st.hd} />
        <Text style={st.ti}>¡Llegó dinero!</Text>
        <Text style={st.su}>Ingreso: <Text style={st.hi}>+${amount.toLocaleString('es-MX')}</Text></Text>

        {/* Tip de Tomasa */}
        <View style={st.tr}>
          <View style={st.tc}><TomasaSVG size={40} floating={false} /></View>
          <View style={st.tb}><Text style={st.ttt}>✨ {tip}</Text></View>
        </View>

        {/* Barra visual con colores correctos */}
        <View style={st.bc}>
          <View style={st.br}>
            <View style={[st.bs, { flex: Math.max(pct(alloc.needs), 1), backgroundColor: C.ROSA }]} />
            <View style={[st.bs, { flex: Math.max(pct(alloc.wants), 1), backgroundColor: C.AMARILLO }]} />
            <View style={[st.bs, { flex: Math.max(pct(alloc.savings), 1), backgroundColor: C.VCLARO }]} />
          </View>
          <View style={st.bl}>
            {BK.map(b => (
              <View key={b.key} style={st.blc}>
                <Text style={[st.blt, { color: b.textColor }]}>{b.label}</Text>
                <Text style={[st.bla, { color: b.textColor }]}>${alloc[b.key].toLocaleString('es-MX')}</Text>
                <Text style={st.blp}>{pct(alloc[b.key])}% · {b.pctLabel}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Sliders de ajuste con colores correctos */}
        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
          {BK.map(b => (
            <View key={b.key} style={st.sc}>
              <View style={[st.si, { backgroundColor: b.color }]}>
                <Ionicons name={b.icon as any} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={st.stt}>
                  <Text style={st.sl}>{b.label}</Text>
                  <Text style={[st.sa, { color: b.textColor }]}>${alloc[b.key].toLocaleString('es-MX')}</Text>
                </View>
                <Text style={st.sh2}>{b.hint}</Text>
                <View style={st.ar}>
                  {[-100, -10, 10, 100].map(d => (
                    <TouchableOpacity key={d} style={[st.ab, { backgroundColor: b.color + '20', borderColor: b.color + '40' }]} onPress={() => adj(b.key, d)}>
                      <Text style={[st.at, { color: b.textColor }]}>{d > 0 ? `+$${d}` : `-$${Math.abs(d)}`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {remaining !== 0 && <Text style={st.rm}>{remaining > 0 ? `Faltan $${remaining.toLocaleString('es-MX')}` : `Pasaste $${Math.abs(remaining).toLocaleString('es-MX')}`}</Text>}

        <TouchableOpacity style={[st.cb, !isValid && st.cd]} disabled={!isValid} onPress={() => { onConfirm(alloc); onClose(); }}>
          <Ionicons name="checkmark" size={20} color="#fff" /><Text style={st.cbt}>Confirmar distribución</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.rb} onPress={() => setAlloc(sugg)}>
          <Ionicons name="refresh-outline" size={14} color={C.ROSA} /><Text style={st.rt}>Restaurar sugerencia</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  ov: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sh: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.98)', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, elevation: 20 },
  hd: { width: 48, height: 5, backgroundColor: '#D8E2DC', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  ti: { fontSize: 22, fontWeight: '800', color: '#F4ACB7', textAlign: 'center', marginBottom: 4 },
  su: { fontSize: 13, color: '#9D8189', textAlign: 'center', opacity: 0.7, marginBottom: 16 },
  hi: { color: '#F4ACB7', fontWeight: '700' },
  tr: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  tc: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFCAD4', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', elevation: 4 },
  tb: { flex: 1, backgroundColor: '#FFE5D980', borderRadius: 16, borderTopLeftRadius: 4, padding: 10 },
  ttt: { fontSize: 12, color: '#9D8189', fontWeight: '500', lineHeight: 18 },
  bc: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 14, marginBottom: 12 },
  br: { flexDirection: 'row', height: 14, borderRadius: 99, overflow: 'hidden', marginBottom: 10, gap: 2 },
  bs: { height: '100%', borderRadius: 99 },
  bl: { flexDirection: 'row', justifyContent: 'space-between' },
  blc: { alignItems: 'center', flex: 1 },
  blt: { fontSize: 10, fontWeight: '700' },
  bla: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  blp: { fontSize: 9, color: '#9D8189', opacity: 0.6 },
  sc: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12, marginBottom: 8 },
  si: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sl: { fontSize: 13, fontWeight: '700', color: '#9D8189' },
  sa: { fontSize: 14, fontWeight: '800' },
  sh2: { fontSize: 10, color: '#9D8189', opacity: 0.6, marginBottom: 8 },
  ar: { flexDirection: 'row', gap: 6 },
  ab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  at: { fontSize: 11, fontWeight: '700' },
  rm: { fontSize: 12, fontWeight: '700', color: '#F4ACB7', textAlign: 'center', marginBottom: 8 },
  cb: { backgroundColor: '#F4ACB7', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, elevation: 6 },
  cd: { backgroundColor: '#FFE5D9', elevation: 0 },
  cbt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  rb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  rt: { fontSize: 12, fontWeight: '700', color: '#F4ACB7' },
});
