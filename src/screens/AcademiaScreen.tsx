import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';

export function AcademiaScreen() {
  const ins = useSafeAreaInsets();
  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <Text style={s.title}>Academia 🎓</Text>
        <Text style={s.sub}>Aprende finanzas personales</Text>
      </View>
      <View style={s.center}>
        <TomasaSVG size={100} floating mood="sleeping" />
        <Text style={s.comingSoon}>¡Próximamente!</Text>
        <Text style={s.comingDesc}>
          Lecciones gamificadas sobre ahorro, presupuesto, crédito e inversión. Gana flores 🌸 completando cada módulo.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F9' },
  header: {
    paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#FFF0F4',
  },
  title: { fontSize: 22, fontWeight: '800', color: '#9D8189' },
  sub:   { fontSize: 13, color: '#9D8189', opacity: 0.6 },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 16,
  },
  comingSoon: { fontSize: 24, fontWeight: '800', color: '#F4ACB7' },
  comingDesc: {
    fontSize: 14, color: '#9D8189', textAlign: 'center',
    lineHeight: 22, opacity: 0.7,
  },
});
