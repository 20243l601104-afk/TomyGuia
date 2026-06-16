import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, NEEDS_KEYWORDS, WANTS_KEYWORDS } from '../constants';
import { STT_API_KEY, STT_URL, GEMINI_API_KEY, GEMINI_API_URL } from '../constants/apiConfig';
import { IncomeAllocationModal } from './IncomeModal';
import type { Allocation, FixedExpenseSeed } from '../types';

/* ─── Diccionario de números en letras ─── */
const NUMEROS: Record<string, number> = {
  cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintisei: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
  treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, cientos: 100, ciento: 100,
  doscientos: 200, trescientos: 300, cuatrocientos: 400, quinientos: 500,
  seiscientos: 600, setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000, millon: 1000000,
};

function parseWrittenNumber(text: string): number {
  const m = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  if (NUMEROS[m]) return NUMEROS[m];
  let total = 0;
  for (const palabra of m.split(/[\s\-y]+/)) {
    const n = NUMEROS[palabra.trim()];
    if (n !== undefined) total = n >= 1000 ? total * n : total + n;
  }
  return total;
}

function parseAmount(msg: string): number {
  const cleaned = msg.replace(/,/g, '');
  const kMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[kK]/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;
  const milMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*mil/i);
  if (milMatch) return parseFloat(milMatch[1]) * 1000;
  const nums = cleaned.match(/\d+(?:\.\d+)?/g);
  if (nums) return Math.max(...nums.map(Number));
  const palabrasMatch = msg.match(/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|cientos|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil|millon)\b/gi);
  if (palabrasMatch) return parseWrittenNumber(palabrasMatch.join(' '));
  return 0;
}

function detectIntent(msg: string): 'income' | 'expense' | 'bill' | 'query' | 'unknown' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (msg.startsWith('+') || ['recibi','sueldo','ingreso','cobre','me pagaron','me depositaron','gane','bono','quincena','nomina','freelance'].some(w => m.includes(w))) return 'income';
  if (['pague','ya pague','abone','cubri'].some(w => m.includes(w))) return 'bill';
  if (msg.startsWith('-') || ['gaste','compre','me costo','me cobro','pedi','fui a','comi','uber','taxi','didi','cafe','comida','cena'].some(w => m.includes(w))) return 'expense';
  if (['cuanto','tengo','balance','saldo','como voy','resumen'].some(w => m.includes(w))) return 'query';
  if (parseAmount(msg) > 0) return 'expense';
  return 'unknown';
}

function detectCategory(msg: string): 'needs' | 'wants' {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const needs = [...NEEDS_KEYWORDS, 'doctor','medicina','hospital','dentista','escuela','seguro','celular','mandado','leche','pan','huevo','tortilla','pollo','carne','verdura','fruta'];
  return needs.some(k => m.includes(k)) ? 'needs' : 'wants';
}

function extractLabel(msg: string): string {
  let label = msg.replace(/^[+\-]\s*/, '').replace(/\$?\d+[\d,.kK]*(mil)?/g, '').replace(/\b(cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veintiuno|veintidos|veintitres|veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien|ciento|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|mil|millon)\b/gi, '').trim();
  if (label.length < 2) label = msg;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const BILL_ALIASES: Record<string, string[]> = {
  rent: ['renta','alquiler'], water: ['agua'], light: ['luz','cfe'],
  internet: ['internet','wifi','telmex','izzi'], gas: ['gasolina','gas'],
  transport: ['transporte','camion'], food: ['despensa','super','mandado'],
  subs: ['netflix','spotify','streaming'],
};

function detectBill(msg: string, fixedExpenses: FixedExpenseSeed[]): FixedExpenseSeed | null {
  const m = msg.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const exp of fixedExpenses) {
    if (m.includes(exp.title.toLowerCase())) return exp;
    if (BILL_ALIASES[exp.id]?.some(a => m.includes(a))) return exp;
  }
  return null;
}

interface Props {
  onIncomeAdded?: (amount: number, allocation: Allocation) => void;
  onExpenseAdded?: (amount: number, category: 'needs' | 'wants', label: string) => void;
  onBillPaid?: (expenseId: string, title: string, amount: number) => void;
  fixedExpenses?: FixedExpenseSeed[];
  currentNeeds: number; currentWants: number; currentSavings: number; totalBalance: number;
  monthlyIncome?: number;
  userName?: string;
}

const CHIPS = [
  { label: '+ $5000 Sueldo', type: 'income' },
  { label: '- $80 Cafe', type: 'expense' },
  { label: '- $150 Transporte', type: 'expense' },
  { label: '+ $100 Venta', type: 'income' },
];

export function BottomChat({ onIncomeAdded, onExpenseAdded, onBillPaid, fixedExpenses = [], currentNeeds, currentWants, currentSavings, totalBalance, monthlyIncome = 0, userName = '' }: Props) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // ── expo-audio (nuevo API) ──
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text.trim();
    setText(''); setIsFocused(false); setIsTyping(true);

    // Intentar primero con parser local (rapido, sin red)
    const amount = parseAmount(msg);
    const intent = detectIntent(msg);

    // Intents que no necesitan IA
    if (intent === 'income' && amount > 0) {
      setIsTyping(false);
      setIncomeAmount(amount); setShowModal(true);
      return;
    }
    if (intent === 'bill') {
      const bill = detectBill(msg, fixedExpenses);
      if (bill && onBillPaid) {
        const billAmount = amount > 0 ? amount : bill.amount;
        onBillPaid(bill.id, bill.title, billAmount);
        setIsTyping(false);
        showFeedback(`Pagaste ${bill.title}: $${billAmount.toLocaleString('es-MX')}`);
        return;
      }
    }
    if (intent === 'query') {
      setIsTyping(false);
      showFeedback(`Balance: $${totalBalance.toLocaleString('es-MX')} | Necesidades: $${currentNeeds.toLocaleString('es-MX')} | Gustos: $${currentWants.toLocaleString('es-MX')}`);
      return;
    }

    // Para gastos y mensajes ambiguos — usar Gemini para entender
    try {
      const contexto = `Saldo total: $${totalBalance.toLocaleString('es-MX')}. Presupuesto necesidades: $${currentNeeds.toLocaleString('es-MX')}. Presupuesto gustos: $${currentWants.toLocaleString('es-MX')}. Ahorro: $${currentSavings.toLocaleString('es-MX')}. Ingreso mensual: $${monthlyIncome.toLocaleString('es-MX')}.${userName ? ' Nombre: ' + userName + '.' : ''}`;

      const systemPrompt = 'Eres el asistente de finanzas de TomyGuia. Analiza el mensaje y responde SOLO con JSON valido sin markdown. Formato exacto: {"intent":"expense|income|bill|query|unknown","amount":0,"category":"needs|wants","label":"texto","feedback":"texto"} Contexto: ' + contexto + ' Reglas: intent expense=gasto, income=cobro, bill=recibo fijo, query=consulta saldo, unknown=otro. category needs=renta/comida/salud/transporte, wants=entretenimiento/ropa/lujos. label=1-3 palabras. feedback=frase corta sin emojis max 50 chars.';

      const res = await fetch(GEMINI_API_URL + '?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: msg }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.1 },
        }),
      });

      const data = await res.json();
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      setIsTyping(false);

      if (parsed.intent === 'expense' && parsed.amount > 0 && onExpenseAdded) {
        onExpenseAdded(parsed.amount, parsed.category || 'wants', parsed.label || msg);
        showFeedback(parsed.feedback || 'Registrado: $' + parsed.amount.toLocaleString('es-MX'));
      } else if (parsed.intent === 'income' && parsed.amount > 0) {
        setIncomeAmount(parsed.amount); setShowModal(true);
      } else if (parsed.intent === 'bill' && onBillPaid) {
        const bill = detectBill(msg, fixedExpenses);
        if (bill) {
          onBillPaid(bill.id, bill.title, parsed.amount || bill.amount);
          showFeedback(parsed.feedback || 'Pagado: ' + bill.title);
        } else if (parsed.amount > 0 && onExpenseAdded) {
          onExpenseAdded(parsed.amount, 'needs', parsed.label || msg);
          showFeedback(parsed.feedback || 'Necesidad registrada: $' + parsed.amount.toLocaleString('es-MX'));
        }
      } else if (parsed.intent === 'query') {
        showFeedback('Balance: $' + totalBalance.toLocaleString('es-MX'));
      } else {
        showFeedback('Escribe algo como: gaste 200 en super');
      }
    } catch {
      // Fallback al parser local si Gemini falla
      setIsTyping(false);
      if (amount > 0 && onExpenseAdded) {
        const cat = detectCategory(msg);
        onExpenseAdded(amount, cat, extractLabel(msg));
        showFeedback((cat === 'needs' ? 'Necesidad' : 'Gusto') + ' registrado: $' + amount.toLocaleString('es-MX'));
      } else {
        showFeedback('Escribe algo como: gaste 200 en super');
      }
    }
  };

  const startRecording = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        showFeedback('Sin permiso de microfono');
        return;
      }
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      showFeedback('Escuchando...');
    } catch (err) {
      console.error('Recording error:', err);
      showFeedback('Error al grabar');
    }
  };

  const stopAndTranscribe = async () => {
    setIsTranscribing(true);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      if (!uri) { showFeedback('Sin audio'); setIsTranscribing(false); return; }
      if (!STT_API_KEY) { showFeedback('Sin conexion de voz'); setIsTranscribing(false); return; }

      // Leer el archivo de audio y enviarlo directo a Deepgram
      const FileSystem = require('expo-file-system');
      const audioInfo = await FileSystem.getInfoAsync(uri);
      if (!audioInfo.exists) { showFeedback('Sin audio'); setIsTranscribing(false); return; }

      // Leer como base64 y convertir a ArrayBuffer para Deepgram
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convertir base64 a Uint8Array compatible con React Native
      const binaryStr = globalThis.atob ? globalThis.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const response = await fetch(
        'https://api.deepgram.com/v1/listen?language=es&model=nova-2&punctuate=true',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Token ' + STT_API_KEY,
            'Content-Type': 'audio/m4a',
          },
          body: bytes,
        }
      );

      if (!response.ok) {
        console.error('Deepgram error:', response.status, response.statusText);
        throw new Error(`Deepgram: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Deepgram response:', data);
      const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      if (transcript) {
        setText(transcript);
        inputRef.current?.focus();
        showFeedback(`"${transcript}"`);
      } else {
        showFeedback('No se pudo transcribir');
      }
    } catch (err) {
      showFeedback('Error de transcripcion');
    } finally {
      setIsTranscribing(false);
    }
  };

  const isRecording = audioRecorder.isRecording;

  const handleVoicePress = async () => {
    if (isTranscribing) return;
    if (isRecording) await stopAndTranscribe();
    else await startRecording();
  };

  return (
    <View style={s.w}>
      <IncomeAllocationModal isOpen={showModal} onClose={() => setShowModal(false)} amount={incomeAmount} onConfirm={(alloc) => onIncomeAdded?.(incomeAmount, alloc)} currentNeeds={currentNeeds} currentWants={currentWants} currentSavings={currentSavings} totalBalance={totalBalance} />
      {feedback && <View style={s.fb}><Text style={s.fbt}>{feedback}</Text></View>}
      {isTyping && <View style={s.ty}><View style={s.ds}><View style={[s.d, { backgroundColor: COLORS.ROSA }]} /><View style={[s.d, { backgroundColor: COLORS.ROSA_CLARO }]} /><View style={[s.d, { backgroundColor: COLORS.MENTA }]} /></View><Text style={s.tyt}>Tomasa calculando...</Text></View>}
      {isFocused && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.cs} contentContainerStyle={s.cc} keyboardShouldPersistTaps="always">{CHIPS.map((c, i) => <TouchableOpacity key={i} style={[s.cp, c.type === 'income' ? s.ci : s.ce]} onPress={() => { setText(c.label); inputRef.current?.focus(); }}><Text style={c.type === 'income' ? s.cit : s.cet}>{c.label}</Text></TouchableOpacity>)}</ScrollView>}
      <View style={s.b}>
        <TouchableOpacity style={s.m} onPress={handleVoicePress} activeOpacity={0.6} disabled={isTranscribing}>
          <View style={[s.mw, isRecording && s.mr, isTranscribing && s.mt]}>
            <Ionicons name={isTranscribing ? 'hourglass-outline' : isRecording ? 'stop' : 'mic-outline'} size={20} color={isRecording || isTranscribing ? '#fff' : COLORS.ROSA} />
          </View>
        </TouchableOpacity>
        <TextInput ref={inputRef} style={s.i} value={text} onChangeText={setText} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onSubmitEditing={handleSend} placeholder={isRecording ? 'Escuchando...' : 'Ej. Gaste 45 en un cafe'} placeholderTextColor={COLORS.MALVA + '80'} returnKeyType="send" editable={!isRecording} />
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
  ds: { flexDirection: 'row', gap: 6 }, d: { width: 8, height: 8, borderRadius: 4 },
  tyt: { fontSize: 12, fontWeight: '600', color: '#9D8189' },
  cs: { maxHeight: 44 }, cc: { paddingHorizontal: 16, gap: 8, paddingBottom: 8, alignItems: 'center' },
  cp: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  ci: { backgroundColor: '#FFCAD444', borderColor: '#FFCAD4' }, ce: { backgroundColor: 'rgba(255,255,255,0.6)', borderColor: '#fff' },
  cit: { fontSize: 12, fontWeight: '700', color: '#F4ACB7' }, cet: { fontSize: 12, fontWeight: '700', color: '#9D8189' },
  b: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  m: { padding: 4 },
  mw: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFCAD430' },
  mr: { backgroundColor: '#F4ACB7' }, mt: { backgroundColor: '#9D8189' },
  i: { flex: 1, fontSize: 14, fontWeight: '500', color: '#9D8189', backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10, elevation: 2 },
  sn: { padding: 4 },
});
