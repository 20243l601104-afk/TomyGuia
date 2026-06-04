import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

interface Props {
  onGoogle: (user: { name: string; email: string; photoUri: string | null }) => void;
  onSkip: () => void;
}

export function AuthScreen({ onGoogle, onSkip }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '544990341254-1pafv6o1mau326ntl8320uffkf0sr0oi.apps.googleusercontent.com',
    webClientId: '544990341254-mqq6hr0ll202hhkvkeh1rhu4krvhk6o7.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ scheme: 'com.tomyguia.app' }),
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      setLoading(true);
      const { authentication } = response;
      fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${authentication?.accessToken}` },
      })
        .then(r => r.json())
        .then(user => {
          onGoogle({
            name: user.given_name || user.name || 'Usuario',
            email: user.email,
            photoUri: user.picture || null,
          });
        })
        .catch(() => setError('No se pudo obtener tu perfil de Google'))
        .finally(() => setLoading(false));
    } else if (response?.type === 'error') {
      setError('Error al conectar con Google');
    }
  }, [response]);

  return (
    <View style={s.container}>
      {/* Fondo decorativo */}
      <View style={s.blob1} />
      <View style={s.blob2} />

      {/* Logo / ilustración */}
      <View style={s.logoArea}>
        <View style={s.logoCircle}>
          <Text style={s.logoEmoji}>🌸</Text>
        </View>
        <Text style={s.appName}>TomyGuía</Text>
        <Text style={s.tagline}>Tu guía de finanzas personales</Text>
      </View>

      {/* Card de login */}
      <View style={s.card}>
        <Text style={s.welcomeTitle}>¡Bienvenida de nuevo!</Text>
        <Text style={s.welcomeSub}>Inicia sesión para continuar</Text>

        {error ? (
          <View style={s.errorBox}>
            <Text style={s.errorTxt}>{error}</Text>
          </View>
        ) : null}

        {/* Botón Google */}
        <TouchableOpacity
          style={s.googleBtn}
          onPress={() => {
            setError('');
            promptAsync();
          }}
          disabled={!request || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <View style={s.googleIcon}>
                <Text style={{ fontSize: 18 }}>G</Text>
              </View>
              <Text style={s.googleTxt}>Continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={s.separator}>
          <View style={s.line} />
          <Text style={s.separatorTxt}>o</Text>
          <View style={s.line} />
        </View>

        {/* Continuar sin cuenta */}
        <TouchableOpacity style={s.skipBtn} onPress={onSkip} activeOpacity={0.7}>
          <Ionicons name="person-outline" size={18} color="#9D8189" />
          <Text style={s.skipTxt}>Continuar sin cuenta</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          Al continuar aceptas que tus datos se guardan localmente en tu dispositivo
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE5D9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blob1: {
    position: 'absolute', top: '-5%', right: '-10%',
    width: 256, height: 256, borderRadius: 999,
    backgroundColor: '#F4ACB730',
  },
  blob2: {
    position: 'absolute', bottom: '15%', left: '-15%',
    width: 300, height: 300, borderRadius: 999,
    backgroundColor: '#D8E2DC40',
  },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center', elevation: 8,
    marginBottom: 16,
  },
  logoEmoji: { fontSize: 48 },
  appName: { fontSize: 32, fontWeight: '800', color: '#F4ACB7', marginBottom: 4 },
  tagline: { fontSize: 14, color: '#9D8189', opacity: 0.8 },
  card: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 28, padding: 24,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 22, fontWeight: '800',
    color: '#9D8189', textAlign: 'center', marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 14, color: '#9D8189',
    opacity: 0.7, textAlign: 'center', marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FFF0F0', borderRadius: 12,
    padding: 10, marginBottom: 16,
  },
  errorTxt: { fontSize: 13, color: '#D64545', textAlign: 'center' },
  googleBtn: {
    backgroundColor: '#F4ACB7', borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 10, elevation: 4,
  },
  googleIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center',
  },
  googleTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  separator: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 10,
  },
  line: { flex: 1, height: 1, backgroundColor: '#F0E0E5' },
  separatorTxt: { fontSize: 13, color: '#9D8189', opacity: 0.6 },
  skipBtn: {
    borderWidth: 1.5, borderColor: '#FFCAD4',
    borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  skipTxt: { fontSize: 15, fontWeight: '600', color: '#9D8189' },
  disclaimer: {
    fontSize: 11, color: '#9D8189', opacity: 0.5,
    textAlign: 'center', marginTop: 16, lineHeight: 16,
  },
});
