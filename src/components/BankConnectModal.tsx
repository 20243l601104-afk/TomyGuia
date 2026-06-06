import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectedBank, BankTransaction } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (bank: ConnectedBank, txs: BankTransaction[]) => void;
}

// ─── Bancos mexicanos con datos reales ───
const BANKS = [
  { id: 'nu',      name: 'Nu',       color: '#820AD1', last4: '4242', emoji: '💜' },
  { id: 'bbva',    name: 'BBVA',     color: '#004481', last4: '1234', emoji: '🔵' },
  { id: 'banorte', name: 'Banorte',  color: '#E30613', last4: '5678', emoji: '🔴' },
  { id: 'hsbc',    name: 'HSBC',     color: '#DB0011', last4: '9012', emoji: '🏦' },
  { id: 'santander',name: 'Santander',color: '#EC0000', last4: '3456', emoji: '🔥' },
  { id: 'banamex', name: 'Citibanamex',color: '#056DAE',last4: '7890', emoji: '🏛️' },
];

// ─── Movimientos simulados realistas por banco ───
const MOCK_TRANSACTIONS: Record<string, { label: string; amount: number; category: 'needs' | 'wants' }[]> = {
  nu: [
    { label: 'Supermercado Walmart',     amount: 850,  category: 'needs'  },
    { label: 'Netflix',                  amount: 219,  category: 'wants'  },
    { label: 'Spotify',                  amount: 99,   category: 'wants'  },
    { label: 'Farmacia Guadalajara',     amount: 320,  category: 'needs'  },
    { label: 'Starbucks',                amount: 95,   category: 'wants'  },
    { label: 'Uber',                     amount: 145,  category: 'needs'  },
    { label: 'Amazon',                   amount: 450,  category: 'wants'  },
    { label: 'Oxxo',                     amount: 65,   category: 'wants'  },
    { label: 'CFE Electricidad',         amount: 380,  category: 'needs'  },
    { label: 'Restaurante El Tizoncito', amount: 280,  category: 'wants'  },
  ],
  bbva: [
    { label: 'Chedraui',                 amount: 1200, category: 'needs'  },
    { label: 'Telmex Internet',          amount: 499,  category: 'needs'  },
    { label: 'Gasolinera Pemex',         amount: 600,  category: 'needs'  },
    { label: 'Cinépolis',                amount: 230,  category: 'wants'  },
    { label: 'Ropa Liverpool',           amount: 890,  category: 'wants'  },
    { label: 'Mercado Libre',            amount: 350,  category: 'wants'  },
    { label: 'DiDi',                     amount: 85,   category: 'needs'  },
    { label: 'Tortillería',              amount: 45,   category: 'needs'  },
    { label: 'Café Punta del Cielo',     amount: 75,   category: 'wants'  },
    { label: 'Agua Bonafont',            amount: 120,  category: 'needs'  },
  ],
  banorte: [
    { label: 'Soriana Mercado',          amount: 950,  category: 'needs'  },
    { label: 'Recibo IMSS',              amount: 180,  category: 'needs'  },
    { label: 'Telcel Plan',              amount: 349,  category: 'needs'  },
    { label: 'Pizza Dominos',            amount: 195,  category: 'wants'  },
    { label: 'Uber Eats',                amount: 165,  category: 'wants'  },
    { label: 'Gym Sport City',           amount: 499,  category: 'wants'  },
    { label: 'Panadería',                amount: 55,   category: 'needs'  },
    { label: 'Papelería',                amount: 120,  category: 'needs'  },
    { label: 'Rappi',                    amount: 210,  category: 'wants'  },
    { label: 'Dentista',                 amount: 800,  category: 'needs'  },
  ],
  hsbc: [
    { label: 'Costco',                   amount: 2100, category: 'needs'  },
    { label: 'Izzi Internet',            amount: 399,  category: 'needs'  },
    { label: 'Gas LP',                   amount: 350,  category: 'needs'  },
    { label: 'McDonald\'s',              amount: 145,  category: 'wants'  },
    { label: 'H&M Ropa',                amount: 680,  category: 'wants'  },
    { label: 'Nintendo Switch Online',   amount: 149,  category: 'wants'  },
    { label: 'Farmacia del Ahorro',      amount: 280,  category: 'needs'  },
    { label: 'Mercado San Juan',         amount: 420,  category: 'needs'  },
    { label: 'Cinema Citibanamex',       amount: 180,  category: 'wants'  },
    { label: 'Café Americano',           amount: 55,   category: 'wants'  },
  ],
  santander: [
    { label: 'Sam\'s Club',             amount: 1800, category: 'needs'  },
    { label: 'AT&T Plan',               amount: 299,  category: 'needs'  },
    { label: 'Gasolina Shell',           amount: 550,  category: 'needs'  },
    { label: 'Sushi Bar',               amount: 340,  category: 'wants'  },
    { label: 'Zara',                     amount: 790,  category: 'wants'  },
    { label: 'Disney+',                  amount: 179,  category: 'wants'  },
    { label: 'Vitaminas GNC',            amount: 450,  category: 'needs'  },
    { label: 'Librería Gandhi',          amount: 280,  category: 'wants'  },
    { label: 'Tacos El Güero',           amount: 85,   category: 'wants'  },
    { label: 'Agua mineral',             amount: 35,   category: 'needs'  },
  ],
  banamex: [
    { label: 'La Comer',                 amount: 1050, category: 'needs'  },
    { label: 'Megacable',               amount: 449,  category: 'needs'  },
    { label: 'Gasolinería BP',           amount: 480,  category: 'needs'  },
    { label: 'KFC',                      amount: 175,  category: 'wants'  },
    { label: 'Pull&Bear',               amount: 560,  category: 'wants'  },
    { label: 'HBO Max',                  amount: 149,  category: 'wants'  },
    { label: 'Cruz Roja Donativo',       amount: 100,  category: 'needs'  },
    { label: 'Papelería Office Depot',   amount: 190,  category: 'needs'  },
    { label: 'Cervecería',               amount: 220,  category: 'wants'  },
    { label: 'Verduras mercado',         amount: 180,  category: 'needs'  },
  ],
};

type Step = 'select' | 'connecting' | 'done' | 'error';

export function BankConnectModal({ isOpen, onClose, onConnected }: Props) {
  const [step, setStep]         = useState<Step>('select');
  const [selectedBank, setSelectedBank] = useState<typeof BANKS[0] | null>(null);

  const handleReset = () => {
    setStep('select');
    setSelectedBank(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSelectBank = (bank: typeof BANKS[0]) => {
    setSelectedBank(bank);
    setStep('connecting');

    // Simular tiempo de conexión bancaria
    setTimeout(() => {
      const txs = MOCK_TRANSACTIONS[bank.id] || [];
      const connectedBank: ConnectedBank = {
        id: bank.id,
        name: bank.name,
        color: bank.color,
        last4: bank.last4,
        connectedAt: Date.now(),
      };
      const bankTxs: BankTransaction[] = txs.map((t, i) => ({
        id: Date.now() + i,
        amount: t.amount,
        category: t.category,
        label: t.label,
        source: 'card' as const,
      }));

      setStep('done');
      setTimeout(() => {
        onConnected(connectedBank, bankTxs);
        handleClose();
      }, 1500);
    }, 2500);
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={step === 'select' ? handleClose : undefined} />

      <View style={s.sheet}>
        <View style={s.handle} />

        {/* SELECCIONAR BANCO */}
        {step === 'select' && (
          <>
            <Text style={s.title}>Conecta tu banco 🏦</Text>
            <Text style={s.subtitle}>
              Importamos tus movimientos del mes y los clasificamos automáticamente en tu presupuesto
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360 }}>
              {BANKS.map(bank => (
                <TouchableOpacity
                  key={bank.id}
                  style={s.bankRow}
                  onPress={() => handleSelectBank(bank)}
                  activeOpacity={0.7}
                >
                  <View style={[s.bankIcon, { backgroundColor: bank.color + '18' }]}>
                    <Text style={s.bankEmoji}>{bank.emoji}</Text>
                  </View>
                  <View style={s.bankInfo}>
                    <Text style={s.bankName}>{bank.name}</Text>
                    <Text style={s.bankSub}>•••• {bank.last4}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFCAD4" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={s.skipBtn} onPress={handleClose}>
              <Text style={s.skipTxt}>Ahora no</Text>
            </TouchableOpacity>
          </>
        )}

        {/* CONECTANDO */}
        {step === 'connecting' && selectedBank && (
          <View style={s.center}>
            <View style={[s.bankIconLarge, { backgroundColor: selectedBank.color + '18' }]}>
              <Text style={{ fontSize: 44 }}>{selectedBank.emoji}</Text>
            </View>
            <Text style={s.connectingTitle}>Conectando con {selectedBank.name}</Text>
            <Text style={s.connectingSub}>Importando tus movimientos del mes...</Text>
            <ActivityIndicator size="large" color={selectedBank.color} style={{ marginTop: 20 }} />

            {/* Pasos animados */}
            <View style={s.steps}>
              <StepRow text="Verificando credenciales" done />
              <StepRow text="Obteniendo movimientos" done />
              <StepRow text="Clasificando gastos..." loading />
            </View>
          </View>
        )}

        {/* LISTO */}
        {step === 'done' && selectedBank && (
          <View style={s.center}>
            <View style={s.doneCircle}>
              <Ionicons name="checkmark" size={44} color="#fff" />
            </View>
            <Text style={s.doneTitle}>¡{selectedBank.name} conectado!</Text>
            <Text style={s.doneSub}>
              Se importaron 10 movimientos a tu presupuesto 🎉
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

function StepRow({ text, done, loading }: { text: string; done?: boolean; loading?: boolean }) {
  return (
    <View style={sr.row}>
      {loading
        ? <ActivityIndicator size="small" color="#F4ACB7" />
        : <Ionicons name="checkmark-circle" size={18} color="#85A89E" />
      }
      <Text style={[sr.txt, loading && { color: '#F4ACB7' }]}>{text}</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  txt: { fontSize: 13, color: '#9D8189', fontWeight: '500' },
});

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: '#D8E2DC',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22, fontWeight: '800',
    color: '#F4ACB7', textAlign: 'center', marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, color: '#9D8189',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 20, opacity: 0.8,
  },
  bankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#FFF0F4',
    gap: 14,
  },
  bankIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  bankEmoji: { fontSize: 24 },
  bankInfo: { flex: 1 },
  bankName: { fontSize: 16, fontWeight: '700', color: '#6D5A62' },
  bankSub: { fontSize: 12, color: '#9D8189', marginTop: 2 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipTxt: { fontSize: 14, color: '#9D8189', fontWeight: '600' },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, gap: 10,
  },
  bankIconLarge: {
    width: 90, height: 90, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  connectingTitle: {
    fontSize: 20, fontWeight: '800', color: '#9D8189',
  },
  connectingSub: {
    fontSize: 13, color: '#9D8189', opacity: 0.7,
  },
  steps: { marginTop: 16, gap: 4, alignSelf: 'flex-start', paddingHorizontal: 20 },
  doneCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#85A89E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 22, fontWeight: '800', color: '#F4ACB7',
  },
  doneSub: {
    fontSize: 14, color: '#9D8189',
    textAlign: 'center', lineHeight: 22,
  },
});
