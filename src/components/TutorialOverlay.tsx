import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Dimensions, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TomasaSVG } from './TomasaSVG';
import type { TomasaMood } from './TomasaSVG';

const { width: SW, height: SH } = Dimensions.get('window');

export interface PasoTutorial {
  id: string;
  mensaje: string;
  mood: TomasaMood;
  posicion: 'top' | 'bottom' | 'center';
  accion?: {
    tipo: 'escribir' | 'tocar' | 'observar';
    instruccion: string;
    placeholder?: string;
  };
}

interface Props {
  visible: boolean;
  pasos: PasoTutorial[];
  onClose: () => void;
  color?: string;
}

export function TutorialOverlay({ visible, pasos, onClose, color = '#F4ACB7' }: Props) {
  const [idx, setIdx]         = useState(0);
  const [input, setInput]     = useState('');
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const paso     = pasos[idx];
  const esUltimo = idx === pasos.length - 1;

  useEffect(() => {
    if (visible) {
      setIdx(0);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8,   useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const animarTransicion = (cb: () => void) => {
    Animated.timing(slideAnim, { toValue: 20, duration: 150, useNativeDriver: true }).start(() => {
      cb();
      slideAnim.setValue(-20);
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
    });
  };

  const siguiente = () => {
    setInput('');
    if (esUltimo) { onClose(); return; }
    animarTransicion(() => setIdx(i => i + 1));
  };

  const anterior = () => {
    if (idx === 0) return;
    setInput('');
    animarTransicion(() => setIdx(i => i - 1));
  };

  if (!visible) return null;

  const posTop    = paso.posicion === 'top';
  const posBottom = paso.posicion === 'bottom';
  const posCenter = paso.posicion === 'center';

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Fondo semitransparente */}
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>

        {/* Botón cerrar */}
        <TouchableOpacity style={s.cerrarBtn} onPress={onClose}>
          <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

        {/* Barra de progreso */}
        <View style={s.progresoBarra}>
          {pasos.map((_, i) => (
            <View
              key={i}
              style={[
                s.progresoPunto,
                i === idx && { backgroundColor: color, width: 20 },
                i < idx   && { backgroundColor: color + '80' },
              ]}
            />
          ))}
        </View>

        {/* Card de Tomasa — posición según el paso */}
        <Animated.View
          style={[
            s.card,
            posTop    && s.cardTop,
            posBottom && s.cardBottom,
            posCenter && s.cardCenter,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Tomasa */}
          <View style={[s.tomasaCircle, { backgroundColor: color + '20' }]}>
            <TomasaSVG size={72} floating mood={paso.mood} />
          </View>

          {/* Mensaje */}
          <Text style={s.mensaje}>{paso.mensaje}</Text>

          {/* Acción interactiva */}
          {paso.accion && (
            <View style={[s.accionCard, { borderColor: color + '40' }]}>
              <View style={s.accionHeader}>
                <Ionicons
                  name={
                    paso.accion.tipo === 'escribir' ? 'pencil-outline'
                    : paso.accion.tipo === 'tocar'  ? 'finger-print-outline'
                    : 'eye-outline'
                  }
                  size={16}
                  color={color}
                />
                <Text style={[s.accionTitulo, { color }]}>
                  {paso.accion.tipo === 'escribir' ? 'Pruébalo ahora'
                    : paso.accion.tipo === 'tocar' ? 'Tu turno'
                    : 'Observa'}
                </Text>
              </View>
              <Text style={s.accionInstruccion}>{paso.accion.instruccion}</Text>

              {/* Input de práctica (no registra nada real) */}
              {paso.accion.tipo === 'escribir' && (
                <View style={s.inputPractica}>
                  <TouchableOpacity
                    style={[s.inputField, { borderColor: color + '60' }]}
                    activeOpacity={1}
                  >
                    <Text style={[s.inputTxt, !input && { color: '#9D818960' }]}>
                      {input || paso.accion.placeholder || 'Escribe aquí...'}
                    </Text>
                  </TouchableOpacity>
                  {/* Teclado virtual simplificado */}
                  <View style={s.tecladoSimple}>
                    {['gasté 500 en café', 'cobré 5000', 'pagué luz'].map((sugerencia, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[s.sugerenciaBtn, { borderColor: color + '40' }]}
                        onPress={() => setInput(sugerencia)}
                      >
                        <Text style={[s.sugerenciaTxt, { color }]}>{sugerencia}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {input ? (
                    <View style={[s.simulacionResult, { backgroundColor: color + '15' }]}>
                      <Ionicons name="checkmark-circle" size={18} color={color} />
                      <Text style={[s.simulacionTxt, { color }]}>
                        ¡Perfecto! Así registrarías un gasto. En el uso real esto se guardaría 🌸
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {/* Navegación */}
          <View style={s.navRow}>
            <TouchableOpacity
              style={[s.navAtras, idx === 0 && { opacity: 0 }]}
              onPress={anterior}
              disabled={idx === 0}
            >
              <Ionicons name="chevron-back" size={16} color="#9D8189" />
              <Text style={s.navAtrasTxt}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.navSiguiente, { backgroundColor: color }]}
              onPress={siguiente}
            >
              <Text style={s.navSiguienteTxt}>{esUltimo ? '¡Entendido!' : 'Siguiente'}</Text>
              <Ionicons name={esUltimo ? 'checkmark' : 'chevron-forward'} size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>

      </Animated.View>
    </Modal>
  );
}

// ─── BOTÓN ? ─────────────────────────────────────────
interface BtnProps {
  onPress: () => void;
  color?: string;
}

export function BotonAyuda({ onPress, color = '#F4ACB7' }: BtnProps) {
  return (
    <TouchableOpacity style={[s.botonAyuda, { borderColor: color + '40' }]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[s.botonAyudaTxt, { color }]}>?</Text>
    </TouchableOpacity>
  );
}

// ─── ESTILOS ─────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  cerrarBtn: {
    position: 'absolute', top: 52, right: 20, zIndex: 10,
  },
  progresoBarra: {
    position: 'absolute', top: 58, left: 0, right: 60,
    flexDirection: 'row', gap: 4, paddingHorizontal: 20,
    alignItems: 'center',
  },
  progresoPunto: {
    height: 4, width: 6, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Cards
  card: {
    backgroundColor: '#fff', margin: 16,
    borderRadius: 28, padding: 20, gap: 14,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  cardTop:    { marginTop: 'auto' as any },
  cardBottom: { marginBottom: 100 },
  cardCenter: { marginVertical: 'auto' as any },

  tomasaCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },

  mensaje: { fontSize: 15, color: '#6D5A62', lineHeight: 23, textAlign: 'center' },

  // Acción
  accionCard: {
    backgroundColor: '#FFF8F9', borderRadius: 16,
    padding: 14, gap: 8, borderWidth: 1.5,
  },
  accionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accionTitulo:     { fontSize: 13, fontWeight: '800' },
  accionInstruccion:{ fontSize: 13, color: '#9D8189', lineHeight: 19 },

  // Input práctica
  inputPractica: { gap: 8 },
  inputField: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5,
  },
  inputTxt:    { fontSize: 14, color: '#9D8189', fontWeight: '500' },
  tecladoSimple:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sugerenciaBtn:{
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 99, backgroundColor: '#fff',
    borderWidth: 1,
  },
  sugerenciaTxt:{ fontSize: 12, fontWeight: '600' },
  simulacionResult:{
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 12, padding: 10,
  },
  simulacionTxt:{ flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 },

  // Navegación
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  navAtras: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    padding: 8,
  },
  navAtrasTxt:     { fontSize: 13, fontWeight: '600', color: '#9D8189' },
  navSiguiente: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 99, elevation: 3,
  },
  navSiguienteTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Botón ?
  botonAyuda: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center', borderWidth: 1.5,
    elevation: 2,
  },
  botonAyudaTxt: { fontSize: 15, fontWeight: '900' },
});
