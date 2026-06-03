import React, { useRef } from 'react';
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

  // HTML que carga el widget oficial de Belvo
  const widgetHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #FFF5F7; font-family: sans-serif; }
        #belvo { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="belvo"></div>
      <script src="https://cdn.belvo.io/belvo-widget-1-stable.js"></script>
      <script>
        function successCallbackFunction(link, institution) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'SUCCESS',
            linkId: link,
            institution: institution
          }));
        }

        function onExitCallbackFunction(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXIT',
            data: data
          }));
        }

        function onEventCallbackFunction(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EVENT',
            data: data
          }));
        }

        belvoSDK.createWidget(
          '${BELVO_CONFIG.secretId}',
          '${BELVO_CONFIG.secretPassword}',
          {
            locale: 'es',
            country_codes: ['MX'],
            access_mode: 'recurrent',
            resources: ['ACCOUNTS', 'TRANSACTIONS'],
            callback: successCallbackFunction,
            onExit: onExitCallbackFunction,
            onEvent: onEventCallbackFunction,
          }
        ).build();
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SUCCESS') {
        onSuccess(data.linkId, data.institution);
      } else if (data.type === 'EXIT') {
        onClose();
      }
    } catch (e) {
      onError('Error al procesar respuesta del banco');
    }
  };

  return (
    <View style={s.container}>
      {/* Botón cerrar */}
      <TouchableOpacity style={s.closeBtn} onPress={onClose}>
        <Text style={s.closeTxt}>✕ Cerrar</Text>
      </TouchableOpacity>

      <WebView
        ref={webviewRef}
        source={{ html: widgetHtml }}
        style={s.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={s.loading}>
            <ActivityIndicator size="large" color="#F4ACB7" />
            <Text style={s.loadingTxt}>Cargando banco seguro...</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F7',
  },
  closeBtn: {
    padding: 14,
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCAD4',
  },
  closeTxt: {
    color: '#9D8189',
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
  },
  loadingTxt: {
    marginTop: 12,
    color: '#9D8189',
    fontSize: 14,
  },
});
