import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';
import type { UserProfile } from '../types';

const C = { ROSA: '#F4ACB7', CLARO: '#FFCAD4', MELON: '#FFE5D9', MENTA: '#D8E2DC', MALVA: '#9D8189', VERDE: '#5B776F', AMARILLO: '#F3C57C', NARANJA: '#E8963B' };

/* ─── Flor de cempasúchil SVG ─── */
function CempasuchilFlower({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) {
  return (
    <Text style={{ fontSize: size, opacity }}>🌼</Text>
  );
}

/* ─── Logros ─── */
const ACHIEVEMENTS = [
  { id: 'onboarding', label: 'Primeros pasos', desc: 'Completaste el registro', flowers: 5, icon: '🌱' },
  { id: 'first_expense', label: 'Primera cuenta', desc: 'Registraste tu primer gasto', flowers: 3, icon: '📝' },
  { id: 'calendar_set', label: 'Organizada', desc: 'Asignaste todos tus gastos al calendario', flowers: 5, icon: '📅' },
  { id: 'first_income', label: 'Llegó el dinero', desc: 'Registraste tu primer ingreso', flowers: 3, icon: '💰' },
  { id: 'emergency_10', label: 'Colchoncito', desc: 'Tu fondo de emergencia llegó al 10%', flowers: 10, icon: '🛡️' },
  { id: 'emergency_50', label: 'Medio camino', desc: 'Tu fondo de emergencia llegó al 50%', flowers: 20, icon: '⭐' },
  { id: 'emergency_100', label: '¡Meta cumplida!', desc: 'Completaste tu fondo de emergencia', flowers: 50, icon: '🏆' },
  { id: 'week_streak', label: 'Constante', desc: 'Registraste gastos toda la semana', flowers: 8, icon: '🔥' },
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

        {/* ─── Avatar grande ─── */}
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
                placeholder="¿Cómo te llamas?"
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

        {/* ─── Flores de cempasúchil (puntos) ─── */}
        <View style={s.card}>
          <View style={s.flowerHeader}>
            <Text style={s.label}>MIS FLORES DE CEMPASÚCHIL</Text>
            <View style={s.flowerCount}>
              <CempasuchilFlower size={18} />
              <Text style={s.flowerNum}>{profile.flowers}</Text>
            </View>
          </View>

          {/* Nivel */}
          <View style={s.levelWrap}>
            <View style={s.levelBadge}>
              <Text style={s.levelNum}>{level}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.levelTitle}>{levelTitle}</Text>
              <View style={s.levelBar}>
                <View style={[s.levelFill, { width: `${levelProgress}%` as any }]} />
              </View>
              <Text style={s.levelHint}>{flowersInLevel}/10 para el siguiente nivel</Text>
            </View>
          </View>

          {/* Flores visuales */}
          <View style={s.gardenWrap}>
            {Array.from({ length: Math.min(profile.flowers, 30) }).map((_, i) => (
              <CempasuchilFlower key={i} size={22} opacity={0.6 + (i / 30) * 0.4} />
            ))}
            {profile.flowers > 30 && (
              <Text style={s.moreFlowers}>+{profile.flowers - 30}</Text>
            )}
            {profile.flowers === 0 && (
              <Text style={s.noFlowers}>Completa logros para ganar flores 🌱</Text>
            )}
          </View>
        </View>

        {/* ─── Logros ─── */}
        <View style={s.card}>
          <Text style={s.label}>LOGROS</Text>
          {ACHIEVEMENTS.map(ach => {
            const unlocked = profile.achievements.includes(ach.id);
            return (
              <View key={ach.id} style={[s.achRow, !unlocked && s.achLocked]}>
                <Text style={s.achIcon}>{unlocked ? ach.icon : '🔒'}</Text>
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
