import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'tomy_boveda_pin';

interface Props {
  visible: boolean;
  modo: 'crear' | 'verificar';
  onSuccess: () => void;
  onClose: () => void;
}

export function PinModal({ visible, modo, onSuccess, onClose }: Props) {
  const [pin, setPin]             = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [paso, setPaso]           = useState<'ingresar' | 'confirmar'>('ingresar');
  const [error, setError]         = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPin(''); setPinConfirm(''); setPaso('ingresar'); setError('');
    }
  }, [visible]);

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const presionar = async (digito: string) => {
    setError('');
    const current = modo === 'crear' && paso === 'confirmar' ? pinConfirm : pin;
    if (current.length >= 4) return;
    const nuevo = current + digito;

    if (modo === 'crear' && paso === 'confirmar') {
      setPinConfirm(nuevo);
      if (nuevo.length === 4) {
        if (nuevo === pin) {
          await AsyncStorage.setItem(PIN_KEY, pin);
          onSuccess();
        } else {
          setError('Los PINs no coinciden. Intenta de nuevo.');
          shake();
          setTimeout(() => { setPinConfirm(''); setPaso('ingresar'); setPin(''); }, 800);
        }
      }
    } else {
      setPin(nuevo);
      if (nuevo.length === 4) {
        if (modo === 'verificar') {
          const saved = await AsyncStorage.getItem(PIN_KEY);
          if (nuevo === saved) {
            onSuccess();
          } else {
            setError('PIN incorrecto. Intenta de nuevo.');
            shake();
            setTimeout(() => setPin(''), 600);
          }
        } else {
          // modo crear — pasar a confirmar
          setTimeout(() => { setPaso('confirmar'); }, 300);
        }
      }
    }
  };

  const borrar = () => {
    setError('');
    if (modo === 'crear' && paso === 'confirmar') {
      setPinConfirm(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
  };

  const pinActual = modo === 'crear' && paso === 'confirmar' ? pinConfirm : pin;

  const titulo = modo === 'crear'
    ? paso === 'ingresar' ? 'Crea tu PIN de bóveda' : 'Confirma tu PIN'
    : 'Ingresa tu PIN';

  const subtitulo = modo === 'crear'
    ? paso === 'ingresar' ? 'Elige 4 dígitos para proteger tus documentos' : 'Escribe el mismo PIN de nuevo'
    : 'Tu bóveda está protegida 🔒';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { transform: [{ translateX: shakeAnim }] }]}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.lockIcon}>
              <Ionicons name="lock-closed" size={28} color="#F4ACB7" />
            </View>
            <Text style={s.titulo}>{titulo}</Text>
            <Text style={s.subtitulo}>{subtitulo}</Text>
          </View>

          {/* Puntos PIN */}
          <View style={s.puntosRow}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[s.punto, i < pinActual.length && s.puntoLleno]} />
            ))}
          </View>

          {/* Error */}
          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Teclado */}
          <View style={s.teclado}>
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[s.tecla, d === '' && { opacity: 0 }, d === '⌫' && s.teclaElim]}
                onPress={() => d === '⌫' ? borrar() : d !== '' ? presionar(d) : null}
                disabled={d === ''}
                activeOpacity={0.6}
              >
                <Text style={[s.teclaTxt, d === '⌫' && s.teclaElimTxt]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancelar */}
          <TouchableOpacity style={s.cancelar} onPress={onClose}>
            <Text style={s.cancelarTxt}>Cancelar</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

export async function tienePin(): Promise<boolean> {
  const pin = await AsyncStorage.getItem(PIN_KEY);
  return !!pin;
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: 32, width: '85%', alignItems: 'center',
    elevation: 20, gap: 20,
  },
  header:     { alignItems: 'center', gap: 8 },
  lockIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: '#FFF0F4', alignItems: 'center',
    justifyContent: 'center', marginBottom: 4,
  },
  titulo:    { fontSize: 20, fontWeight: '800', color: '#9D8189', textAlign: 'center' },
  subtitulo: { fontSize: 13, color: '#9D8189', opacity: 0.7, textAlign: 'center' },
  puntosRow: { flexDirection: 'row', gap: 16 },
  punto: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#F0E0E5', borderWidth: 2, borderColor: '#FFCAD4',
  },
  puntoLleno: { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' },
  error: { fontSize: 13, color: '#D64545', fontWeight: '600', textAlign: 'center' },
  teclado: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, justifyContent: 'center', width: '100%',
  },
  tecla: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFF8F9', alignItems: 'center',
    justifyContent: 'center', elevation: 2,
    borderWidth: 1, borderColor: '#F0E0E5',
  },
  teclaElim: { backgroundColor: '#FFF0F0' },
  teclaTxt:  { fontSize: 24, fontWeight: '700', color: '#6D5A62' },
  teclaElimTxt: { fontSize: 20, color: '#F4ACB7' },
  cancelar:  { paddingVertical: 8, paddingHorizontal: 24 },
  cancelarTxt:{ fontSize: 14, fontWeight: '600', color: '#9D818980' },
});
