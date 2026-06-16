import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';

import type { UserProfile } from '../types';

const C = { ROSA: '#F4ACB7', CLARO: '#FFCAD4', MELON: '#FFE5D9', MENTA: '#D8E2DC', MALVA: '#9D8189', VERDE: '#5B776F', AMARILLO: '#F3C57C', NARANJA: '#E8963B' };

/* ─── Flor de cempasúchil PNG ─── */
function CempasuchilFlower({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) {
 return (
 <Text style={{ fontSize: size * 0.8, opacity }}>&#x1F33C;</Text>
 );
}

/* ─── Logros ─── */
const ACHIEVEMENTS = [
 { id: 'onboarding', label: 'Primeros pasos', desc: 'Completaste el registro', flowers: 5, icon: '+' },
 { id: 'first_expense', label: 'Primera cuenta', desc: 'Registraste tu primer gasto', flowers: 3, icon: '+' },
 { id: 'calendar_set', label: 'Organizada', desc: 'Asignaste todos tus gastos al calendario', flowers: 5, icon: '+' },
 { id: 'first_income', label: 'Llegó el dinero', desc: 'Registraste tu primer ingreso', flowers: 3, icon: '+' },
 { id: 'emergency_10', label: 'Colchoncito', desc: 'Tu fondo de emergencia llegó al 10%', flowers: 10, icon: '+' },
 { id: 'emergency_50', label: 'Medio camino', desc: 'Tu fondo de emergencia llegó al 50%', flowers: 20, icon: '+' },
 { id: 'emergency_100', label: '¡Meta cumplida!', desc: 'Completaste tu fondo de emergencia', flowers: 50, icon: '+' },
 { id: 'week_streak', label: 'Constante', desc: 'Registraste gastos toda la semana', flowers: 8, icon: '+' },
];


/* ─── Beneficios bancarios via Belvo ─── */
const BENEFICIOS = [
 {
 id: 'nu_cashback',
 bankName: 'Nu',
 bankColor: '#820AD1',
 bankInitial: 'N',
 titulo: 'Cashback 3% en compras',
 desc: 'Obtén 3% de regreso en todas tus compras con la tarjeta Nu durante 3 meses.',
 flores: 50,
 url: 'https://nu.com.mx',
 },
 {
 id: 'bbva_msi',
 bankName: 'BBVA',
 bankColor: '#004481',
 bankInitial: 'B',
 titulo: '6 meses sin intereses',
 desc: 'Accede a 6 MSI en Liverpool, Palacio de Hierro y tiendas departamentales participantes.',
 flores: 60,
 url: 'https://www.bbva.mx',
 },
 {
 id: 'santander_cuenta',
 bankName: 'Santander',
 bankColor: '#EC0000',
 bankInitial: 'S',
 titulo: 'Cuenta sin comision por 1 año',
 desc: 'Abre tu cuenta Santander Plus sin cobro de comision mensual durante 12 meses.',
 flores: 75,
 url: 'https://www.santander.com.mx',
 },
 {
 id: 'banorte_tasa',
 bankName: 'Banorte',
 bankColor: '#E30613',
 bankInitial: 'B',
 titulo: 'Tasa de ahorro al 12% anual',
 desc: 'Tasa preferencial del 12% anual en tu cuenta de ahorro Banorte por 6 meses.',
 flores: 100,
 url: 'https://www.banorte.com',
 },
];

const COMO_GANAR = [
 { label: 'Completar una leccion de Academia', pts: 5 },
 { label: 'Aprobar un quiz', pts: 3 },
 { label: 'Cumplir meta de ahorro del mes', pts: 10 },
 { label: 'Registrar gastos 7 dias seguidos', pts: 8 },
 { label: 'Pagar todos los recibos del mes', pts: 5 },
];

interface Props {
 profile: UserProfile;
 onSave: (profile: UserProfile) => void;
 onBack: () => void;
}

export function ProfileScreen({ profile, onSave, onBack }: Props) {
 const ins = useSafeAreaInsets();
 const [name, setName] = useState(profile.name);
 const [photoUri, setPhotoUri] = useState<string | null>(profile.photoUri);
 const [editingName, setEditingName] = useState(false);
 const [beneficiosTab, setBeneficiosTab] = useState<'beneficios' | 'ganar'>('beneficios');

 const pickImage = async () => {
 const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
 if (status !== 'granted') {
 Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería para cambiar la foto.');
 return;
 }

 const result = await ImagePicker.launchImageLibraryAsync({
 mediaTypes: ['images'],
 allowsEditing: true,
 aspect: [1, 1],
 quality: 0.7,
 });

 if (!result.canceled && result.assets[0]) {
 setPhotoUri(result.assets[0].uri);
 }
 };

 const takePhoto = async () => {
 const { status } = await ImagePicker.requestCameraPermissionsAsync();
 if (status !== 'granted') {
 Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara.');
 return;
 }

 const result = await ImagePicker.launchCameraAsync({
 allowsEditing: true,
 aspect: [1, 1],
 quality: 0.7,
 });

 if (!result.canceled && result.assets[0]) {
 setPhotoUri(result.assets[0].uri);
 }
 };

 const handlePhotoPress = () => {
 Alert.alert('Cambiar foto', '¿De dónde quieres tu foto?', [
 { text: 'Cámara', onPress: takePhoto },
 { text: 'Galería', onPress: pickImage },
 { text: 'Quitar foto', style: 'destructive', onPress: () => setPhotoUri(null) },
 { text: 'Cancelar', style: 'cancel' },
 ]);
 };

 const handleSave = () => {
 onSave({ ...profile, name: name.trim() || 'Amiga', photoUri });
 onBack();
 };

 const hasChanged = name !== profile.name || photoUri !== profile.photoUri;

 // Calcular nivel basado en flores
 const level = Math.floor(profile.flowers / 10) + 1;
 const flowersInLevel = profile.flowers % 10;
 const levelProgress = (flowersInLevel / 10) * 100;

 const levelTitles = ['Semillita', 'Brote', 'Capullo', 'Flor', 'Ramillete', 'Jardín', 'Campo', 'Ofrenda', 'Altar', 'Leyenda'];
 const levelTitle = levelTitles[Math.min(level - 1, levelTitles.length - 1)];

 return (
 <LinearGradient colors={[C.MELON, C.MENTA]} style={[s.con, { paddingTop: ins.top }]}>
 {/* Header */}
 <View style={s.hd}>
 <TouchableOpacity style={s.back} onPress={onBack}>
 <Ionicons name="arrow-back" size={22} color={C.MALVA} />
 </TouchableOpacity>
 <Text style={s.title}>Mi Perfil</Text>
 <TouchableOpacity
 style={[s.saveBtn, !hasChanged && { opacity: 0.4 }]}
 onPress={handleSave}
 disabled={!hasChanged}
 >
 <Text style={s.saveTxt}>Guardar</Text>
 </TouchableOpacity>
 </View>

 <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

 {/* ─── Avatar ─── */}
 <TouchableOpacity style={s.avatarWrap} onPress={handlePhotoPress} activeOpacity={0.8}>
 {photoUri ? (
 <Image source={{ uri: photoUri }} style={s.avatarImg} />
 ) : (
 <View style={s.avatarPlaceholder}>
 <TomasaSVG size={60} floating={false} />
 </View>
 )}
 <View style={s.cameraBadge}>
 <Ionicons name="camera" size={14} color="#fff" />
 </View>
 </TouchableOpacity>
 <Text style={s.photoHint}>Toca para cambiar foto</Text>

 {/* ─── Nombre ─── */}
 <View style={s.card}>
 <Text style={s.label}>NOMBRE</Text>
 {editingName ? (
 <View style={s.nameRow}>
 <TextInput
 style={s.nameInput}
 value={name}
 onChangeText={setName}
 placeholder="Como te llamas"
 placeholderTextColor={C.MALVA + '50'}
 autoFocus
 maxLength={20}
 onSubmitEditing={() => setEditingName(false)}
 returnKeyType="done"
 />
 <TouchableOpacity onPress={() => setEditingName(false)}>
 <Ionicons name="checkmark-circle" size={28} color={C.ROSA} />
 </TouchableOpacity>
 </View>
 ) : (
 <TouchableOpacity style={s.nameRow} onPress={() => setEditingName(true)}>
 <Text style={s.nameText}>{name || 'Agregar nombre'}</Text>
 <Ionicons name="pencil" size={16} color={C.ROSA} />
 </TouchableOpacity>
 )}
 </View>

 {/* ─── Flores + Beneficios ─── */}
 <View style={s.card}>
 {/* ─── Flores + Nivel ─── */}
 <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
 <View>
 <Text style={s.label}>FLORES Y NIVEL</Text>
 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
 <Text style={{ fontSize: 18 }}>&#x1F33C;</Text>
 <Text style={{ fontSize: 24, fontWeight: '800', color: '#E8963B' }}>{profile.flowers}</Text>
 <Text style={{ fontSize: 12, color: '#9D8189' }}>flores</Text>
 </View>
 </View>
 <View style={{ alignItems: 'flex-end' }}>
 {(() => {
 const next = BENEFICIOS.filter(b => b.flores > profile.flowers).sort((a,b) => a.flores - b.flores)[0];
 return next ? (
 <View style={{ alignItems: 'flex-end' }}>
 <Text style={{ fontSize: 10, color: '#9D8189' }}>Proximo beneficio</Text>
 <Text style={{ fontSize: 12, fontWeight: '700', color: '#D4537E', marginTop: 2 }}>{next.bankName} · {next.flores} flores</Text>
 <Text style={{ fontSize: 10, color: '#9D8189' }}>te faltan {next.flores - profile.flowers}</Text>
 </View>
 ) : (
 <View style={{ backgroundColor: '#E1F5EE', borderRadius: 8, padding: 6 }}>
 <Text style={{ fontSize: 10, color: '#0F6E56', fontWeight: '700' }}>Todos desbloqueados</Text>
 </View>
 );
 })()}
 </View>
 </View>

 {/* Barra de nivel */}
 <View style={s.levelWrap}>
 <View style={s.levelBadge}><Text style={s.levelNum}>{level}</Text></View>
 <View style={{ flex: 1 }}>
 <Text style={s.levelTitle}>{levelTitle}</Text>
 <View style={s.levelBar}><View style={[s.levelFill, { width: `${levelProgress}%` as any }]} /></View>
 <Text style={s.levelHint}>{flowersInLevel}/10 para el siguiente nivel</Text>
 </View>
 </View>

 {/* Tabs */}
 <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 12 }}>
 <TouchableOpacity
 style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
 beneficiosTab === 'beneficios'
 ? { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' }
 : { backgroundColor: 'transparent', borderColor: '#F4ACB7' }]}
 onPress={() => setBeneficiosTab('beneficios')}
 >
 <Text style={{ fontSize: 12, fontWeight: '700', color: beneficiosTab === 'beneficios' ? '#fff' : '#9D8189' }}>Beneficios</Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={[{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
 beneficiosTab === 'ganar'
 ? { backgroundColor: '#F3C57C', borderColor: '#F3C57C' }
 : { backgroundColor: 'transparent', borderColor: '#F3C57C' }]}
 onPress={() => setBeneficiosTab('ganar')}
 >
 <Text style={{ fontSize: 12, fontWeight: '700', color: beneficiosTab === 'ganar' ? '#fff' : '#9D8189' }}>Como ganar mas</Text>
 </TouchableOpacity>
 </View>

 {beneficiosTab === 'beneficios' && (
 <View style={{ gap: 8 }}>
 {BENEFICIOS.map(b => {
 const unlocked = profile.flowers >= b.flores;
 return (
 <View key={b.id} style={{
 flexDirection: 'row', alignItems: 'center', gap: 10,
 backgroundColor: unlocked ? '#FFF0F5' : '#F7F7F7',
 borderRadius: 12, padding: 10,
 borderWidth: 0.5, borderColor: unlocked ? '#F4ACB7' : '#E0E0E0',
 opacity: unlocked ? 1 : 0.75,
 }}>
 <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: b.bankColor, alignItems: 'center', justifyContent: 'center' }}>
 <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>{b.bankInitial}</Text>
 </View>
 <View style={{ flex: 1 }}>
 <Text style={{ fontSize: 12, fontWeight: '700', color: '#2D2D2D' }}>{b.bankName} — {b.titulo}</Text>
 <Text style={{ fontSize: 10, color: '#9D8189', marginTop: 1 }}>{b.desc}</Text>
 </View>
 {unlocked ? (
 <TouchableOpacity
 style={{ backgroundColor: '#F4ACB7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}
 onPress={() => Alert.alert(
 `Beneficio ${b.bankName}`,
 `${b.titulo}\n\n${b.desc}\n\nSeras redirigida al sitio oficial de ${b.bankName} para activarlo.`,
 [
 { text: 'Cancelar', style: 'cancel' },
 { text: `Ir a ${b.bankName}`, onPress: () => Linking.openURL(b.url) },
 ]
 )}
 >
 <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>Canjear</Text>
 </TouchableOpacity>
 ) : (
 <View style={{ backgroundColor: '#F1EFE8', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
 <Text style={{ fontSize: 10, color: '#888' }}>{b.flores} flores</Text>
 </View>
 )}
 </View>
 );
 })}
 </View>
 )}

 {beneficiosTab === 'ganar' && (
 <View style={{ backgroundColor: '#FFF8E7', borderRadius: 12, padding: 12, gap: 10 }}>
 {COMO_GANAR.map((item, i) => (
 <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
 <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FFF0D0', alignItems: 'center', justifyContent: 'center' }}>
 <Ionicons name="flower-outline" size={14} color="#BA7517" />
 </View>
 <Text style={{ flex: 1, fontSize: 12, color: '#633806' }}>{item.label}</Text>
 <Text style={{ fontSize: 12, fontWeight: '700', color: '#BA7517' }}>+{item.pts}</Text>
 </View>
 ))}
 </View>
 )}
 </View>

 {/* ─── Logros ─── */}
 <View style={s.card}>
 <Text style={s.label}>LOGROS</Text>
 {ACHIEVEMENTS.map(ach => {
 const unlocked = profile.achievements.includes(ach.id);
 return (
 <View key={ach.id} style={[s.achRow, !unlocked && s.achLocked]}>
 <Text style={s.achIcon}>{unlocked ? ach.icon : '?'}</Text>
 <View style={{ flex: 1 }}>
 <Text style={[s.achTitle, !unlocked && s.achTitleLocked]}>{ach.label}</Text>
 <Text style={s.achDesc}>{ach.desc}</Text>
 </View>
 <View style={s.achReward}>
 <CempasuchilFlower size={14} opacity={unlocked ? 1 : 0.3} />
 <Text style={[s.achFlowers, !unlocked && { opacity: 0.3 }]}>+{ach.flowers}</Text>
 </View>
 </View>
 );
 })}
 </View>

 <View style={{ height: 40 }} />
 </ScrollView>
 </LinearGradient>
 );
}

const s = StyleSheet.create({
 con: { flex: 1 },
 hd: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12 },
 back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
 title: { flex: 1, fontSize: 18, fontWeight: '800', color: '#9D8189', textAlign: 'center' },
 saveBtn: { backgroundColor: '#F4ACB7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99 },
 saveTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
 scroll: { paddingHorizontal: 24, paddingTop: 8 },

 // Avatar
 avatarWrap: { alignSelf: 'center', width: 110, height: 110, borderRadius: 55, marginBottom: 4 },
 avatarImg: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: '#fff' },
 avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FFCAD4', borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 6 },
 cameraBadge: { position: 'absolute', bottom: 2, right: 2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#F4ACB7', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
 photoHint: { fontSize: 11, color: '#9D8189', opacity: 0.6, textAlign: 'center', marginBottom: 20 },

 // Cards
 card: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
 label: { fontSize: 10, fontWeight: '800', color: '#9D8189', opacity: 0.6, letterSpacing: 1.5, marginBottom: 10 },

 // Nombre
 nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
 nameText: { fontSize: 20, fontWeight: '800', color: '#9D8189', flex: 1 },
 nameInput: { flex: 1, fontSize: 20, fontWeight: '800', color: '#9D8189', borderBottomWidth: 2, borderBottomColor: '#F4ACB7', paddingVertical: 4 },

 // Flores
 flowerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
 flowerCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
 flowerNum: { fontSize: 18, fontWeight: '800', color: '#E8963B' },

 // Nivel
 levelWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
 levelBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3C57C', alignItems: 'center', justifyContent: 'center', elevation: 4 },
 levelNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
 levelTitle: { fontSize: 14, fontWeight: '700', color: '#9D8189', marginBottom: 4 },
 levelBar: { height: 8, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 2 },
 levelFill: { height: '100%', backgroundColor: '#F3C57C', borderRadius: 99 },
 levelHint: { fontSize: 10, color: '#9D8189', opacity: 0.5 },

 // Jardín visual
 gardenWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingVertical: 8, minHeight: 40 },
 moreFlowers: { fontSize: 14, fontWeight: '700', color: '#E8963B', alignSelf: 'center', marginLeft: 4 },
 noFlowers: { fontSize: 13, color: '#9D8189', opacity: 0.5, fontStyle: 'italic' },

 // Logros
 achRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
 achLocked: { opacity: 0.5 },
 achIcon: { fontSize: 24 },
 achTitle: { fontSize: 13, fontWeight: '700', color: '#9D8189' },
 achTitleLocked: { color: '#9D8189' },
 achDesc: { fontSize: 11, color: '#9D8189', opacity: 0.6 },
 achReward: { flexDirection: 'row', alignItems: 'center', gap: 2 },
 achFlowers: { fontSize: 11, fontWeight: '700', color: '#E8963B' },
});
