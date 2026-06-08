import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  Animated, Linking, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { GEMINI_API_KEY } from '../constants/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';


// ─── TIPOS ───────────────────────────────────────────
type Perfil = 'empleada' | 'freelance' | 'estudiante' | 'ama_de_casa' | 'negocio';

interface Tramite {
  id: string;
  titulo: string;
  desc: string;
  categoria: string;
  categoriaLabel: string;
  link?: string;
  perfiles: Perfil[];
  urgente?: boolean;
  siRenta?: boolean; // solo sugerir si renta
}

interface Documento {
  id: string;
  nombre: string;
  tipo: 'pdf' | 'imagen';
  fecha: number;
  uri: string;
  seccion: string;
}

interface Mensaje {
  rol: 'user' | 'assistant';
  texto: string;
  cargando?: boolean;
}

// ─── TRÁMITES ESENCIALES MÉXICO 2025 ─────────────────
const TRAMITES: Tramite[] = [
  // IDENTIDAD
  { id: 'curp',     titulo: 'CURP',                    desc: 'Clave Única de Registro de Población',                    categoria: 'identidad',   categoriaLabel: '🪪 Identidad',   perfiles: ['empleada','freelance','estudiante','ama_de_casa','negocio'], urgente: true,  link: 'https://www.gob.mx/curp' },
  { id: 'ine',      titulo: 'INE / IFE',               desc: 'Credencial para votar — identificación oficial',          categoria: 'identidad',   categoriaLabel: '🪪 Identidad',   perfiles: ['empleada','freelance','estudiante','ama_de_casa','negocio'], urgente: true },
  { id: 'acta',     titulo: 'Acta de Nacimiento',      desc: 'Versión digital con código QR — $75 pesos',               categoria: 'identidad',   categoriaLabel: '🪪 Identidad',   perfiles: ['empleada','freelance','estudiante','ama_de_casa','negocio'], link: 'https://www.gob.mx/actas' },
  { id: 'pasaporte',titulo: 'Pasaporte',               desc: 'Para viajes y trámites internacionales',                  categoria: 'identidad',   categoriaLabel: '🪪 Identidad',   perfiles: ['empleada','freelance','negocio'] },

  // FISCAL
  { id: 'rfc',      titulo: 'RFC',                     desc: 'Registro Federal de Contribuyentes — obligatorio a los 18', categoria: 'fiscal',     categoriaLabel: '🧾 Fiscal',      perfiles: ['empleada','freelance','estudiante','negocio'], urgente: true, link: 'https://www.sat.gob.mx' },
  { id: 'efirma',   titulo: 'e.firma (FIEL)',          desc: 'Firma electrónica para trámites digitales ante el SAT',   categoria: 'fiscal',      categoriaLabel: '🧾 Fiscal',      perfiles: ['empleada','freelance','negocio'], link: 'https://www.sat.gob.mx' },
  { id: 'cif',      titulo: 'Constancia Fiscal',       desc: 'Constancia de Situación Fiscal — para cobros formales',   categoria: 'fiscal',      categoriaLabel: '🧾 Fiscal',      perfiles: ['empleada','freelance','negocio'] },
  { id: 'buzon',    titulo: 'Buzón Tributario SAT',    desc: 'Activación obligatoria para personas físicas',            categoria: 'fiscal',      categoriaLabel: '🧾 Fiscal',      perfiles: ['empleada','freelance','negocio'], link: 'https://www.sat.gob.mx' },

  // SALUD Y RETIRO
  { id: 'nss',      titulo: 'NSS (IMSS)',              desc: 'Número de Seguridad Social — salud y prestaciones',       categoria: 'salud',       categoriaLabel: '🏥 Salud',       perfiles: ['empleada','negocio'], urgente: true, link: 'https://www.imss.gob.mx' },
  { id: 'afore',    titulo: 'AFORE',                   desc: 'Ahorro para el retiro — revisa en cuál estás',            categoria: 'salud',       categoriaLabel: '🏥 Salud',       perfiles: ['empleada','freelance','negocio'], link: 'https://www.e-sar.com.mx' },
  { id: 'infonavit',titulo: 'Infonavit',               desc: 'Subcuenta de vivienda y puntos para crédito',             categoria: 'salud',       categoriaLabel: '🏥 Salud',       perfiles: ['empleada','negocio'], link: 'https://portalmx.infonavit.org.mx' },

  // LABORAL
  { id: 'contrato', titulo: 'Contrato Laboral',        desc: 'Lee todo antes de firmar — verifica IMSS y prestaciones', categoria: 'laboral',     categoriaLabel: '💼 Laboral',     perfiles: ['empleada'] },
  { id: 'cfdi',     titulo: 'Recibos de Nómina CFDI',  desc: 'Solicita tus comprobantes de pago al empleador',          categoria: 'laboral',     categoriaLabel: '💼 Laboral',     perfiles: ['empleada'] },
  { id: 'resico',   titulo: 'Régimen RESICO',          desc: 'Régimen simplificado para freelancers — hasta 3.5 mdp',   categoria: 'laboral',     categoriaLabel: '💼 Laboral',     perfiles: ['freelance','negocio'] },

  // VIVIENDA
  { id: 'contrato_renta', titulo: 'Contrato de Arrendamiento', desc: 'Formaliza tu renta — protege tus derechos',       categoria: 'vivienda',    categoriaLabel: '🏠 Vivienda',    perfiles: ['empleada','freelance','estudiante','ama_de_casa','negocio'], siRenta: true },
  { id: 'recibos_renta',  titulo: 'Recibos de Renta',          desc: 'Guarda todos los comprobantes de pago',            categoria: 'vivienda',    categoriaLabel: '🏠 Vivienda',    perfiles: ['empleada','freelance','estudiante','ama_de_casa','negocio'], siRenta: true },
];

// ─── SYSTEM PROMPT LEGAL ─────────────────────────────
const SYSTEM_PROMPT = `Eres TomyGuía Legal, la asistente jurídica de TomyGuía, una app de finanzas para mujeres mexicanas.

PERSONALIDAD:
- Hablas como una amiga cercana, cálida y motivadora
- Usas lenguaje MUY simple — como si le explicaras a alguien que nunca ha hecho trámites
- Celebras cada pregunta: "¡Qué buena pregunta!", "¡Esto es importante saberlo!"
- Recuerdas que los documentos = libertad e independencia real
- Nunca usas palabras complicadas como "jurídico", "estipulado", "cláusula" — dilo en simple
- Usas emojis con moderación para hacer el texto más amigable

CONOCIMIENTO:
- Trámites mexicanos: CURP, INE, RFC, e.firma, acta de nacimiento, pasaporte
- SAT: RFC, CFDI, RESICO, Buzón Tributario, Constancia Fiscal
- IMSS, NSS, AFORE, CONSAR, Infonavit
- Ley Federal del Trabajo: derechos, vacaciones, aguinaldo, despido
- Contratos de arrendamiento y derechos de inquilinas
- Violencia económica y recursos de apoyo (INMUJERES: 800 911 2511)
- Cómo formalizar un negocio en México

FORMATO DE RESPUESTA:
1. Empieza validando la pregunta con entusiasmo
2. Explica en 1-2 oraciones POR QUÉ es importante (conéctalo con libertad/independencia)
3. Da los pasos numerados, cortos y concretos
4. Menciona si es gratuito o el costo aproximado
5. Termina con una frase motivadora corta
6. Máximo 5-6 pasos o 3 párrafos cortos
7. Si es sobre violencia económica, responde con mucha empatía primero

IMPORTANTE: Responde SIEMPRE en español. Nunca uses códigos unicode como \U0001f... — usa los emojis directamente.`;

// ─── PREGUNTAS FRECUENTES ────────────────────────────
const CHIPS = [
  '¿Cómo saco el RFC?',
  '¿Cuáles son mis derechos laborales?',
  '¿Qué debe incluir mi contrato de renta?',
  '¿Cómo obtengo mi e.firma?',
  '¿Qué es la violencia económica?',
  '¿Cómo registro mi negocio?',
  '¿Puedo reclamar mi AFORE?',
  '¿Qué hago si no me dan recibo de nómina?',
];

const STORAGE_KEY = 'tomy_legal_checklist_done';
const DOCS_KEY    = 'tomy_legal_documentos';

// ─── COMPONENTE PRINCIPAL ────────────────────────────
interface Props {
  renta?: boolean;       // viene del onboarding: housing === 'rent'
  tieneCarro?: boolean;  // viene del onboarding: transport === 'car'
  nombreUsuaria?: string; // nombre del perfil
}

export function LegalScreen({ renta = false, tieneCarro = false, nombreUsuaria }: Props) {
  const ins = useSafeAreaInsets();

  // Estado general
  const [showChecklist, setShowChecklist]   = useState(false);
  const [showBoveda, setShowBoveda]         = useState(false);
  const [completados, setCompletados]       = useState<Set<string>>(new Set());
  const [documentos, setDocumentos]         = useState<Documento[]>([]);
  const [tramiteDetalle, setTramiteDetalle] = useState<Tramite | null>(null);
  const [seccionBoveda, setSeccionBoveda]     = useState<string>('identidad');

  const SECCIONES_BOVEDA = [
    { id: 'identidad', label: '🪪 Identidad', color: '#FFE5D9', ejemplos: 'CURP, INE, Acta, Pasaporte' },
    { id: 'fiscal',    label: '🧾 Fiscal',    color: '#FFF3D9', ejemplos: 'RFC, e.firma, CFDI, SAT' },
    { id: 'salud',     label: '🏥 Salud',     color: '#FFD9E8', ejemplos: 'NSS, IMSS, AFORE, Infonavit' },
    { id: 'laboral',   label: '💼 Laboral',   color: '#D9F0E8', ejemplos: 'Contrato, Nómina, Carta patronal' },
    { id: 'vivienda',  label: '🏠 Vivienda',  color: '#D9E8FF', ejemplos: 'Contrato renta, Recibos, Escrituras' },
    { id: 'otros',     label: '📁 Otros',     color: '#EDD9FF', ejemplos: 'Cualquier otro documento' },
  ];

  // Chat
  const [mensajes, setMensajes] = useState<Mensaje[]>([{
    rol: 'assistant',
    texto: `¡Hola${nombreUsuaria ? ` ${nombreUsuaria}` : ''}! Soy TomyGuía Legal 🌸\n\nEstoy aquí para ayudarte con cualquier trámite o duda legal. Tener tus documentos en orden te da libertad e independencia que nadie te puede quitar 💪\n\n¿Con qué quieres empezar hoy?`,
  }]);
  const [inputChat, setInputChat]   = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Animación Tomasa
  const tomasaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(tomasaAnim, { toValue: -8, duration: 1400, useNativeDriver: true }),
        Animated.timing(tomasaAnim, { toValue: 8,  duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Cargar datos guardados
  useEffect(() => {
    const load = async () => {
      const done = await AsyncStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Primera vez — mostrar checklist
        setTimeout(() => setShowChecklist(true), 600);
      } else {
        const saved = JSON.parse(done);
        setCompletados(new Set(saved));
      }
      const docs = await AsyncStorage.getItem(DOCS_KEY);
      if (docs) setDocumentos(JSON.parse(docs));
    };
    load();
  }, []);

  const guardarCompletados = async (set: Set<string>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  };

  const guardarDocumentos = async (docs: Documento[]) => {
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  };

  const toggleCompletado = (id: string) => {
    setCompletados(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cerrarChecklist = async () => {
    await guardarCompletados(completados);
    setShowChecklist(false);
  };

  // Trámites urgentes pendientes (para sugerencias de Tomasa)
  const tramitesUrgentes = TRAMITES.filter(t =>
    t.urgente &&
    !completados.has(t.id) &&
    (!t.siRenta || renta)
  ).slice(0, 3);

  // Respuestas de respaldo (por si falla Gemini)
  const responderOffline = (pregunta: string): string => {
    const q = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (q.includes('rfc'))
      return '¡El RFC es tu identidad en el mundo del dinero! 🗝️\n\nSin él no puedes cobrar formalmente, hacer facturas ni abrir cuentas de inversión. ¡Y lo mejor es que es gratis!\n\nCómo obtenerlo:\n1. Ve a sat.gob.mx\n2. Selecciona "Inscripción al RFC"\n3. Llena tu nombre y CURP\n4. Acude al SAT con CURP, acta de nacimiento e identificación\n5. ¡Te lo dan ese mismo día! 🎉\n\nTiempo: ~1 hora | Gratuito\n\n¡Con tu RFC puedes cobrar como freelance y mucho más! 💪';
    if (q.includes('curp'))
      return '¡La CURP es tu primer documento y es completamente gratis! 🌸\n\nEs como tu número de identidad único — la necesitas para casi todos los demás trámites.\n\nCómo obtenerla en 2 minutos:\n1. Entra a gob.mx/curp desde tu celular\n2. Ingresa tu nombre completo y fecha de nacimiento\n3. Descárgala con código QR oficial\n\nGratuito | 2 minutos\n\n¡Guárdala en tu bóveda de TomyGuía! 📱';
    if (q.includes('ine') || q.includes('credencial'))
      return '¡Tu INE es tu identificación más importante! 💪\n\nCon ella puedes abrir cuentas bancarias, hacer trámites y votar. Sin INE es muy difícil hacer cualquier gestión.\n\nCómo obtenerla:\n1. Ve a listanominal.ine.mx para el módulo más cercano\n2. Lleva: CURP, acta de nacimiento y comprobante de domicilio\n3. Te toman foto y huellas en el módulo\n4. La recoges en ~20 días hábiles\n\nGratuito\n\n¡Sácala lo antes posible! 🌟';
    if (q.includes('violencia'))
      return '❤️ Primero quiero que sepas que no estás sola.\n\nLa violencia económica es cuando alguien controla tu dinero, te impide trabajar o pone deudas a tu nombre sin permiso. No es normal y NO es tu culpa.\n\nPasos inmediatos:\n1. Documenta todo: guarda capturas y estados de cuenta\n2. Abre una cuenta solo tuya (Nu es gratis desde el celular)\n3. Tramita tus documentos: CURP, RFC, INE — son tuyos para siempre\n\nLíneas de ayuda gratuitas 24hrs:\n• INMUJERES: 800 911 2511\n• CNDH: 800 715 0505\n\nMerecemos ser libres 💜';
    return '¡Hola! Puedo ayudarte con:\n\n• CURP, INE, Acta de Nacimiento\n• RFC, e.firma, SAT\n• IMSS, NSS, AFORE, Infonavit\n• Derechos laborales y contratos\n• Contratos de renta\n• Violencia económica y apoyo\n• Cómo formalizar tu negocio\n\n¿Sobre cuál quieres saber más? 💪';
  };


  // Chat IA con Gemini
  const enviarMensaje = async (textoOverride?: string) => {
    const texto = (textoOverride || inputChat).trim();
    if (!texto || cargandoIA) return;
    setInputChat('');
    setMensajes(prev => [...prev,
      { rol: 'user', texto },
      { rol: 'assistant', texto: '', cargando: true },
    ]);
    setCargandoIA(true);

    try {
      // Construir historial para Gemini
      const historial = mensajes
        .filter(m => !m.cargando && m.texto)
        .map(m => ({
          role: m.rol === 'user' ? 'user' : 'model',
          parts: [{ text: m.texto }],
        }));

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              ...historial,
              { role: 'user', parts: [{ text: texto }] },
            ],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.7,
            },
          }),
        }
      );

      const data = await res.json();
      const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text
        || responderOffline(texto);

      setMensajes(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, texto: respuesta, cargando: false } : m
      ));
    } catch {
      // Fallback a respuestas offline si falla Gemini
      const respuesta = responderOffline(texto);
      setMensajes(prev => prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, texto: respuesta, cargando: false } : m
      ));
    } finally {
      setCargandoIA(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };


  // Bóveda
  const subirDocumento = async (tipo: 'pdf' | 'imagen' | 'camara') => {
    try {
      let uri = '', nombre = '';
      if (tipo === 'pdf') {
        const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (r.canceled) return;
        uri = r.assets[0].uri; nombre = r.assets[0].name;
      } else if (tipo === 'imagen') {
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería'); return; }
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (r.canceled) return;
        uri = r.assets[0].uri; nombre = `Imagen_${new Date().toLocaleDateString('es-MX')}`;
      } else {
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara'); return; }
        const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (r.canceled) return;
        uri = r.assets[0].uri; nombre = `Escan_${new Date().toLocaleDateString('es-MX')}`;
      }
      const nuevo: Documento = { id: Date.now().toString(), nombre, tipo: tipo === 'pdf' ? 'pdf' : 'imagen', fecha: Date.now(), uri, seccion: seccionBoveda };
      const updated = [...documentos, nuevo];
      setDocumentos(updated);
      await guardarDocumentos(updated);
    } catch { Alert.alert('Error', 'No se pudo subir el documento'); }
  };

  const eliminarDoc = async (id: string) => {
    const updated = documentos.filter(d => d.id !== id);
    setDocumentos(updated);
    await guardarDocumentos(updated);
  };

  // Agrupar trámites por categoría para el checklist
  const categorias = [...new Set(TRAMITES.map(t => t.categoria))];

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>

      {/* ══ HEADER ══ */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Sección Legal</Text>
          <Text style={s.headerSub}>Tu asistente jurídica personal</Text>
        </View>
        <TouchableOpacity style={s.headerBtn} onPress={() => setShowBoveda(true)}>
          <Ionicons name="folder-outline" size={20} color="#F4ACB7" />
          {documentos.length > 0 && (
            <View style={s.docBadge}>
              <Text style={s.docBadgeTxt}>{documentos.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ══ CHAT PRINCIPAL ══ */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollRef}
          style={s.chatScroll}
          contentContainerStyle={s.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >

          {/* Tarjetas contextuales basadas en perfil del onboarding */}
          {mensajes.length <= 1 && (renta || tieneCarro) && (
            <View style={s.contextCards}>
              {renta && (
                <TouchableOpacity
                  style={[s.contextCard, { borderColor: '#85A89E' }]}
                  onPress={() => enviarMensaje('¿Cuáles son mis derechos como inquilina? ¿Qué debe incluir mi contrato de arrendamiento?')}
                  activeOpacity={0.8}
                >
                  <Text style={s.contextCardEmoji}>🏠</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.contextCardTitulo}>Rentas tu hogar</Text>
                    <Text style={s.contextCardSub}>Conoce tus derechos como inquilina y qué debe tener tu contrato</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#85A89E" />
                </TouchableOpacity>
              )}
              {tieneCarro && (
                <TouchableOpacity
                  style={[s.contextCard, { borderColor: '#F3C57C' }]}
                  onPress={() => enviarMensaje('Tengo carro, ¿qué trámites y documentos debo tener en regla? Verificación, tenencia, seguro obligatorio...')}
                  activeOpacity={0.8}
                >
                  <Text style={s.contextCardEmoji}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.contextCardTitulo}>Tienes carro</Text>
                    <Text style={s.contextCardSub}>Verificación, tenencia, seguro obligatorio y más</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#F3C57C" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Sugerencias de Tomasa si hay trámites urgentes */}
          {tramitesUrgentes.length > 0 && mensajes.length <= 1 && (
            <View style={s.sugerenciasCard}>
              <Animated.View style={{ transform: [{ translateY: tomasaAnim }] }}>
                <TomasaSVG size={64} floating={false} mood="alert" />
              </Animated.View>
              <View style={s.sugerenciasTxt}>
                <Text style={s.sugerenciasTitulo}>¡Tienes trámites urgentes! 📋</Text>
                {tramitesUrgentes.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={s.sugerenciaRow}
                    onPress={() => enviarMensaje(`¿Cómo tramito mi ${t.titulo} en México?`)}
                  >
                    <View style={s.sugerenciaDot} />
                    <Text style={s.sugerenciaTramite}>{t.titulo}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#F4ACB7" />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={s.bovedaInvite}
                  onPress={() => setShowBoveda(true)}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color="#85A89E" />
                  <Text style={s.bovedaInviteTxt}>Sube tus documentos a la bóveda</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Mensajes del chat */}
          {mensajes.map((m, i) => (
            <View key={i} style={[s.msgRow, m.rol === 'user' && s.msgRowUser]}>
              {m.rol === 'assistant' && (
                <View style={s.msgAvatar}>
                  <TomasaSVG size={32} floating={false} mood="neutral" />
                </View>
              )}
              <View style={[s.msgBubble, m.rol === 'user' ? s.msgBubbleUser : s.msgBubbleBot]}>
                {m.cargando ? (
                  <View style={s.typingRow}>
                    {[0,1,2].map(i => <View key={i} style={s.dot} />)}
                  </View>
                ) : (
                  <Text style={[s.msgTxt, m.rol === 'user' && s.msgTxtUser]}>{m.texto}</Text>
                )}
              </View>
            </View>
          ))}

          {/* Chips de preguntas frecuentes — solo al inicio */}
          {mensajes.length <= 1 && (
            <View style={s.chipsWrap}>
              <Text style={s.chipsTitulo}>Preguntas frecuentes</Text>
              <View style={s.chipsGrid}>
                {CHIPS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.chip}
                    onPress={() => enviarMensaje(q)}
                  >
                    <Text style={s.chipTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {/* Input de chat */}
        <View style={[s.inputRow, { paddingBottom: ins.bottom + 8 }]}>
          <TouchableOpacity
            style={s.checklistBtn}
            onPress={() => setShowChecklist(true)}
          >
            <Ionicons name="list-outline" size={22} color="#F4ACB7" />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            value={inputChat}
            onChangeText={setInputChat}
            placeholder="Pregunta sobre trámites, derechos..."
            placeholderTextColor="#9D818970"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!inputChat.trim() || cargandoIA) && s.sendBtnDisabled]}
            onPress={() => enviarMensaje()}
            disabled={!inputChat.trim() || cargandoIA}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ══ MODAL: CHECKLIST DE TRÁMITES ══ */}
      <Modal visible={showChecklist} animationType="slide" transparent onRequestClose={cerrarChecklist}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { paddingBottom: ins.bottom + 20 }]}>
            <View style={s.modalHandle} />

            <View style={s.checklistHeader}>
              <TomasaSVG size={56} floating={false} mood="neutral" />
              <View style={{ flex: 1 }}>
                <Text style={s.checklistTitulo}>¿Qué trámites ya tienes?</Text>
                <Text style={s.checklistSub}>Márcalos para darte sugerencias personalizadas</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {categorias.map(cat => {
                const items = TRAMITES.filter(t =>
                  t.categoria === cat && (!t.siRenta || renta)
                );
                if (items.length === 0) return null;
                const catLabel = items[0].categoriaLabel;
                return (
                  <View key={cat} style={s.checkCat}>
                    <Text style={s.checkCatTitulo}>{catLabel}</Text>
                    {items.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={s.checkRow}
                        onPress={() => toggleCompletado(t.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[s.checkbox, completados.has(t.id) && s.checkboxActive]}>
                          {completados.has(t.id) && (
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.checkTitulo, completados.has(t.id) && s.checkTituloHecho]}>
                            {t.titulo}
                          </Text>
                          <Text style={s.checkDesc}>{t.desc}</Text>
                        </View>
                        {t.urgente && !completados.has(t.id) && (
                          <View style={s.urgentePill}>
                            <Text style={s.urgentePillTxt}>urgente</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={s.checklistBtn2} onPress={cerrarChecklist}>
              <Text style={s.checklistBtn2Txt}>
                Listo — {completados.size} tramite{completados.size !== 1 ? 's' : ''} marcado{completados.size !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: BÓVEDA DE DOCUMENTOS ══ */}
      <Modal visible={showBoveda} animationType="slide" transparent onRequestClose={() => setShowBoveda(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.bovedaSheet, { paddingBottom: ins.bottom + 20 }]}>
            <View style={s.modalHandle} />

            {/* Header con Tomasa */}
            <View style={s.bovedaHeaderRow}>
              <Animated.View style={{ transform: [{ translateY: tomasaAnim }] }}>
                <TomasaSVG size={56} floating={false} mood={documentos.length === 0 ? 'alert' : 'happy'} />
              </Animated.View>
              <View style={{ flex: 1 }}>
                <Text style={s.bovedaTitulo}>Bóveda de Documentos 🔒</Text>
                <Text style={s.bovedaSub}>
                  {documentos.length === 0
                    ? 'Guarda tus documentos escaneados aquí, seguros en tu dispositivo'
                    : `${documentos.length} documento${documentos.length !== 1 ? 's' : ''} guardado${documentos.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
            </View>

            {/* Tabs de secciones */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.seccionesScroll} contentContainerStyle={s.seccionesContent}>
              {SECCIONES_BOVEDA.map(sec => (
                <TouchableOpacity
                  key={sec.id}
                  style={[s.seccionTab, seccionBoveda === sec.id && { backgroundColor: sec.color, borderColor: sec.color }]}
                  onPress={() => setSeccionBoveda(sec.id)}
                >
                  <Text style={[s.seccionTabTxt, seccionBoveda === sec.id && s.seccionTabTxtActive]}>
                    {sec.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Info de la sección activa */}
            {(() => {
              const sec = SECCIONES_BOVEDA.find(s => s.id === seccionBoveda)!;
              const docsSeccion = documentos.filter(d => d.seccion === seccionBoveda);
              return (
                <View style={[s.seccionInfo, { backgroundColor: sec.color + '60' }]}>
                  <Text style={s.seccionEjemplos}>Ej: {sec.ejemplos}</Text>
                  <Text style={s.seccionCount}>{docsSeccion.length} doc{docsSeccion.length !== 1 ? 's' : ''}</Text>
                </View>
              );
            })()}

            {/* Botones subir */}
            <View style={s.bovedaBtns}>
              <TouchableOpacity style={s.bovedaBtn} onPress={() => subirDocumento('camara')}>
                <Ionicons name="camera-outline" size={20} color="#F4ACB7" />
                <Text style={s.bovedaBtnTxt}>Escanear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.bovedaBtn} onPress={() => subirDocumento('imagen')}>
                <Ionicons name="image-outline" size={20} color="#F4ACB7" />
                <Text style={s.bovedaBtnTxt}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.bovedaBtn} onPress={() => subirDocumento('pdf')}>
                <Ionicons name="document-outline" size={20} color="#F4ACB7" />
                <Text style={s.bovedaBtnTxt}>PDF</Text>
              </TouchableOpacity>
            </View>

            {/* Lista documentos de la sección activa */}
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {documentos.filter(d => d.seccion === seccionBoveda).length === 0 ? (
                <View style={s.bovedaVacia}>
                  <Ionicons name="folder-open-outline" size={40} color="#FFCAD4" />
                  <Text style={s.bovedaVaciaTxt}>Sin documentos en esta sección</Text>
                  <Text style={s.bovedaVaciaDesc}>Sube documentos usando los botones de arriba</Text>
                </View>
              ) : (
                documentos.filter(d => d.seccion === seccionBoveda).map(doc => (
                  <View key={doc.id} style={s.docCard}>
                    <View style={s.docIcono}>
                      <Ionicons
                        name={doc.tipo === 'pdf' ? 'document-text-outline' : 'image-outline'}
                        size={20}
                        color={doc.tipo === 'pdf' ? '#F4ACB7' : '#85A89E'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.docNombre} numberOfLines={1}>{doc.nombre}</Text>
                      <Text style={s.docFecha}>{new Date(doc.fecha).toLocaleDateString('es-MX')}</Text>
                    </View>
                    <TouchableOpacity onPress={() => eliminarDoc(doc.id)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={18} color="#FFCAD4" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={s.cerrarBtn} onPress={() => setShowBoveda(false)}>
              <Text style={s.cerrarBtnTxt}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ MODAL: DETALLE TRÁMITE ══ */}
      <Modal visible={!!tramiteDetalle} animationType="slide" transparent onRequestClose={() => setTramiteDetalle(null)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setTramiteDetalle(null)} />
        {tramiteDetalle && (
          <View style={[s.modalSheet, { paddingBottom: ins.bottom + 20 }]}>
            <View style={s.modalHandle} />
            <Text style={s.detalleTitulo}>{tramiteDetalle.titulo}</Text>
            <Text style={s.detalleDesc}>{tramiteDetalle.desc}</Text>
            <View style={s.detalleBtns}>
              {tramiteDetalle.link && (
                <TouchableOpacity style={s.btnPrimary} onPress={() => Linking.openURL(tramiteDetalle.link!)}>
                  <Ionicons name="open-outline" size={18} color="#fff" />
                  <Text style={s.btnPrimaryTxt}>Ir al sitio oficial</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={s.btnChat2}
                onPress={() => {
                  setTramiteDetalle(null);
                  enviarMensaje(`¿Cómo tramito mi ${tramiteDetalle.titulo} en México? Dame los pasos exactos.`);
                }}
              >
                <Ionicons name="chatbubble-outline" size={18} color="#F4ACB7" />
                <Text style={s.btnChat2Txt}>Preguntarle a Tomasa</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

    </View>
  );
}

// ─── ESTILOS ─────────────────────────────────────────
const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFF8F9' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#FFF0F4',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#9D8189' },
  headerSub:   { fontSize: 12, color: '#9D8189', opacity: 0.6 },
  headerBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center',
  },
  docBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#F4ACB7', borderRadius: 99,
    width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  docBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  // Chat
  chatScroll:  { flex: 1 },
  chatContent: { padding: 16, gap: 14, paddingBottom: 8 },

  sugerenciasCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: '#FFF0F4', borderRadius: 20,
    padding: 16, borderWidth: 1, borderColor: '#FFCAD4',
    alignItems: 'flex-start',
  },
  sugerenciasTxt:    { flex: 1, gap: 8 },
  sugerenciasTitulo: { fontSize: 14, fontWeight: '800', color: '#9D8189' },
  sugerenciaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4,
  },
  sugerenciaDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F4ACB7' },
  sugerenciaTramite:{ flex: 1, fontSize: 13, fontWeight: '600', color: '#9D8189' },
  bovedaInvite: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#D8E2DC30', borderRadius: 10, padding: 8, marginTop: 4,
  },
  bovedaInviteTxt: { fontSize: 12, fontWeight: '600', color: '#85A89E' },

  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center',
  },
  msgBubble:       { maxWidth: '78%', borderRadius: 18, padding: 12 },
  msgBubbleBot:    { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FFF0F4', borderBottomLeftRadius: 4 },
  msgBubbleUser:   { backgroundColor: '#F4ACB7', borderBottomRightRadius: 4 },
  msgTxt:          { fontSize: 14, color: '#6D5A62', lineHeight: 21 },
  msgTxtUser:      { color: '#fff' },
  typingRow:       { flexDirection: 'row', gap: 4, paddingVertical: 4 },
  dot:             { width: 7, height: 7, borderRadius: 4, backgroundColor: '#F4ACB7' },

  chipsWrap:    { gap: 10 },
  chipsTitulo:  { fontSize: 12, fontWeight: '700', color: '#9D818970', textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: '#fff', borderRadius: 99,
    borderWidth: 1, borderColor: '#FFCAD4',
  },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#9D8189' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#FFF0F4',
  },
  checklistBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: '#FFF8F9', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: '#9D8189', maxHeight: 100,
    borderWidth: 1, borderColor: '#FFF0F4',
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F4ACB7', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },

  // Modales
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, padding: 24, elevation: 20,
  },
  modalHandle: {
    width: 48, height: 5, backgroundColor: '#D8E2DC',
    borderRadius: 99, alignSelf: 'center', marginBottom: 20,
  },

  // Checklist
  checklistHeader: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  checklistTitulo: { fontSize: 18, fontWeight: '800', color: '#9D8189' },
  checklistSub:    { fontSize: 12, color: '#9D8189', opacity: 0.7, marginTop: 2 },
  checkCat:        { marginBottom: 12 },
  checkCatTitulo:  { fontSize: 12, fontWeight: '800', color: '#9D818970', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFF8F9',
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 8,
    borderWidth: 2, borderColor: '#FFCAD4',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive:    { backgroundColor: '#85A89E', borderColor: '#85A89E' },
  checkTitulo:       { fontSize: 14, fontWeight: '700', color: '#6D5A62' },
  checkTituloHecho:  { textDecorationLine: 'line-through', opacity: 0.5 },
  checkDesc:         { fontSize: 12, color: '#9D8189', opacity: 0.6, marginTop: 1 },
  urgentePill:       { backgroundColor: '#FFCAD4', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  urgentePillTxt:    { fontSize: 10, fontWeight: '800', color: '#fff' },
  checklistBtn2: {
    backgroundColor: '#F4ACB7', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 16,
  },
  checklistBtn2Txt: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Bóveda
  bovedaHeaderRow: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 16 },
  bovedaTitulo:    { fontSize: 18, fontWeight: '800', color: '#9D8189' },
  bovedaSub:       { fontSize: 12, color: '#9D8189', opacity: 0.7, marginTop: 2, lineHeight: 17 },
  bovedaBtns:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  bovedaBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, backgroundColor: '#FFF8F9',
    borderRadius: 14, borderWidth: 1.5, borderColor: '#FFCAD4',
  },
  bovedaBtnTxt:  { fontSize: 12, fontWeight: '700', color: '#F4ACB7' },
  bovedaVacia:   { alignItems: 'center', paddingVertical: 30, gap: 8 },
  bovedaVaciaTxt:{ fontSize: 14, fontWeight: '700', color: '#9D8189' },
  bovedaVaciaDesc:{ fontSize: 12, color: '#9D8189', opacity: 0.6, textAlign: 'center' },
  docCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFF8F9',
  },
  docIcono: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center',
  },
  docNombre: { fontSize: 14, fontWeight: '600', color: '#6D5A62' },
  docFecha:  { fontSize: 11, color: '#9D8189', opacity: 0.6 },

  cerrarBtn:    { alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#FFF0F4', marginTop: 8 },
  cerrarBtnTxt: { fontSize: 15, fontWeight: '600', color: '#9D8189' },

  // Detalle trámite
  detalleTitulo: { fontSize: 22, fontWeight: '800', color: '#9D8189', marginBottom: 8 },
  detalleDesc:   { fontSize: 14, color: '#9D8189', opacity: 0.8, lineHeight: 22, marginBottom: 20 },
  detalleBtns:   { gap: 10 },
  btnPrimary: {
    backgroundColor: '#F4ACB7', borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnChat2: {
    borderWidth: 1.5, borderColor: '#F4ACB7', borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnChat2Txt: { color: '#F4ACB7', fontWeight: '700', fontSize: 15 },

  // Tarjetas contextuales
  contextCards: { gap: 10, marginBottom: 4 },
  contextCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1.5, elevation: 2,
  },
  contextCardEmoji:  { fontSize: 28 },
  contextCardTitulo: { fontSize: 14, fontWeight: '800', color: '#6D5A62', marginBottom: 2 },
  contextCardSub:    { fontSize: 12, color: '#9D8189', opacity: 0.8, lineHeight: 16 },

  // Bóveda rediseñada
  bovedaSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 32,
    borderTopRightRadius: 32, padding: 24, elevation: 20, maxHeight: '92%',
  },
  seccionesScroll: { maxHeight: 44 },
  seccionesContent: { gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  seccionTab: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99, borderWidth: 1.5, borderColor: '#FFF0F4',
    backgroundColor: '#fff',
  },
  seccionTabTxt:       { fontSize: 12, fontWeight: '600', color: '#9D818970' },
  seccionTabTxtActive: { color: '#9D8189', fontWeight: '800' },
  seccionInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderRadius: 12, padding: 10,
    marginVertical: 10,
  },
  seccionEjemplos: { fontSize: 11, color: '#9D8189', opacity: 0.7, flex: 1 },
  seccionCount:    { fontSize: 12, fontWeight: '800', color: '#9D8189' },
});
