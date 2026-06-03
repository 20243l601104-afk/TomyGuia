import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectedBank, BankTransaction } from '../types';
import { BelvoWidget } from './BelvoWidget';
import { getBelvoAccounts, getBelvoTransactions, mapBelvoToExpenses } from '../services/belvoService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (bank: ConnectedBank, txs: BankTransaction[]) => void;
}

type Step = 'intro' | 'widget' | 'loading' | 'done' | 'error';

export function BankConnectModal({ isOpen, onClose, onConnected }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = () => {
    setStep('intro');
    setErrorMsg('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Belvo conectó exitosamente — traemos cuentas y transacciones
  const handleBelvoSuccess = async (linkId: string, institution: string) => {
    setStep('loading');
    try {
      const [accounts, transactions] = await Promise.all([
        getBelvoAccounts(linkId),
        getBelvoTransactions(linkId),
      ]);

      const account = accounts?.[0];
      const bank: ConnectedBank = {
        id: linkId,
        name: institution || account?.institution?.name || 'Banco conectado',
        color: '#F4ACB7',
        last4: account?.number?.slice(-4) || '****',
        connectedAt: Date.now(),
      };

      const mapped = mapBelvoToExpenses(transactions);
      const txs: BankTransaction[] = mapped.map((t, i) => ({
        id: i + 1,
        amount: t.amount,
        category: t.category,
        label: t.label,
        source: 'card' as const,
      }));

      setStep('done');
      setTimeout(() => {
        onConnected(bank, txs);
        handleClose();
      }, 1500);

    } catch (err) {
      setErrorMsg('No pudimos obtener tus movimientos. Intenta de nuevo.');
      setStep('error');
    }
  };

  const handleBelvoError = (error: string) => {
    setErrorMsg(error);
    setStep('error');
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>

      {/* Widget de Belvo — pantalla completa */}
      {step === 'widget' && (
        <BelvoWidget
          onSuccess={handleBelvoSuccess}
          onError={handleBelvoError}
          onClose={handleClose}
        />
      )}

      {/* Pantallas del modal (intro, loading, done, error) */}
      {step !== 'widget' && (
        <>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={handleClose} />
          <View style={s.sheet}>
            <View style={s.handle} />

            {/* INTRO */}
            {step === 'intro' && (
              <>
                <Text style={s.title}>Conecta tu banco 🏦</Text>
                <Text style={s.subtitle}>
                  Importamos tus movimientos automáticamente y los clasificamos en tu presupuesto 50/30/20
                </Text>

                <View style={s.featureList}>
                  <FeatureRow icon="shield-checkmark-outline" text="Conexión segura con cifrado bancario" />
                  <FeatureRow icon="repeat-outline" text="Sincronización automática del mes actual" />
                  <FeatureRow icon="albums-outline" text="Clasificación automática de gastos" />
                  <FeatureRow icon="eye-off-outline" text="Nunca vemos tus credenciales" />
                </View>

                <View style={s.banks}>
                  <Text style={s.banksLabel}>Bancos disponibles</Text>
                  <Text style={s.banksList}>BBVA · Banorte · Santander · HSBC · Banamex · Nu</Text>
                </View>

                <TouchableOpacity style={s.btnPrimary} onPress={() => setStep('widget')}>
                  <Ionicons name="link-outline" size={18} color="#fff" />
                  <Text style={s.btnTxt}>Conectar mi banco</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.btnSecondary} onPress={handleClose}>
                  <Text style={s.btnSecTxt}>Ahora no</Text>
                </TouchableOpacity>
              </>
            )}

            {/* LOADING */}
            {step === 'loading' && (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#F4ACB7" />
                <Text style={s.loadingTxt}>Importando tus movimientos...</Text>
                <Text style={s.loadingSub}>Esto puede tardar unos segundos</Text>
              </View>
            )}

            {/* DONE */}
            {step === 'done' && (
              <View style={s.center}>
                <View style={s.doneCircle}>
                  <Ionicons name="checkmark" size={40} color="#fff" />
                </View>
                <Text style={s.loadingTxt}>¡Banco conectado!</Text>
                <Text style={s.loadingSub}>Tus movimientos ya están en tu presupuesto</Text>
              </View>
            )}

            {/* ERROR */}
            {step === 'error' && (
              <View style={s.center}>
                <View style={s.errorCircle}>
                  <Ionicons name="close" size={40} color="#fff" />
                </View>
                <Text style={s.loadingTxt}>Algo salió mal</Text>
                <Text style={s.loadingSub}>{errorMsg}</Text>
                <TouchableOpacity style={[s.btnPrimary, { marginTop: 20 }]} onPress={handleReset}>
                  <Text style={s.btnTxt}>Intentar de nuevo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </Modal>
  );
}

function FeatureRow({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={s.featureRow}>
      <Ionicons name={icon} size={20} color="#F4ACB7" />
      <Text style={s.featureTxt}>{text}</Text>
    </View>
  );
}

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
    color: '#F4ACB7', textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13, color: '#9D8189',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 20, opacity: 0.8,
  },
  featureList: { marginBottom: 20, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureTxt: { fontSize: 14, color: '#6D5A62', flex: 1 },
  banks: {
    backgroundColor: '#FFF5F7',
    borderRadius: 12, padding: 12,
    marginBottom: 20, alignItems: 'center',
  },
  banksLabel: { fontSize: 11, color: '#9D8189', marginBottom: 4 },
  banksList: { fontSize: 13, fontWeight: '600', color: '#6D5A62' },
  btnPrimary: {
    backgroundColor: '#F4ACB7',
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    elevation: 4,
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnSecondary: { alignItems: 'center', paddingVertical: 14 },
  btnSecTxt: { fontSize: 14, color: '#9D8189', fontWeight: '600' },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40, gap: 10,
  },
  loadingTxt: { fontSize: 18, fontWeight: '800', color: '#F4ACB7' },
  loadingSub: { fontSize: 13, color: '#9D8189', textAlign: 'center' },
  doneCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#85A89E',
    alignItems: 'center', justifyContent: 'center',
  },
  errorCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF6B6B',
    alignItems: 'center', justifyContent: 'center',
  },
});
