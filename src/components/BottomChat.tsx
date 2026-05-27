import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Easing, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, NEEDS_KEYWORDS, WANTS_KEYWORDS } from '../constants';
import { IncomeAllocationModal } from './IncomeModal';
import type { Allocation } from '../types';

/* ─────────────────────────────────────────────────
   NLP mejorado: parser de lenguaje natural
   ───────────────────────────────────────────────── */

interface ParsedMessage {
  type: 'income' | 'expense' | 'query' | 'unknown';
  amount: number;
  category: 'needs' | 'wants';
  label: string;
  confidence: number;
}

function parseAmount(msg: string): number {
  // Soporta: $5000, 5000, 5,000, 5.000, 5k, 5mil
  const cleaned = msg.replace(/,/g, '');
  // "5k" o "5K"
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  // "5mil" o "5 mil"
  const milMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*mil/i);
  if (milMatch) return parseFloat(milMatch[1]) * 1000;
  // Número normal (toma el más grande si hay varios)
  const nums = cleaned.match(/\d+(?:\.\d+)?/g);
  if (nums && nums.length > 0) {
    return Math.max(...nums.map(n => parseFloat(n)));
  }
  return 0;
}

function detectIntent(msg: string): 'income' | 'expense' | 'query' | 'unknown' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Ingreso
  const incomeWords = ['recibi', 'sueldo', 'ingreso', 'cobre', 'me pagaron', 'me depositaron', 'me llego', 'gane', 'bono', 'quincena', 'nomina', 'freelance', 'venta', 'me transfirieron'];
  if (msg.startsWith('+') || incomeWords.some(w => m.includes(w))) return 'income';
  // Gasto
  const expenseWords = ['gaste', 'pague', 'compre', 'me costo', 'me cobro', 'pedi', 'fui a', 'comi en', 'tome un', 'uber', 'taxi', 'didi', 'cafe', 'comida', 'cena', 'almuerzo', 'desayuno'];
  if (msg.startsWith('-') || expenseWords.some(w => m.includes(w))) return 'expense';
  // Consulta
  const queryWords = ['cuanto', 'tengo', 'balance', 'saldo', 'como voy', 'resumen', 'cuanto me queda', 'cuanto llevo'];
  if (queryWords.some(w => m.includes(w))) return 'query';
  // Si tiene número, asumir gasto
  if (parseAmount(msg) > 0) return 'expense';
  return 'unknown';
}

function detectCategory(msg: string): 'needs' | 'wants' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Necesidades (más exhaustivo)
  const needs = [...NEEDS_KEYWORDS, 'doctor', 'medicina', 'hospital', 'dentista', 'escuela', 'universidad', 'seguro', 'celular', 'telefono', 'mandado', 'leche', 'pan', 'huevo', 'tortilla', 'pollo', 'carne', 'verdura', 'fruta'];
  if (needs.some(k => m.includes(k))) return 'needs';
  // Gustos
  const wants = [...WANTS_KEYWORDS, 'antojo', 'capricho', 'salida', 'vacaciones', 'viaje', 'juego', 'videojuego', 'zapatos', 'maquillaje', 'starbucks', 'oxxo', 'cerveza', 'vino', 'fiesta', 'concierto', 'cine'];
  if (wants.some(k => m.includes(k))) return 'wants';
  return 'wants'; // default
}

function extractLabel(msg: string): string {
  // Quitar signos +/- y montos para dejar solo la descripción
  let label = msg.replace(/^[+\-]\s*/, '').replace(/\$?\d+[\d,.kK]*(mil)?/g, '').trim();
  // Si queda muy corto, usar el mensaje original
  if (label.length < 2) label = msg;
  // Capitalizar primera letra
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function parseMessage(msg: string): ParsedMessage {
  const amount = parseAmount(msg);
  const type = detectIntent(msg);
  const category = detectCategory(msg);
  const label = extractLabel(msg);
  const confidence = amount > 0 && type !== 'unknown' ? 0.9 : amount > 0 ? 0.6 : 0.3;
  return { type, amount, category, label, confidence };
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
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animación de pulso para grabación de voz
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

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
      const parsed = parseMessage(msg);

      if (parsed.amount <= 0 && parsed.type !== 'query') {
        showFeedback('🤔 No entendí el monto. Intenta algo como "Gasté $200 en super" o "Recibí $5000 de sueldo"');
        return;
      }

      switch (parsed.type) {
        case 'income':
          setIncomeAmount(parsed.amount);
          setShowModal(true);
          break;
        case 'expense':
          if (onExpenseAdded) {
            onExpenseAdded(parsed.amount, parsed.category, parsed.label);
            const catLabel = parsed.category === 'needs' ? '📋 Necesidad' : '🎉 Gusto';
            showFeedback(`✅ ${catLabel}: ${parsed.label} · $${parsed.amount.toLocaleString('es-MX')}`);
          }
          break;
        case 'query':
          showFeedback(`💰 Balance: $${totalBalance.toLocaleString('es-MX')} · Necesidades: $${currentNeeds.toLocaleString('es-MX')}`);
          break;
        default:
          showFeedback('🤔 No entendí. Prueba: "Gasté $200 en super" o "Recibí mi quincena de $5000"');
      }
    }, 800);
  };

  /* ─── Grabación de voz ─── */
  const handleVoicePress = async () => {
    if (isRecording) {
      // Detener grabación
      setIsRecording(false);
      // TODO: Integrar con API de Speech-to-Text
      // 1. Detener la grabación de expo-av
      // 2. Enviar el audio a Whisper API (OpenAI) o Google STT
      // 3. Insertar la transcripción en el TextInput
      // Por ahora, mostrar mensaje informativo:
      Alert.alert(
        '🎙️ Voz (próximamente)',
        'Para activar comandos por voz necesitas:\n\n1. Instalar expo-av\n2. Configurar una API de Speech-to-Text (Whisper de OpenAI recomendado)\n\nVer instrucciones en el README.',
        [{ text: 'Entendido' }]
      );
      return;
    }
    // Iniciar grabación
    setIsRecording(true);
    // Simular grabación por 3 segundos
    setTimeout(() => {
      if (isRecording) setIsRecording(false);
    }, 5000);

    Alert.alert(
      '🎙️ Voz (próximamente)',
      'Para activar comandos por voz necesitas:\n\n1. Instalar expo-av\n2. Configurar una API de Speech-to-Text (Whisper de OpenAI recomendado)\n\nVer instrucciones en el README.',
      [{ text: 'Entendido' }]
    );
    setIsRecording(false);
  };

  return (
    <View style={st.w}>
      <IncomeAllocationModal
        isOpen={showModal} onClose={() => setShowModal(false)}
        amount={incomeAmount}
        onConfirm={(alloc) => onIncomeAdded?.(incomeAmount, alloc)}
        currentNeeds={currentNeeds} currentWants={currentWants}
        currentSavings={currentSavings} totalBalance={totalBalance}
      />

      {/* Feedback de Tomasa */}
      {feedback && (
        <View style={st.fb}>
          <Text style={st.fbt}>{feedback}</Text>
        </View>
      )}

      {/* Indicador de procesamiento */}
      {isTyping && (
        <View style={st.ty}>
          <View style={st.ds}>
            <View style={[st.d, { backgroundColor: COLORS.ROSA }]} />
            <View style={[st.d, { backgroundColor: COLORS.ROSA_CLARO }]} />
            <View style={[st.d, { backgroundColor: COLORS.MENTA }]} />
          </View>
          <Text style={st.tyt}>Tomasa está calculando...</Text>
        </View>
      )}

      {/* Chips rápidos */}
      {isFocused && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.cs} contentContainerStyle={st.cc} keyboardShouldPersistTaps="always">
          {CHIPS.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[st.cp, c.type === 'income' ? st.ci : st.ce]}
              onPress={() => { setText(c.label); inputRef.current?.focus(); }}
            >
              <Text style={c.type === 'income' ? st.cit : st.cet}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Barra de input */}
      <View style={st.b}>
        {/* Botón de voz */}
        <TouchableOpacity style={st.m} onPress={handleVoicePress} activeOpacity={0.6}>
          <Animated.View style={[st.micWrap, isRecording && st.micRec, { transform: [{ scale: isRecording ? pulseAnim : 1 }] }]}>
            <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={20} color={isRecording ? '#fff' : COLORS.ROSA} />
          </Animated.View>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={st.i}
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={handleSend}
          placeholder="Ej. Recibí $5000..."
          placeholderTextColor={COLORS.MALVA + '80'}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[st.s, !text.trim() && { opacity: 0.3 }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color={COLORS.ROSA} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  w: { gap: 0 },
  // Feedback
  fb: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: 12, elevation: 3, borderWidth: 1, borderColor: '#FFCAD460' },
  fbt: { fontSize: 13, fontWeight: '600', color: '#9D8189', lineHeight: 18 },
  // Typing indicator
  ty: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 16, padding: 12, gap: 8, elevation: 3 },
  ds: { flexDirection: 'row', gap: 6 },
  d: { width: 8, height: 8, borderRadius: 4 },
  tyt: { fontSize: 12, fontWeight: '600', color: '#9D8189' },
  // Chips
  cs: { maxHeight: 44 },
  cc: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, alignItems: 'center' },
  cp: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  ci: { backgroundColor: '#FFCAD444', borderColor: '#FFCAD4' },
  ce: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#fff' },
  cit: { fontSize: 12, fontWeight: '700', color: '#F4ACB7' },
  cet: { fontSize: 12, fontWeight: '700', color: '#9D8189' },
  // Bottom bar
  b: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  m: { padding: 4 },
  micWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFCAD430' },
  micRec: { backgroundColor: '#F4ACB7' },
  i: { flex: 1, fontSize: 14, fontWeight: '500', color: '#9D8189', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, elevation: 2 },
  s: { padding: 4 },
});
