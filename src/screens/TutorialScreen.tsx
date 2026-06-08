import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';
import type { TomasaMood } from '../components/TomasaSVG';

const { width: SW } = Dimensions.get('window');

interface Props {
  onFinish: () => void;
}

interface Pregunta {
  texto: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
}

interface Paso {
  id: string;
  seccion: string;
  seccionColor: string;
  seccionIcono: string;
  titulo: string;
  mensaje: string;
  mood: TomasaMood;
  pregunta?: Pregunta;
}

// ─── 16 PASOS COMPLETOS ──────────────────────────────
const PASOS: Paso[] = [

  // ── 1. BIENVENIDA ────────────────────────────────────
  {
    id: 'bienvenida',
    seccion: 'TomyGuía',
    seccionColor: '#F4ACB7',
    seccionIcono: 'sparkles-outline',
    titulo: '¡Hola! Soy Tomasa 🌸',
    mensaje: 'Soy tu guía en TomyGuía — tu app de finanzas personales.\n\nEn este tutorial te voy a explicar cada parte de la app para que puedas usarla con confianza desde el primer día.\n\n¡Empecemos! Son solo unos minutos y vale mucho la pena 💪',
    mood: 'happy',
  },

  // ── 2. MENÚ INFERIOR ────────────────────────────────
  {
    id: 'menu',
    seccion: 'Navegación',
    seccionColor: '#9D8189',
    seccionIcono: 'apps-outline',
    titulo: 'El menú de abajo 📱',
    mensaje: 'En la parte inferior siempre verás 4 íconos para moverte entre las secciones:\n\n🏠 Inicio — tu dashboard de finanzas diarias\n⚖️ Legal — trámites, bóveda y asistente legal\n🎓 Academia — aprende finanzas jugando\n👤 Perfil — tu información y configuración\n\nSiempre puedes volver a cualquier sección tocando su ícono.',
    mood: 'neutral',
    pregunta: {
      texto: '¿Dónde encuentras la sección de trámites y documentos?',
      opciones: ['🏠 Inicio', '⚖️ Legal', '🎓 Academia', '👤 Perfil'],
      correcta: 1,
      explicacion: '¡Correcto! La sección Legal tiene todo lo relacionado con trámites, documentos y tus derechos ⚖️',
    },
  },

  // ── 3. REGLA 50/30/20 ────────────────────────────────
  {
    id: 'regla',
    seccion: 'Inicio — Fundamento',
    seccionColor: '#F4ACB7',
    seccionIcono: 'pie-chart-outline',
    titulo: 'La regla 50/30/20 💡',
    mensaje: 'Toda la app se basa en esta regla simple:\n\n🌸 50% Necesidades — renta, luz, agua, comida, transporte. Lo que sí o sí tienes que pagar cada mes.\n\n🌞 30% Gustos — cafés, salidas, ropa, streaming. Lo que disfrutas sin culpa.\n\n🛡️ 20% Futuro — ahorro, fondo de emergencia, pagos anuales.\n\nAl ingresar tu sueldo, la app divide el dinero automáticamente.',
    mood: 'neutral',
    pregunta: {
      texto: '¿Cuánto va para necesidades según la regla 50/30/20?',
      opciones: ['20%', '30%', '50%', '60%'],
      correcta: 2,
      explicacion: '¡Exacto! El 50% va para necesidades básicas — lo que no puedes dejar de pagar 🌸',
    },
  },

  // ── 4. TARJETA NECESIDADES ───────────────────────────
  {
    id: 'necesidades',
    seccion: 'Inicio — Necesidades',
    seccionColor: '#F4ACB7',
    seccionIcono: 'home-outline',
    titulo: '🌸 Tarjeta Necesidades',
    mensaje: 'La tarjeta rosa es tu 50% — el dinero para gastos fijos.\n\nTiene DOS barras que miden cosas distintas:\n\n📋 Barra 1 — Recibos pagados: sube cuando marcas un recibo como pagado. Meta: llegar al 100% antes de fin de mes.\n\n💰 Barra 2 — Dinero disponible vs lo que falta: si está roja, tu saldo no alcanza para cubrir los recibos pendientes. Si está verde, vas bien.\n\nToca el encabezado para ver el calendario.',
    mood: 'neutral',
    pregunta: {
      texto: '¿Qué significa que la barra de dinero está en rojo?',
      opciones: [
        'Que ya pagué todo',
        'Que no me alcanza para los recibos pendientes',
        'Que tengo dinero extra',
        'Que es fin de mes',
      ],
      correcta: 1,
      explicacion: '¡Correcto! Rojo = cuidado, tu saldo no alcanza para lo que falta por pagar 💪',
    },
  },

  // ── 5. CALENDARIO ───────────────────────────────────
  {
    id: 'calendario',
    seccion: 'Inicio — Calendario',
    seccionColor: '#F4ACB7',
    seccionIcono: 'calendar-outline',
    titulo: '📅 Calendario de pagos',
    mensaje: 'Dentro de la tarjeta de Necesidades está el calendario.\n\nCada burbuja de color es un gasto fijo. Así funciona:\n\n1️⃣ Toca una burbuja sin asignar\n2️⃣ Toca el día del mes en que lo pagas\n3️⃣ ¡Listo! El día se guarda automáticamente\n\n✨ Lo más importante: los días se recuerdan cada mes. Si la luz siempre cae el día 15, el próximo mes ya aparece ahí sin hacer nada.\n\nUsa las flechas ← → para ver meses futuros.',
    mood: 'neutral',
  },

  // ── 6. TARJETA GUSTOS ───────────────────────────────
  {
    id: 'gustos',
    seccion: 'Inicio — Gustos',
    seccionColor: '#F3C57C',
    seccionIcono: 'sunny-outline',
    titulo: '🌞 Tarjeta Gustos',
    mensaje: 'La tarjeta amarilla es tu 30% — el dinero para disfrutar.\n\nMuestra cuánto tienes disponible:\n\n📅 Por día — divide tu presupuesto entre los días del mes\n📅 Por semana — para planear salidas\n\nCada vez que registras un gasto de "gusto", este número baja.\n\nTomasa te avisa cuando estás llegando al límite, pero siempre con un mensaje alentador, nunca regañándote 😊',
    mood: 'happy',
    pregunta: {
      texto: 'Si tus gustos del mes son $3,000 y llevas $900 gastados, ¿cuánto te queda?',
      opciones: ['$900', '$2,100', '$3,900', '$3,000'],
      correcta: 1,
      explicacion: '¡Perfecto! $3,000 - $900 = $2,100 restantes. ¡Todavía tienes bastante! 🌞',
    },
  },

  // ── 7. TARJETA FUTURO ───────────────────────────────
  {
    id: 'futuro',
    seccion: 'Inicio — Futuro',
    seccionColor: '#85A89E',
    seccionIcono: 'shield-checkmark-outline',
    titulo: '🛡️ Tarjeta Futuro',
    mensaje: 'La tarjeta verde es tu 20% — tu red de seguridad.\n\nTiene dos partes:\n\n🛡️ Fondo de emergencia — para imprevistos. La meta ideal es tener 3 meses de gastos cubiertos. Cada vez que recibes ingresos, el 20% se suma aquí.\n\n📅 Pagos del año — para predial, tenencia, seguro. La app calcula cuánto apartar cada mes para que no te sorprendan.\n\n¡Este 20% es el que te da independencia financiera real!',
    mood: 'happy',
    pregunta: {
      texto: '¿Para qué sirve el fondo de emergencia?',
      opciones: [
        'Para comprar gustos extra',
        'Para pagar recibos mensuales',
        'Para gastos inesperados que no planeaste',
        'Para salidas de fin de semana',
      ],
      correcta: 2,
      explicacion: '¡Correcto! El fondo de emergencia es tu red de seguridad para lo inesperado 🛡️',
    },
  },

  // ── 8. PAGOS ANUALES ────────────────────────────────
  {
    id: 'pagos_anuales',
    seccion: 'Inicio — Pagos del año',
    seccionColor: '#9D8189',
    seccionIcono: 'calendar-number-outline',
    titulo: '📅 Pagos del año',
    mensaje: 'Justo debajo del Futuro está la tarjeta de Pagos del año.\n\nSirve para planear gastos grandes que solo pagas una o dos veces al año: predial, tenencia vehicular, seguro de auto, renovaciones.\n\nAsí funciona:\n1️⃣ Toca "Agregar" y escribe el nombre, monto y mes\n2️⃣ La app calcula cuánto apartar cada mes\n3️⃣ Cada mes puedes abonar lo que vas ahorrando\n\nAl cambiar de mes, si sobró dinero te preguntará si quieres destinarlo aquí.',
    mood: 'neutral',
  },

  // ── 9. REGISTRAR GASTOS ─────────────────────────────
  {
    id: 'chat',
    seccion: 'Inicio — Registrar gastos',
    seccionColor: '#F4ACB7',
    seccionIcono: 'mic-outline',
    titulo: '🎙️ Registrar gastos e ingresos',
    mensaje: 'La barra al fondo es donde registras todo.\n\nPuedes escribir o usar tu voz:\n\n✏️ Escribe: "Gasté 80 en café"\n🎙️ Toca el micrófono y dilo en voz alta\n\nEjemplos que entiende Tomasa:\n• "Gasté doscientos en el súper"\n• "Cobré cinco mil de sueldo"\n• "Pagué trescientos de luz"\n• "Fui al cine, gasté 150"\n\nTomasa clasifica el gasto automáticamente en Necesidades o Gustos.',
    mood: 'happy',
    pregunta: {
      texto: '¿Cómo registrarías que gastaste $120 en transporte?',
      opciones: [
        'Solo con el micrófono',
        'Solo escribiendo',
        'Escribiendo "gasté 120 en transporte" o diciéndolo en voz alta',
        'No se puede registrar transporte',
      ],
      correcta: 2,
      explicacion: '¡Exacto! Tanto escribir como hablar funcionan. Tomasa entiende lenguaje natural 🎙️',
    },
  },

  // ── 10. BANCO CONECTADO ─────────────────────────────
  {
    id: 'banco',
    seccion: 'Inicio — Banco',
    seccionColor: '#F4ACB7',
    seccionIcono: 'card-outline',
    titulo: '🏦 Conectar tu banco',
    mensaje: 'En la tarjeta de Necesidades hay un botón para conectar tu cuenta bancaria.\n\nAl conectarla:\n✅ Importa tus movimientos del mes automáticamente\n✅ Los clasifica en Necesidades o Gustos\n✅ Puedes seleccionar de 6 bancos mexicanos: Nu, BBVA, Banorte, HSBC, Santander, Citibanamex\n\nNo es obligatorio — puedes registrar todo manualmente si prefieres.\n\nTus credenciales bancarias nunca las vemos nosotras.',
    mood: 'neutral',
  },

  // ── 11. TOMASA FLOTANTE ─────────────────────────────
  {
    id: 'tomasa',
    seccion: 'Inicio — Asistente',
    seccionColor: '#F4ACB7',
    seccionIcono: 'heart-outline',
    titulo: '🌸 Tomasa, tu asistente',
    mensaje: 'Soy el ajolote que aparece flotando en tu pantalla.\n\nCambio de expresión según cómo van tus finanzas:\n\n😊 Feliz — ¡todo va bien!\n😰 Preocupada — hay algo que revisar\n😴 Dormida — sin actividad hoy\n😮 Sorprendida — gasto inusual detectado\n😢 Triste — presupuesto muy excedido\n\nTócame para ver mi mensaje completo. Aparezco automáticamente con recordatorios amables — nunca regaños.',
    mood: 'happy',
  },

  // ── 12. BOTÓN EMERGENCIA ────────────────────────────
  {
    id: 'emergencia',
    seccion: 'Inicio — Emergencia',
    seccionColor: '#F4ACB7',
    seccionIcono: 'shield-half-outline',
    titulo: '🛡️ Botón de emergencia',
    mensaje: 'En el header del Inicio, junto a tu foto de perfil, hay un pequeño ícono de escudo 🛡️\n\nEs discreto para que solo tú sepas que está ahí.\n\nAl tocarlo abre un plan de emergencia con:\n\n📋 5 pasos concretos si sufres violencia económica\n📞 Botón para llamar directamente a INMUJERES\n📱 800 911 2511 — gratis, 24 horas, confidencial\n\nLa violencia económica es real y tiene solución. Nunca estás sola.',
    mood: 'neutral',
    pregunta: {
      texto: '¿Qué es la violencia económica?',
      opciones: [
        'Gastar demasiado dinero',
        'Cuando alguien controla tu dinero, te impide trabajar o pone deudas a tu nombre sin tu permiso',
        'No tener trabajo',
        'Perder dinero en una inversión',
      ],
      correcta: 1,
      explicacion: '¡Correcto! La violencia económica es una forma de control y abuso. No es normal ni tu culpa 💜',
    },
  },

  // ── 13. SECCIÓN LEGAL ───────────────────────────────
  {
    id: 'legal',
    seccion: 'Legal',
    seccionColor: '#9D8189',
    seccionIcono: 'shield-outline',
    titulo: '⚖️ Sección Legal',
    mensaje: 'Toca el ícono ⚖️ en el menú inferior para entrar.\n\nTiene tres partes integradas:\n\n💬 Chat principal — pregúntale a Tomasa Legal sobre cualquier trámite: RFC, INE, CURP, derechos laborales, contratos de renta. Responde con pasos claros y gratuitos.\n\n📋 Checklist — aparece una vez al inicio para que marques qué trámites ya tienes. Luego Tomasa te sugiere los urgentes.\n\n🗂️ Bóveda — guarda tus documentos escaneados protegidos con PIN de 4 dígitos.',
    mood: 'neutral',
  },

  // ── 14. BÓVEDA CON PIN ──────────────────────────────
  {
    id: 'boveda',
    seccion: 'Legal — Bóveda',
    seccionColor: '#9D8189',
    seccionIcono: 'folder-outline',
    titulo: '🔒 Bóveda de documentos',
    mensaje: 'La bóveda guarda tus documentos importantes de forma segura en tu teléfono.\n\nProtegida con PIN de 4 dígitos que tú eliges:\n• La primera vez crea tu PIN\n• Las siguientes veces te lo pide para entrar\n• Se bloquea automáticamente al cerrar\n\nPuedes guardar documentos en 6 categorías:\n🪪 Identidad · 🧾 Fiscal · 🏥 Salud · 💼 Laboral · 🏠 Vivienda · 📁 Otros\n\nSube desde: 📷 Cámara (escanear) · 🖼️ Galería · 📄 PDF',
    mood: 'neutral',
    pregunta: {
      texto: '¿Cómo se protege la bóveda de documentos?',
      opciones: [
        'Con contraseña de Google',
        'No tiene protección',
        'Con un PIN de 4 dígitos que tú eliges',
        'Con huella dactilar automática',
      ],
      correcta: 2,
      explicacion: '¡Correcto! El PIN de 4 dígitos es tuyo — nadie más puede ver tus documentos 🔒',
    },
  },

  // ── 15. ACADEMIA ────────────────────────────────────
  {
    id: 'academia',
    seccion: 'Academia',
    seccionColor: '#F3C57C',
    seccionIcono: 'school-outline',
    titulo: '🎓 TomyAcademia',
    mensaje: 'Toca el ícono 🎓 en el menú inferior para aprender finanzas jugando.\n\nTiene 6 niveles en 3 secciones:\n\n📗 Básico — qué es el dinero, gastos hormiga, regla 50/30/20, violencia económica\n📘 Intermedio — crédito e historial\n📙 Avanzado — inversión básica\n\nCada nivel tiene:\n📖 Teoría — tarjetas que Tomasa explica\n🎮 Juego — quiz, calculadora o ejercicio interactivo\n\nAl completar cada nivel ganas 🌸 flores que se suman a tu perfil.',
    mood: 'happy',
    pregunta: {
      texto: '¿Qué ganas al completar una lección en la Academia?',
      opciones: [
        'Puntos de experiencia',
        'Flores 🌸 que se suman a tu perfil',
        'Monedas virtuales',
        'Medallas de oro',
      ],
      correcta: 1,
      explicacion: '¡Correcto! Las flores 🌸 se acumulan en tu perfil. ¡Cuantas más tienes, más aprendiste! 🎓',
    },
  },

  // ── 16. PERFIL ──────────────────────────────────────
  {
    id: 'perfil',
    seccion: 'Perfil',
    seccionColor: '#85A89E',
    seccionIcono: 'person-circle-outline',
    titulo: '👤 Tu perfil',
    mensaje: 'Toca el ícono 👤 en el menú inferior para ver tu perfil.\n\nAquí puedes:\n👤 Ver tu foto y nombre (de Google si iniciaste sesión)\n🌸 Ver cuántas flores has ganado en la Academia\n🏆 Ver tus logros desbloqueados\n📖 Volver a ver este tutorial cuando quieras\n\nTus flores 🌸 eventualmente podrán canjearse por puntos en tu banco favorito — ¡aprende y gana!',
    mood: 'happy',
  },

  // ── 17. FIN ─────────────────────────────────────────
  {
    id: 'fin',
    seccion: 'TomyGuía',
    seccionColor: '#85A89E',
    seccionIcono: 'checkmark-circle-outline',
    titulo: '¡Ya sabes todo! 🎉',
    mensaje: 'Ahora conoces TomyGuía completa:\n\n✅ La regla 50/30/20\n✅ Las 4 tarjetas del Inicio\n✅ El calendario de pagos recurrentes\n✅ Cómo registrar gastos por voz o texto\n✅ El botón de emergencia 🛡️\n✅ La sección Legal con asistente y bóveda\n✅ La Academia gamificada\n✅ El sistema de flores 🌸\n\n¡Estás lista para tomar el control de tus finanzas!\n\nRecuerda: el conocimiento financiero es libertad real 💪',
    mood: 'happy',
  },
];

// ─── COMPONENTE ──────────────────────────────────────
export function TutorialScreen({ onFinish }: Props) {
  const ins = useSafeAreaInsets();
  const [pasoIdx, setPasoIdx]       = useState(0);
  const [respuesta, setRespuesta]   = useState<number | null>(null);
  const [mostrarExp, setMostrarExp] = useState(false);
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const opacAnim   = useRef(new Animated.Value(1)).current;

  const paso     = PASOS[pasoIdx];
  const esUltimo = pasoIdx === PASOS.length - 1;
  const progreso = ((pasoIdx + 1) / PASOS.length) * 100;
  const puedeAvanzar = !paso.pregunta || respuesta !== null;

  const animarTransicion = (dir: 1 | -1, cb: () => void) => {
    Animated.parallel([
      Animated.timing(opacAnim,  { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      slideAnim.setValue(dir * 30);
      cb();
      Animated.parallel([
        Animated.timing(opacAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const siguiente = () => {
    if (esUltimo) { onFinish(); return; }
    animarTransicion(1, () => {
      setPasoIdx(i => i + 1);
      setRespuesta(null);
      setMostrarExp(false);
    });
  };

  const anterior = () => {
    if (pasoIdx === 0) return;
    animarTransicion(-1, () => {
      setPasoIdx(i => i - 1);
      setRespuesta(null);
      setMostrarExp(false);
    });
  };

  const responder = (idx: number) => {
    if (respuesta !== null) return;
    setRespuesta(idx);
    setMostrarExp(true);
  };

  const colorSeccion = paso.seccionColor;

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onFinish} style={s.skipBtn}>
          <Text style={s.skipTxt}>Saltar</Text>
        </TouchableOpacity>
        <View style={s.progresoBarra}>
          <View style={[s.progresoRelleno, { width: `${progreso}%`, backgroundColor: colorSeccion }]} />
        </View>
        <Text style={s.pasoNumTxt}>{pasoIdx + 1}/{PASOS.length}</Text>
      </View>

      {/* Contenido */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.contenido, { opacity: opacAnim, transform: [{ translateX: slideAnim }] }]}>

          {/* Tomasa */}
          <View style={[s.tomasaCircle, { backgroundColor: colorSeccion + '20' }]}>
            <TomasaSVG size={90} floating mood={paso.mood} />
          </View>

          {/* Badge de sección */}
          <View style={[s.seccionBadge, { backgroundColor: colorSeccion + '20' }]}>
            <Ionicons name={paso.seccionIcono as any} size={13} color={colorSeccion} />
            <Text style={[s.seccionTxt, { color: colorSeccion }]}>{paso.seccion}</Text>
          </View>

          {/* Título */}
          <Text style={s.titulo}>{paso.titulo}</Text>

          {/* Mensaje */}
          <Text style={s.mensaje}>{paso.mensaje}</Text>

          {/* Pregunta */}
          {paso.pregunta && (
            <View style={[s.preguntaCard, { borderColor: colorSeccion + '40' }]}>
              <View style={s.preguntaHeaderRow}>
                <View style={[s.preguntaIcono, { backgroundColor: colorSeccion + '20' }]}>
                  <Ionicons name="help-circle-outline" size={18} color={colorSeccion} />
                </View>
                <Text style={[s.preguntaTitulo, { color: colorSeccion }]}>Mini práctica</Text>
              </View>
              <Text style={s.preguntaTxt}>{paso.pregunta.texto}</Text>

              <View style={s.opcionesWrap}>
                {paso.pregunta.opciones.map((op, i) => {
                  const esCorrecta   = i === paso.pregunta!.correcta;
                  const esElegida    = i === respuesta;
                  const mostrarBien  = respuesta !== null && esCorrecta;
                  const mostrarMal   = respuesta !== null && esElegida && !esCorrecta;
                  const apagada      = respuesta !== null && !esCorrecta && !esElegida;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.opcion,
                        mostrarBien && s.opcionCorrecta,
                        mostrarMal  && s.opcionIncorrecta,
                        apagada     && s.opcionApagada,
                      ]}
                      onPress={() => responder(i)}
                      disabled={respuesta !== null}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        s.opcionCirculo,
                        mostrarBien && { backgroundColor: '#85A89E', borderColor: '#85A89E' },
                        mostrarMal  && { backgroundColor: '#FF8A80', borderColor: '#FF8A80' },
                      ]}>
                        {mostrarBien
                          ? <Ionicons name="checkmark" size={13} color="#fff" />
                          : mostrarMal
                          ? <Ionicons name="close" size={13} color="#fff" />
                          : <Text style={s.opcionLetra}>{['A','B','C','D'][i]}</Text>
                        }
                      </View>
                      <Text style={[
                        s.opcionTxt,
                        mostrarBien && { color: '#5B776F', fontWeight: '700' },
                        mostrarMal  && { color: '#D64545' },
                      ]}>{op}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Explicación */}
              {mostrarExp && (
                <View style={[
                  s.explicacion,
                  { backgroundColor: respuesta === paso.pregunta.correcta ? '#D8F5EE' : '#FFF0F0' }
                ]}>
                  <Text style={[
                    s.explicacionTxt,
                    { color: respuesta === paso.pregunta.correcta ? '#2D7A5E' : '#D64545' }
                  ]}>
                    {respuesta === paso.pregunta.correcta
                      ? paso.pregunta.explicacion
                      : `Casi 😊 La respuesta es: "${paso.pregunta.opciones[paso.pregunta.correcta]}"\n\n${paso.pregunta.explicacion}`
                    }
                  </Text>
                </View>
              )}
            </View>
          )}

        </Animated.View>
      </ScrollView>

      {/* Navegación */}
      <View style={[s.navRow, { paddingBottom: ins.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.navAtras, pasoIdx === 0 && { opacity: 0 }]}
          onPress={anterior}
          disabled={pasoIdx === 0}
        >
          <Ionicons name="chevron-back" size={18} color="#9D8189" />
          <Text style={s.navAtrasTxt}>Anterior</Text>
        </TouchableOpacity>

        {/* Puntos de progreso */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.puntosRow}
          style={{ maxWidth: SW * 0.4 }}
        >
          {PASOS.map((_, i) => (
            <View
              key={i}
              style={[
                s.punto,
                i === pasoIdx && { backgroundColor: colorSeccion, width: 14 },
                i < pasoIdx   && { backgroundColor: colorSeccion + '60' },
              ]}
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={[
            s.navSiguiente,
            { backgroundColor: colorSeccion },
            !puedeAvanzar && { opacity: 0.5 },
          ]}
          onPress={siguiente}
          disabled={!puedeAvanzar}
        >
          <Text style={s.navSiguienteTxt}>{esUltimo ? '¡Listo!' : 'Siguiente'}</Text>
          <Ionicons name={esUltimo ? 'checkmark' : 'chevron-forward'} size={17} color="#fff" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ─── ESTILOS ─────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFF8F9' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 10,
  },
  skipBtn:      { paddingHorizontal: 6, paddingVertical: 4 },
  skipTxt:      { fontSize: 13, color: '#9D818970', fontWeight: '600' },
  progresoBarra:{ flex: 1, height: 6, backgroundColor: '#F0E0E5', borderRadius: 99, overflow: 'hidden' },
  progresoRelleno:{ height: '100%', borderRadius: 99 },
  pasoNumTxt:   { fontSize: 11, fontWeight: '700', color: '#9D818970', minWidth: 32, textAlign: 'right' },

  scroll:       { flex: 1 },
  scrollContent:{ padding: 20, paddingBottom: 8 },

  contenido: {
    backgroundColor: '#fff', borderRadius: 28,
    padding: 24, gap: 14,
    elevation: 4,
    shadowColor: '#F4ACB7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  tomasaCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },

  seccionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 99,
  },
  seccionTxt: { fontSize: 11, fontWeight: '700' },

  titulo:  { fontSize: 20, fontWeight: '800', color: '#6D5A62', textAlign: 'center' },
  mensaje: { fontSize: 14, color: '#9D8189', lineHeight: 22 },

  // Pregunta
  preguntaCard: {
    backgroundColor: '#FFF8F9', borderRadius: 18,
    padding: 16, gap: 12,
    borderWidth: 1.5,
  },
  preguntaHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  preguntaIcono: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  preguntaTitulo: { fontSize: 13, fontWeight: '800' },
  preguntaTxt:    { fontSize: 14, fontWeight: '700', color: '#6D5A62', lineHeight: 20 },

  opcionesWrap: { gap: 8 },
  opcion: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12, padding: 12,
    borderWidth: 1.5, borderColor: '#F0E0E5',
  },
  opcionCorrecta:  { borderColor: '#85A89E', backgroundColor: '#F0F9F4' },
  opcionIncorrecta:{ borderColor: '#FF8A80', backgroundColor: '#FFF5F5' },
  opcionApagada:   { opacity: 0.35 },
  opcionCirculo: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#F0E0E5',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  opcionLetra: { fontSize: 11, fontWeight: '800', color: '#9D8189' },
  opcionTxt:   { flex: 1, fontSize: 13, fontWeight: '600', color: '#6D5A62' },

  explicacion:    { borderRadius: 12, padding: 12 },
  explicacionTxt: { fontSize: 13, fontWeight: '600', lineHeight: 19 },

  // Navegación
  navRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#FFF0F4',
    gap: 8,
  },
  navAtras: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 8, paddingVertical: 8,
  },
  navAtrasTxt:  { fontSize: 13, fontWeight: '600', color: '#9D8189' },
  puntosRow:    { flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 },
  punto: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#F0E0E5',
  },
  navSiguiente: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 18, paddingVertical: 11,
    borderRadius: 99, elevation: 3,
  },
  navSiguienteTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
