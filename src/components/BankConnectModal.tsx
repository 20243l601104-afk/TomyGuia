import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ActivityIndicator, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import type { ConnectedBank, BankTransaction } from '../types';
import { BELVO_SECRET_ID, BELVO_SECRET_KEY } from '../constants/apiConfig';

const BELVO_ENV = 'sandbox';

// btoa no existe en Hermes/React Native — implementacion propia
function toBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  while (i < str.length) {
    const c1 = str.charCodeAt(i++);
    const c2 = str.charCodeAt(i++);
    const c3 = str.charCodeAt(i++);
    const e1 = c1 >> 2;
    const e2 = ((c1 & 3) << 4) | (c2 >> 4);
    const e3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (c3 >> 6);
    const e4 = isNaN(c3) ? 64 : c3 & 63;
    output += chars[e1] + chars[e2] + chars[e3] + chars[e4];
  }
  return output;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (bank: ConnectedBank, txs: BankTransaction[]) => void;
}

type Step = 'loading' | 'widget' | 'fetching' | 'done' | 'error';

export function BankConnectModal({ isOpen, onClose, onConnected }: Props) {
  const [step, setStep]         = useState<Step>('loading');
  const [accessToken, setAccessToken] = useState<string>('');
  const [linkId, setLinkId]     = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const webviewRef = useRef<WebView>(null);

  // ── 1. Al abrir: obtener access_token de Belvo ──────────────────────────────
  const obtenerToken = async () => {
    setStep('loading');
    try {
      // Belvo Widget necesita el access token via POST a /api/token/
      // con autenticacion Basic usando Secret-ID:Secret-Key
      const credentials = toBase64(BELVO_SECRET_ID + ':' + BELVO_SECRET_KEY);
      const res = await fetch('https://sandbox.belvo.com/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          id: BELVO_SECRET_ID,
          password: BELVO_SECRET_KEY,
          scopes: 'read_institutions,write_links,read_accounts,read_balances,read_owners',
        }),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        // Mostrar el error real de Belvo para debug
        const msg = data.detail || data.message || `Error ${res.status}`;
        throw new Error(msg);
      }

      if (data.access) {
        setAccessToken(data.access);
        setStep('widget');
      } else {
        throw new Error('Belvo no devolvio un token valido');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'No se pudo conectar con Belvo');
      setStep('error');
    }
  };

  // ── 2. Obtener transacciones del link recién creado ──────────────────────────
  const obtenerTransacciones = async (newLinkId: string) => {
    setStep('fetching');
    try {
      const credentials = toBase64(BELVO_SECRET_ID + ':' + BELVO_SECRET_KEY);

      // Obtener info de la cuenta
      const accRes = await fetch(
        `https://sandbox.belvo.com/api/accounts/?link=${newLinkId}`,
        { headers: { 'Authorization': `Basic ${credentials}` } }
      );
      const accData = await accRes.json();
      const cuenta = accData.results?.[0];

      // Obtener transacciones del mes actual
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
        .toISOString().split('T')[0];
      const finMes = hoy.toISOString().split('T')[0];

      const txRes = await fetch(
        `https://sandbox.belvo.com/api/transactions/?link=${newLinkId}&date_from=${inicioMes}&date_to=${finMes}`,
        { headers: { 'Authorization': `Basic ${credentials}` } }
      );
      const txData = await txRes.json();
      const rawTxs = txData.results || [];

      // Mapear transacciones al formato de TomyGuia
      const txs: BankTransaction[] = rawTxs
        .filter((t: any) => t.type === 'OUTFLOW')
        .map((t: any, i: number) => ({
          id: Date.now() + i,
          amount: Math.abs(t.amount),
          label: t.description || t.merchant?.name || 'Gasto',
          category: categorizarGasto(t.category || ''),
          source: 'card' as const,
        }));

      // Armar ConnectedBank
      const bank: ConnectedBank = {
        id: newLinkId,
        name: cuenta?.institution?.name || 'Banco conectado',
        color: '#820AD1',
        last4: cuenta?.number?.slice(-4) || '••••',
        connectedAt: Date.now(),
      };

      setStep('done');
      setTimeout(() => {
        onConnected(bank, txs);
        handleClose();
      }, 1500);

    } catch (e: any) {
      setErrorMsg('Error al obtener movimientos. Intenta de nuevo.');
      setStep('error');
    }
  };

  // ── Categorización simple por tipo Belvo ─────────────────────────────────────
  const categorizarGasto = (category: string): 'needs' | 'wants' => {
    const needs = ['BILLS_UTILITIES', 'GROCERIES', 'HEALTH', 'TRANSPORT',
                   'EDUCATION', 'HOUSING', 'INSURANCE'];
    return needs.some(n => category.includes(n)) ? 'needs' : 'wants';
  };

  // ── Manejar mensajes del WebView (eventos Belvo Widget) ──────────────────────
  const handleWebViewMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.eventName === 'SUCCESS') {
        const newLinkId = msg.meta?.link || msg.link_id || '';
        setLinkId(newLinkId);
        obtenerTransacciones(newLinkId);
      } else if (msg.eventName === 'EXIT') {
        handleClose();
      } else if (msg.eventName === 'ERROR') {
        setErrorMsg(msg.meta?.error_message || 'Error en la conexion');
        setStep('error');
      }
    } catch {}
  };

  // ── HTML del widget Belvo ─────────────────────────────────────────────────────
  const belvoWidgetHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, sans-serif; background: #fff8fa; }
    #belvo { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="belvo"></div>
  <script src="https://cdn.belvo.io/belvo-widget-1-stable.js"></script>
  <script>
    function successCallback(link, institution) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        eventName: 'SUCCESS',
        meta: { link: link, institution: institution }
      }));
    }
    function onExitCallback() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ eventName: 'EXIT' }));
    }
    function onEventCallback(eventName, meta) {
      if (eventName === 'ERROR') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          eventName: 'ERROR',
          meta: meta
        }));
      }
    }
    belvoSDK.createWidget("${accessToken}", {
      callback: successCallback,
      onExit: onExitCallback,
      onEvent: onEventCallback,
      country_codes: ['MX'],
      locale: 'es',
      access_mode: 'recurrent',
    }).build();
  </script>
</body>
</html>`;

  const handleClose = () => {
    setStep('loading');
    setAccessToken('');
    setLinkId('');
    setErrorMsg('');
    onClose();
  };

  return (
    <Modal
      visible={isOpen}
      transparent={step !== 'widget'}
      animationType="slide"
      onRequestClose={handleClose}
      onShow={obtenerToken}
    >
      {/* Widget Belvo — pantalla completa */}
      {step === 'widget' && (
        <View style={s.fullscreen}>
          <View style={s.widgetHeader}>
            <TouchableOpacity onPress={handleClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color="#9D8189" />
            </TouchableOpacity>
            <Text style={s.widgetTitle}>Conecta tu banco</Text>
            <View style={{ width: 36 }} />
          </View>
          <WebView
            ref={webviewRef}
            source={{ html: belvoWidgetHTML }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled
            domStorageEnabled
            allowUniversalAccessFromFileURLs
            mixedContentMode="always"
            originWhitelist={['*']}
            style={{ flex: 1 }}
          />
        </View>
      )}

      {/* Estados no-widget — bottom sheet */}
      {step !== 'widget' && (
        <>
          <TouchableOpacity
            style={s.overlay}
            activeOpacity={1}
            onPress={step === 'loading' ? undefined : handleClose}
          />
          <View style={s.sheet}>
            <View style={s.handle} />

            {/* Cargando token */}
            {step === 'loading' && (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#F4ACB7" />
                <Text style={s.loadingTitle}>Preparando conexion segura</Text>
                <Text style={s.loadingSub}>Conectando con Belvo...</Text>
              </View>
            )}

            {/* Obteniendo transacciones */}
            {step === 'fetching' && (
              <View style={s.center}>
                <ActivityIndicator size="large" color="#85A89E" />
                <Text style={s.loadingTitle}>Importando movimientos</Text>
                <Text style={s.loadingSub}>Esto toma unos segundos...</Text>
                <View style={s.steps}>
                  <StepRow text="Banco conectado" done />
                  <StepRow text="Obteniendo transacciones" loading />
                </View>
              </View>
            )}

            {/* Listo */}
            {step === 'done' && (
              <View style={s.center}>
                <View style={s.doneCircle}>
                  <Ionicons name="checkmark" size={44} color="#fff" />
                </View>
                <Text style={s.doneTitle}>Banco conectado</Text>
                <Text style={s.doneSub}>
                  Tus movimientos del mes ya estan en tu presupuesto
                </Text>
              </View>
            )}

            {/* Error */}
            {step === 'error' && (
              <View style={s.center}>
                <View style={[s.doneCircle, { backgroundColor: '#FF8A80' }]}>
                  <Ionicons name="close" size={44} color="#fff" />
                </View>
                <Text style={s.doneTitle}>Algo salio mal</Text>
                <Text style={s.doneSub}>{errorMsg}</Text>
                <TouchableOpacity style={s.retryBtn} onPress={obtenerToken}>
                  <Text style={s.retryTxt}>Intentar de nuevo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.skipBtn} onPress={handleClose}>
                  <Text style={s.skipTxt}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </Modal>
  );
}

function StepRow({ text, done, loading }: { text: string; done?: boolean; loading?: boolean }) {
  return (
    <View style={sr.row}>
      {loading
        ? <ActivityIndicator size="small" color="#F4ACB7" />
        : <Ionicons name="checkmark-circle" size={18} color="#85A89E" />
      }
      <Text style={[sr.txt, loading && { color: '#F4ACB7' }]}>{text}</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  txt: { fontSize: 13, color: '#9D8189', fontWeight: '500' },
});

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    minHeight: 240,
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: '#D8E2DC',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0E8',
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9D8189',
  },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingTitle: {
    fontSize: 18, fontWeight: '700', color: '#9D8189', marginTop: 8,
  },
  loadingSub: {
    fontSize: 13, color: '#9D8189', opacity: 0.7,
  },
  steps: {
    marginTop: 16, gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  doneCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#85A89E',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 20, fontWeight: '800', color: '#F4ACB7',
  },
  doneSub: {
    fontSize: 13, color: '#9D8189',
    textAlign: 'center', lineHeight: 20,
    paddingHorizontal: 20,
  },
  retryBtn: {
    backgroundColor: '#F4ACB7',
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 20, marginTop: 8,
  },
  retryTxt: { fontSize: 14, fontWeight: '700', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 10 },
  skipTxt: { fontSize: 14, color: '#9D8189', fontWeight: '600' },
});
