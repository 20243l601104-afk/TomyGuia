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

  const widgetHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { width: 100%; height: 100%; background: #FFF5F7; }
        #belvo { width: 100%; height: 100%; }
        #error {
          display: none; padding: 24px; text-align: center;
          font-family: sans-serif; color: #9D8189; margin-top: 40px;
        }
      </style>
    </head>
    <body>
      <div id="belvo"></div>
      <div id="error">
        <p style="font-size:18px; margin-bottom:8px">❌ No se pudo cargar</p>
        <p style="font-size:13px">Revisa tu conexión e intenta de nuevo</p>
      </div>

      <script>
        window.onerror = function(msg, src, line, col, err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'JS_ERROR', message: msg
          }));
          document.getElementById('error').style.display = 'block';
          return false;
        };
      </script>

      <script
        src="https://cdn.belvo.io/belvo-widget-1-stable.js"
        onload="initBelvo()"
        onerror="handleScriptError()"
      ></script>

      <script>
        function handleScriptError() {
          document.getElementById('error').style.display = 'block';
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SCRIPT_ERROR',
            message: 'No se pudo cargar el script de Belvo'
          }));
        }

        function initBelvo() {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRIPT_LOADED' }));
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
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'SUCCESS',
                    linkId: link,
                    institution: institution
                  }));
                },
                onExit: function(data) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'EXIT'
                  }));
                },
                onEvent: function(data) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'EVENT', data: data
                  }));
                }
              }
            ).build();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WIDGET_BUILT' }));
          } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'BUILD_ERROR', message: e.message
            }));
          }
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[Belvo]', data.type, data);

      switch (data.type) {
        case 'SUCCESS':
          onSuccess(data.linkId, data.institution);
          break;
        case 'EXIT':
          onClose();
          break;
        case 'SCRIPT_LOADED':
        case 'WIDGET_BUILT':
          setLoading(false);
          break;
        case 'SCRIPT_ERROR':
        case 'BUILD_ERROR':
        case 'JS_ERROR':
          setLoadError(true);
          setLoading(false);
          onError(data.message || 'Error cargando Belvo');
          break;
      }
    } catch (e) {
      console.log('[Belvo] parse error', e);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTxt}>Conecta tu banco</Text>
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* WebView */}
      <WebView
        ref={webviewRef}
        source={{ html: widgetHtml }}
        style={s.webview}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
        originWhitelist={['*']}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          // No quitamos el loading aquí, esperamos WIDGET_BUILT
        }}
        onError={(e) => {
          console.log('[Belvo WebView error]', e.nativeEvent);
          setLoadError(true);
          setLoading(false);
        }}
      />

      {/* Overlay de carga */}
      {loading && !loadError && (
        <View style={s.loadingOverlay}>
          <ActivityIndicator size="large" color="#F4ACB7" />
          <Text style={s.loadingTxt}>Cargando widget seguro...</Text>
        </View>
      )}

      {/* Error */}
      {loadError && (
        <View style={s.loadingOverlay}>
          <Text style={s.errorEmoji}>❌</Text>
          <Text style={s.errorTxt}>No se pudo cargar</Text>
          <Text style={s.errorSub}>Revisa que tengas internet y vuelve a intentar</Text>
          <TouchableOpacity style={s.retryBtn} onPress={onClose}>
            <Text style={s.retryTxt}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCAD4',
  },
  headerTxt: { fontSize: 16, fontWeight: '700', color: '#9D8189' },
  closeBtn: { padding: 4 },
  closeTxt: { fontSize: 18, color: '#9D8189' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF5F7',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingTxt: { fontSize: 15, color: '#9D8189', marginTop: 8 },
  errorEmoji: { fontSize: 40 },
  errorTxt: { fontSize: 18, fontWeight: '700', color: '#9D8189' },
  errorSub: { fontSize: 13, color: '#9D8189', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 8, backgroundColor: '#F4ACB7',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  retryTxt: { color: '#fff', fontWeight: '700' },
});
