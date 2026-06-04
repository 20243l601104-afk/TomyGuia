import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { BELVO_CONFIG } from '../constants/belvoConfig';

interface Props {
  onSuccess: (linkId: string, institution: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function BelvoWidget({ onSuccess, onError, onClose }: Props) {
  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const widgetHtml = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#FFF5F7}
#belvo{width:100%;height:100%}
</style>
</head>
<body>
<div id="belvo"></div>
<script>
(function() {
  var RN = window.ReactNativeWebView;
  var attempts = 0;
  var MAX = 40; // 40 x 300ms = 12 segundos máximo

  function send(obj) {
    RN.postMessage(JSON.stringify(obj));
  }

  function buildWidget() {
    try {
      belvoSDK.createWidget(
        '${BELVO_CONFIG.secretId}',
        '${BELVO_CONFIG.secretPassword}',
        {
          locale: 'es',
          country_codes: ['MX'],
          access_mode: 'recurrent',
          resources: ['ACCOUNTS', 'TRANSACTIONS'],
          callback: function(link, institution) {
            send({ type: 'SUCCESS', linkId: link, institution: institution });
          },
          onExit: function() {
            send({ type: 'EXIT' });
          },
          onEvent: function(data) {
            send({ type: 'EVENT', data: data });
          }
        }
      ).build();
      send({ type: 'WIDGET_BUILT' });
    } catch(e) {
      send({ type: 'BUILD_ERROR', message: e.message });
    }
  }

  function waitForSDK() {
    attempts++;
    if (typeof belvoSDK !== 'undefined') {
      send({ type: 'SDK_READY', attempts: attempts });
      buildWidget();
    } else if (attempts < MAX) {
      setTimeout(waitForSDK, 300);
    } else {
      send({ type: 'TIMEOUT', message: 'El SDK de Belvo no respondió. Verifica tu conexión.' });
    }
  }

  // Cargar script
  var s = document.createElement('script');
  s.src = 'https://cdn.belvo.io/belvo-widget-1-stable.js';
  s.onerror = function() {
    send({ type: 'SCRIPT_ERROR', message: 'No se pudo descargar el widget de Belvo.' });
  };
  document.head.appendChild(s);

  // Empezar a esperar el SDK
  setTimeout(waitForSDK, 300);
})();
</script>
</body>
</html>`;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[Belvo]', data.type, data.message || data.attempts || '');
      switch (data.type) {
        case 'WIDGET_BUILT':
          setLoading(false);
          break;
        case 'SUCCESS':
          onSuccess(data.linkId, data.institution);
          break;
        case 'EXIT':
          onClose();
          break;
        case 'SCRIPT_ERROR':
        case 'BUILD_ERROR':
        case 'TIMEOUT':
          setErrorMsg(data.message || 'Error desconocido');
          setLoadError(true);
          setLoading(false);
          break;
      }
    } catch (e) {}
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTxt}>Conecta tu banco</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      <WebView
        ref={webviewRef}
        source={{ html: widgetHtml }}
        style={s.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        thirdPartyCookiesEnabled
        onError={(e) => {
          setErrorMsg(e.nativeEvent.description);
          setLoadError(true);
          setLoading(false);
        }}
      />

      {loading && !loadError && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color="#F4ACB7" />
          <Text style={s.loadingTxt}>Conectando con tu banco...</Text>
          <Text style={s.loadingSub}>Esto puede tardar unos segundos</Text>
        </View>
      )}

      {loadError && (
        <View style={s.overlay}>
          <Text style={s.errorEmoji}>❌</Text>
          <Text style={s.errorTxt}>Algo salió mal</Text>
          <Text style={s.errorSub}>{errorMsg}</Text>
          <TouchableOpacity style={s.btn} onPress={() => {
            setLoadError(false);
            setLoading(true);
            setErrorMsg('');
          }}>
            <Text style={s.btnTxt}>Intentar de nuevo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 8 }}>
            <Text style={[s.btnTxt, { color: '#9D8189' }]}>Cerrar</Text>
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
  loadingTxt: { fontSize: 16, fontWeight: '700', color: '#9D8189' },
  loadingSub: { fontSize: 13, color: '#9D8189', opacity: 0.7 },
  errorEmoji: { fontSize: 44 },
  errorTxt: { fontSize: 18, fontWeight: '700', color: '#F4ACB7' },
  errorSub: { fontSize: 13, color: '#9D8189', textAlign: 'center', lineHeight: 20 },
  btn: {
    marginTop: 8, backgroundColor: '#F4ACB7',
    paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14,
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
