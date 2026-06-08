import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, Linking, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PASOS = [
  {
    paso: '1',
    titulo: 'Documenta todo ahora',
    desc: 'Toma capturas de pantalla de mensajes, estados de cuenta o cualquier prueba. Guárdalas en un lugar seguro fuera del alcance de quien te controla.',
    icono: 'camera-outline' as const,
    color: '#FFCAD4',
  },
  {
    paso: '2',
    titulo: 'Abre una cuenta solo tuya',
    desc: 'Nu Bank es gratis y se abre desde el celular en minutos. No necesitas ir a ningún banco. Deposita aunque sea un poco.',
    icono: 'card-outline' as const,
    color: '#F3C57C',
  },
  {
    paso: '3',
    titulo: 'Localiza tus documentos',
    desc: 'CURP, INE, RFC y acta de nacimiento son tuyos y nadie puede quitártelos. Tramítalos si no los tienes — son gratuitos en gob.mx',
    icono: 'document-outline' as const,
    color: '#D8E2DC',
  },
  {
    paso: '4',
    titulo: 'Busca a alguien de confianza',
    desc: 'Habla con una amiga, familiar o vecina de confianza. No tienes que pasar por esto sola. Una red de apoyo es fundamental.',
    icono: 'people-outline' as const,
    color: '#C9D5F5',
  },
  {
    paso: '5',
    titulo: 'Llama ahora — es gratis',
    desc: 'INMUJERES atiende 24 horas, los 365 días del año. La llamada es completamente gratuita y confidencial.',
    icono: 'call-outline' as const,
    color: '#F4ACB7',
    urgente: true,
  },
];

export function EmergencyModal({ visible, onClose }: Props) {
  const ins = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(600)).current;
  const bgAnim    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }),
        Animated.timing(bgAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Fondo */}
      <Animated.View style={[s.overlay, { opacity: bgAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: ins.bottom + 20 }]}>
        <View style={s.handle} />

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <View style={s.headerIcono}>
              <Ionicons name="shield-half-outline" size={24} color="#F4ACB7" />
            </View>
            <View>
              <Text style={s.headerTitulo}>Plan de Emergencia</Text>
              <Text style={s.headerSub}>Estás a salvo. Aquí tienes los pasos.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#9D8189" />
          </TouchableOpacity>
        </View>

        {/* Mensaje de empatía */}
        <View style={s.empatiaCard}>
          <Text style={s.empatiaTxt}>
            ❤️ Lo que vives tiene nombre: <Text style={{ fontWeight: '800' }}>violencia económica</Text>. No es normal y no es tu culpa. Mereces vivir con libertad e independencia.
          </Text>
        </View>

        {/* Pasos */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
          {PASOS.map((item, i) => (
            <View key={i} style={[s.pasoRow, item.urgente && s.pasoRowUrgente]}>
              <View style={[s.pasoIcono, { backgroundColor: item.color }]}>
                <Ionicons name={item.icono} size={20} color="#9D8189" />
              </View>
              <View style={s.pasoTxt}>
                <Text style={s.pasoTitulo}>{item.titulo}</Text>
                <Text style={s.pasoDesc}>{item.desc}</Text>
                {item.urgente && (
                  <TouchableOpacity
                    style={s.llamarBtn}
                    onPress={() => Linking.openURL('tel:8009112511')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={s.llamarTxt}>Llamar a INMUJERES — 800 911 2511</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Botón llamar grande */}
        <TouchableOpacity
          style={s.llamarGrande}
          onPress={() => Linking.openURL('tel:8009112511')}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={s.llamarGrandeTxt}>Llamar ahora — INMUJERES</Text>
          <Text style={s.llamarGrandeSub}>800 911 2511 · Gratis · 24hrs</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    padding: 24, elevation: 20, maxHeight: '92%',
  },
  handle: {
    width: 48, height: 5, backgroundColor: '#D8E2DC',
    borderRadius: 99, alignSelf: 'center', marginBottom: 20,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIcono: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center',
  },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: '#9D8189' },
  headerSub:    { fontSize: 12, color: '#9D8189', opacity: 0.6, marginTop: 2 },
  closeBtn:     { padding: 8 },
  empatiaCard: {
    backgroundColor: '#FFF0F4', borderRadius: 16,
    padding: 14, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#F4ACB7',
  },
  empatiaTxt: { fontSize: 13, color: '#9D8189', lineHeight: 20 },
  pasoRow: {
    flexDirection: 'row', gap: 14, marginBottom: 14,
    padding: 12, borderRadius: 16, backgroundColor: '#FAFAFA',
  },
  pasoRowUrgente: {
    backgroundColor: '#FFF0F4',
    borderWidth: 1, borderColor: '#FFCAD4',
  },
  pasoIcono: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pasoTxt:    { flex: 1 },
  pasoTitulo: { fontSize: 14, fontWeight: '800', color: '#9D8189', marginBottom: 4 },
  pasoDesc:   { fontSize: 12, color: '#9D8189', lineHeight: 18, opacity: 0.8 },
  llamarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F4ACB7', borderRadius: 99,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: 10,
    alignSelf: 'flex-start',
  },
  llamarTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  llamarGrande: {
    backgroundColor: '#F4ACB7', borderRadius: 20,
    paddingVertical: 18, alignItems: 'center',
    gap: 4, marginTop: 16, elevation: 4,
    flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20,
  },
  llamarGrandeTxt: { color: '#fff', fontWeight: '800', fontSize: 16, flex: 1 },
  llamarGrandeSub: { color: '#ffffff99', fontSize: 11, fontWeight: '600' },
});
