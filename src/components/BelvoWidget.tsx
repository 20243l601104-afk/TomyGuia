import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { BELVO_CONFIG } from '../constants/belvoConfig';

interface Props {
  onSuccess: (linkId: string, institution: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function BelvoWidget({ onSuccess, onError, onClose }: Props) {
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);

  // Paso 1: obtener access token y construir la URL del widget
  useEffect(() => {
    const getToken = async () => {
      try {
        const credentials = btoa(
          `${BELVO_CONFIG.secretId}:${BELVO_CONFIG.secretPassword}`
        );
        const res = await fetch(`${BELVO_CONFIG.sandboxUrl}/api/token/`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: BELVO_CONFIG.secretId,
            password: BELVO_CONFIG.secretPassword,
            scopes: 'read_institutions,write_links',
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Error ${res.status}: ${err}`);
        }

        const data = await res.json();
        const token = data.access;
        if (!token) throw new Error('No se recibió token de Belvo');

        // Construir URL oficial del widget de Belvo para WebView
        const url = `https://widget.belvo.io/?access_token=${token}&locale=es&country_codes=MX&access_mode=recurrent&resources=ACCOUNTS,TRANSACTIONS`;
        setWidgetUrl(url);
      } catch (e: any) {
        setErrorMsg(e.message || 'Error conectando con Belvo');
        setLoadError(true);
        setLoading(false);
      }
    };
    getToken();
  }, []);

  // Paso 2: escuchar eventos del widget via cambios de URL (deeplinks)
  const handleNavigationChange = (navState: any) => {
    const { url } = navState;
    if (!url) return;

    console.log('[Belvo URL]', url);

    // Belvo usa deeplinks para comunicar eventos
    // success: belvo://success?link=xxx&institution=xxx
    // exit:    belvo://exit
    if (url.includes('belvo://success') || url.includes('success?link=')) {
      const linkMatch       = url.match(/link=([^&]+)/);
      const institutionMatch = url.match(/institution=([^&]+)/);
      const linkId          = linkMatch ? decodeURIComponent(linkMatch[1]) : '';
      const institution     = institutionMatch ? decodeURIComponent(institutionMatch[1]) : '';
      onSuccess(linkId, institution);
    } else if (url.includes('belvo://exit') || url.includes('exit?')) {
      onClose();
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTxt}>Conecta tu banco</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* WebView con URL oficial de Belvo */}
      {widgetUrl && (
        <WebView
          source={{ uri: widgetUrl }}
          style={s.webview}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          originWhitelist={['*']}
          thirdPartyCookiesEnabled
          onNavigationStateChange={handleNavigationChange}
          onShouldStartLoadWithRequest={(request) => {
            const { url } = request;
            // Interceptar deeplinks de Belvo
            if (url.startsWith('belvo://') || url.includes('success?link=') || url.includes('exit?')) {
              handleNavigationChange({ url });
              return false; // no navegar, ya lo manejamos
            }
            return true;
          }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={(e) => {
            setErrorMsg(e.nativeEvent.description);
            setLoadError(true);
            setLoading(false);
          }}
        />
      )}

      {/* Cargando token o widget */}
      {loading && !loadError && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color="#F4ACB7" />
          <Text style={s.loadingTxt}>
            {widgetUrl ? 'Cargando banco...' : 'Autenticando...'}
          </Text>
        </View>
      )}

      {/* Error */}
      {loadError && (
        <View style={s.overlay}>
          <Text style={s.errorEmoji}>❌</Text>
          <Text style={s.errorTxt}>Algo salió mal</Text>
          <Text style={s.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={s.btn} onPress={onClose}>
            <Text style={s.btnTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
    backgroundColor: '#fff', borderBottomWidth: 1,
    borderBottomColor: '#FFCAD4',
  },
  headerTxt: { fontSize: 16, fontWeight: '700', color: '#9D8189' },
  closeTxt: { fontSize: 20, color: '#9D8189', padding: 4 },
  webview: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center', alignItems: 'center',
    gap: 10, padding: 32,
  },
  loadingTxt: { fontSize: 15, color: '#9D8189' },
  errorEmoji: { fontSize: 44 },
  errorTxt: { fontSize: 18, fontWeight: '700', color: '#F4ACB7' },
  errorSub: { fontSize: 13, color: '#9D8189', textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 8, backgroundColor: '#F4ACB7',
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14,
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
