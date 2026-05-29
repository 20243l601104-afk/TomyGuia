import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, NEEDS_KEYWORDS, WANTS_KEYWORDS } from '../constants';
import { IncomeAllocationModal } from './IncomeModal';
import type { Allocation } from '../types';

/* ─────────────────────────────────────────────────
   NLP mejorado: parser de lenguaje natural
   ───────────────────────────────────────────────── */

function parseAmount(msg: string): number {
  const cleaned = msg.replace(/,/g, '');
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  const milMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*mil/i);
  if (milMatch) return parseFloat(milMatch[1]) * 1000;
  const nums = cleaned.match(/\d+(?:\.\d+)?/g);
  if (nums && nums.length > 0) return Math.max(...nums.map(n => parseFloat(n)));
  return 0;
}

function detectIntent(msg: string): 'income' | 'expense' | 'query' | 'unknown' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const incomeWords = ['recibi', 'sueldo', 'ingreso', 'cobre', 'me pagaron', 'me depositaron', 'me llego', 'gane', 'bono', 'quincena', 'nomina', 'freelance', 'venta', 'me transfirieron'];
  if (msg.startsWith('+') || incomeWords.some(w => m.includes(w))) return 'income';
  const expenseWords = ['gaste', 'pague', 'compre', 'me costo', 'me cobro', 'pedi', 'fui a', 'comi en', 'tome un', 'uber', 'taxi', 'didi', 'cafe', 'comida', 'cena', 'almuerzo', 'desayuno'];
  if (msg.startsWith('-') || expenseWords.some(w => m.includes(w))) return 'expense';
  const queryWords = ['cuanto', 'tengo', 'balance', 'saldo', 'como voy', 'resumen', 'cuanto me queda', 'cuanto llevo'];
  if (queryWords.some(w => m.includes(w))) return 'query';
  if (parseAmount(msg) > 0) return 'expense';
  return 'unknown';
}

function detectCategory(msg: string): 'needs' | 'wants' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const needs = [...NEEDS_KEYWORDS, 'doctor', 'medicina', 'hospital', 'dentista', 'escuela', 'universidad', 'seguro', 'celular', 'telefono', 'mandado', 'leche', 'pan', 'huevo', 'tortilla', 'pollo', 'carne', 'verdura', 'fruta'];
  if (needs.some(k => m.includes(k))) return 'needs';
  const wants = [...WANTS_KEYWORDS, 'antojo', 'capricho', 'salida', 'vacaciones', 'viaje', 'juego', 'videojuego', 'zapatos', 'maquillaje', 'starbucks', 'oxxo', 'cerveza', 'vino', 'fiesta', 'concierto'];
  if (wants.some(k => m.includes(k))) return 'wants';
  return 'wants';
}

function extractLabel(msg: string): string {
  let label = msg.replace(/^[+\-]\s*/, '').replace(/\$?\d+[\d,.kK]*(mil)?/g, '').trim();
  if (label.length < 2) label = msg;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/* ─────────────────────────────────────────────────
   Componente BottomChat
   ───────────────────────────────────────────────── */

interface Props {
  onIncomeAdded?: (amount: number, allocation: Allocation) => void;
  onExpenseAdded?: (amount: number, category: 'needs' | 'wants', label: string) => void;
  currentNeeds: number; currentWants: number; currentSavings: number; totalBalance: number;
}

const CHIPS = [
  { label: '+ $5000 Sueldo', type: 'income' },
  { label: '- $80 Café', type: 'expense' },
  { label: '- $150 Transporte', type: 'expense' },
  { label: '+ $100 Venta', type: 'income' },
];

export function BottomChat({ onIncomeAdded, onExpenseAdded, currentNeeds, currentWants, currentSavings, totalBalance }: Props) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    setIsFocused(false);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const amount = parseAmount(msg);
      const intent = detectIntent(msg);

      if (amount <= 0 && intent !== 'query') {
        showFeedback('🤔 No entendí el monto. Intenta: "Gasté $200 en super" o "Recibí $5000"');
        return;
      }

      switch (intent) {
        case 'income':
          setIncomeAmount(amount);
          setShowModal(true);
          break;
        case 'expense':
          if (onExpenseAdded) {
            const cat = detectCategory(msg);
            const label = extractLabel(msg);
            onExpenseAdded(amount, cat, label);
            const catLabel = cat === 'needs' ? '📋 Necesidad' : '🎉 Gusto';
            showFeedback(`✅ ${catLabel}: ${label} · $${amount.toLocaleString('es-MX')}`);
          }
          break;
        case 'query':
          showFeedback(`💰 Balance: $${totalBalance.toLocaleString('es-MX')} · Necesidades: $${currentNeeds.toLocaleString('es-MX')}`);
          break;
        default:
          showFeedback('🤔 No entendí. Prueba: "Gasté $200 en super" o "Recibí 5k de sueldo"');
      }
    }, 800);
  };

  const handleVoicePress = () => {
    Alert.alert(
      '🎙️ Comandos por voz',
      'Para activar voz necesitas:\n\n1. Instalar expo-av\n2. Configurar Whisper API (OpenAI)\n\nPor ahora usa el teclado o los chips rápidos.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <View style={s.w}>
      <IncomeAllocationModal
        isOpen={showModal} onClose={() => setShowModal(false)}
        amount={incomeAmount}
        onConfirm={(alloc) => onIncomeAdded?.(incomeAmount, alloc)}
        currentNeeds={currentNeeds} currentWants={currentWants}
        currentSavings={currentSavings} totalBalance={totalBalance}
      />

      {feedback && (
        <View style={s.fb}>
          <Text style={s.fbt}>{feedback}</Text>
        </View>
      )}

      {isTyping && (
        <View style={s.ty}>
          <View style={s.ds}>
            <View style={[s.d, { backgroundColor: COLORS.ROSA }]} />
            <View style={[s.d, { backgroundColor: COLORS.ROSA_CLARO }]} />
            <View style={[s.d, { backgroundColor: COLORS.MENTA }]} />
          </View>
          <Text style={s.tt}>Tomasa está calculando...</Text>
        </View>
      )}

      {isFocused && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cs} contentContainerStyle={s.cc} keyboardShouldPersistTaps="always">
          {CHIPS.map((c, i) => (
            <TouchableOpacity key={i} style={[s.cp, c.type === 'income' ? s.ci : s.ce]} onPress={() => { setText(c.label); inputRef.current?.focus(); }}>
              <Text style={c.type === 'income' ? s.cit : s.cet}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={s.b}>
        <TouchableOpacity style={s.m} onPress={handleVoicePress} activeOpacity={0.6}>
          <View style={[s.mw, isRecording && s.mr]}>
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={20} color={isRecording ? '#fff' : COLORS.ROSA} />
          </View>
        </TouchableOpacity>
        <TextInput
          ref={inputRef} style={s.i} value={text} onChangeText={setText}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          placeholder="Ej. Recibí $5000..." placeholderTextColor={COLORS.MALVA + '80'}
          returnKeyType="send"
        />
        <TouchableOpacity style={[s.sn, !text.trim() && { opacity: 0.3 }]} onPress={handleSend} disabled={!text.trim()}>
          <Ionicons name="send" size={20} color={COLORS.ROSA} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  w: { gap: 0 },
  fb: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, elevation: 3, borderWidth: 1, borderColor: '#FFCAD460' },
  fbt: { fontSize: 13, fontWeight: '600', color: '#9D8189', lineHeight: 18 },
  ty: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 12, gap: 8, elevation: 3 },
  ds: { flexDirection: 'row', gap: 6 },
  d: { width: 8, height: 8, borderRadius: 4 },
  tt: { fontSize: 12, fontWeight: '600', color: '#9D8189' },
  cs: { maxHeight: 44 },
  cc: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, alignItems: 'center' },
  cp: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  ci: { backgroundColor: '#FFCAD444', borderColor: '#FFCAD4' },
  ce: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#fff' },
  cit: { fontSize: 12, fontWeight: '700', color: '#F4ACB7' },
  cet: { fontSize: 12, fontWeight: '700', color: '#9D8189' },
  b: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  m: { padding: 4 },
  mw: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFCAD430' },
  mr: { backgroundColor: '#F4ACB7' },
  i: { flex: 1, fontSize: 14, fontWeight: '500', color: '#9D8189', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, elevation: 2 },
  sn: { padding: 4 },
});
