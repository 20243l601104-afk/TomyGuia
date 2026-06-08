import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, PanResponder, Modal, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW, height: SH } = Dimensions.get('window');
const STORAGE_KEY = 'tomy_academia_progress';

// ─── TIPOS ───────────────────────────────────────────
type NivelId = 1 | 2 | 3 | 4 | 5 | 6;
type SeccionId = 1 | 2 | 3;
type VistaId = 'mapa' | 'bienvenida' | 'teoria' | 'juego' | 'completado';

interface Nivel {
  id: NivelId;
  titulo: string;
  subtitulo: string;
  seccion: SeccionId;
  emoji: string;
  flores: number;
}

// ─── NIVELES ─────────────────────────────────────────
const NIVELES: Nivel[] = [
  // BÁSICO
  { id: 1, titulo: 'El Despertar',        subtitulo: '¿Qué es el dinero?',        seccion: 1, emoji: '✨', flores: 5  },
  { id: 2, titulo: 'Gastos Hormiga',      subtitulo: 'Los pequeños gastos cuentan', seccion: 1, emoji: '🐜', flores: 5  },
  { id: 3, titulo: 'El Timón 50/30/20',   subtitulo: 'Distribuye tu dinero',       seccion: 1, emoji: '⚖️', flores: 10 },
  { id: 4, titulo: 'Violencia Económica', subtitulo: 'Conoce tus derechos',        seccion: 1, emoji: '🛡️', flores: 10 },
  // INTERMEDIO
  { id: 5, titulo: 'Crédito e Historial', subtitulo: 'Tu reputación financiera',   seccion: 2, emoji: '💳', flores: 15 },
  // AVANZADO
  { id: 6, titulo: 'Inversión Básica',    subtitulo: 'Haz crecer tu dinero',       seccion: 3, emoji: '🌱', flores: 20 },
];

const SECCIONES = [
  { id: 1 as SeccionId, label: 'Nivel Básico',     color: '#F4ACB7' },
  { id: 2 as SeccionId, label: 'Nivel Intermedio', color: '#F3C57C' },
  { id: 3 as SeccionId, label: 'Nivel Avanzado',   color: '#85A89E' },
];

// ─── CONTENIDO POR NIVEL ─────────────────────────────
const TEORIA: Record<NivelId, { titulo: string; contenido: string; emoji: string }[]> = {
  1: [
    { emoji: '✨', titulo: '¿Qué es el dinero?', contenido: 'El dinero es un intercambio de energía y tiempo. Cuando trabajas, intercambias tu tiempo por dinero. En México usamos el Peso (MXN).' },
    { emoji: '⚖️', titulo: 'Ingreso vs Gasto', contenido: 'Ingreso es todo lo que entra a tu bolsillo — sueldo, ventas, regalos.\n\nGasto es todo lo que sale — renta, comida, transporte.\n\nLa clave es que tus ingresos siempre sean mayores que tus gastos.' },
    { emoji: '💡', titulo: 'Tu primer paso', contenido: 'Registrar tus gastos es el primer paso hacia la independencia financiera. No importa si son $10 o $10,000 — lo que no mides, no puedes mejorar.' },
  ],
  2: [
    { emoji: '🐜', titulo: '¿Qué son los gastos hormiga?', contenido: 'Son pequeñas compras diarias que parecen inofensivas:\n\n☕ Un café: $45\n🌮 Tacos de antojo: $80\n🍬 Botanas: $30\n\nParecen poca cosa, pero suman más de lo que crees.' },
    { emoji: '📊', titulo: 'El efecto nieve', contenido: 'Un café diario de $45 al año son $16,425.\n\nUna salida semanal de $200 al año son $10,400.\n\nNo se trata de no disfrutar — se trata de ser consciente.' },
  ],
  3: [
    { emoji: '⚖️', titulo: 'La regla 50/30/20', contenido: 'Divide tu ingreso en tres partes:\n\n🌸 50% Necesidades — renta, luz, agua, comida\n🌞 30% Gustos — lo que disfrutas\n🛡️ 20% Futuro — ahorro y emergencias' },
    { emoji: '🎯', titulo: '¿Por qué funciona?', contenido: 'Esta regla te da estructura sin ser rígida. Puedes adaptarla a tu vida:\n\nSi rentas, puede que necesites más del 50% en necesidades.\n\nLo importante es siempre guardar aunque sea un poco para el futuro.' },
  ],
  4: [
    { emoji: '🛡️', titulo: '¿Qué es la violencia económica?', contenido: 'Es cuando alguien controla tu dinero sin tu permiso:\n\n❌ Impedirte trabajar\n❌ Controlar lo que gastas\n❌ Poner deudas a tu nombre sin avisarte\n❌ No darte acceso a tus documentos\n\nNo es normal y NO es tu culpa.' },
    { emoji: '💪', titulo: 'Tus derechos', contenido: 'Tienes derecho a:\n\n✅ Tener tu propio dinero\n✅ Trabajar y cobrar tu sueldo\n✅ Abrir cuentas bancarias\n✅ Conocer y manejar tus documentos\n✅ Tomar decisiones financieras independientes' },
    { emoji: '📞', titulo: 'Si necesitas ayuda', contenido: 'No estás sola. Hay apoyo gratuito:\n\n📞 INMUJERES: 800 911 2511\n📞 CNDH: 800 715 0505\n\nAmbas líneas son gratuitas y disponibles las 24 horas.' },
  ],
  5: [
    { emoji: '💳', titulo: '¿Qué es el crédito?', contenido: 'El crédito es dinero prestado que debes devolver con intereses.\n\nUn buen historial crediticio te permite acceder a mejores préstamos, tarjetas y hasta rentas de departamento.' },
    { emoji: '📋', titulo: 'El Buró de Crédito', contenido: 'Es un registro de cómo pagas tus deudas. No es malo estar en él — todos estamos.\n\nLo malo es tener malos registros de pagos atrasados.' },
  ],
  6: [
    { emoji: '🌱', titulo: 'Hacer crecer tu dinero', contenido: 'Guardar dinero en el banco es solo el primer paso. Invertirlo lo hace crecer:\n\n📈 CETES — inversión del gobierno, muy segura\n📈 Fondos de inversión — más rendimiento, algo más de riesgo\n📈 AFORE — tu ahorro para el retiro' },
    { emoji: '⏰', titulo: 'El poder del tiempo', contenido: 'Si ahorras $500 al mes durante 10 años con 8% de rendimiento anual, tendrás más de $90,000.\n\nEmpezar hoy, aunque sea poco, hace una enorme diferencia.' },
  ],
};

// ─── JUEGOS POR NIVEL ────────────────────────────────
// Cada nivel tiene su tipo de juego
type JuegoTipo = 'atrapar' | 'calculadora' | 'distribuir' | 'quiz' | 'ordenar';

interface JuegoConfig {
  tipo: JuegoTipo;
  titulo: string;
  instruccion: string;
}

const JUEGOS: Record<NivelId, JuegoConfig> = {
  1: { tipo: 'quiz',        titulo: 'Quiz: Lo básico',        instruccion: 'Responde las preguntas correctamente' },
  2: { tipo: 'calculadora', titulo: 'Calculadora hormiga',    instruccion: '¿Cuánto gastas al año en pequeños gastos?' },
  3: { tipo: 'distribuir',  titulo: 'El Timón 50/30/20',      instruccion: 'Distribuye las monedas en los frascos correctos' },
  4: { tipo: 'quiz',        titulo: 'Quiz: Tus derechos',     instruccion: 'Identifica la violencia económica' },
  5: { tipo: 'ordenar',     titulo: 'Ordena tu historial',    instruccion: 'Pon en orden las acciones financieras' },
  6: { tipo: 'calculadora', titulo: 'Calculadora de ahorro',  instruccion: '¿Cuánto tendrás si ahorras X por Y años?' },
};

// ─── QUIZ DATA ────────────────────────────────────────
const QUIZ: Record<NivelId, { pregunta: string; opciones: string[]; correcta: number }[]> = {
  1: [
    { pregunta: '¿Qué es el ingreso?', opciones: ['Lo que gastas', 'Lo que entra a tu bolsillo', 'Una deuda', 'Un banco'], correcta: 1 },
    { pregunta: '¿Cuál es el primer paso para controlar tu dinero?', opciones: ['Ahorrar todo', 'Gastar menos', 'Registrar tus gastos', 'Pedir prestado'], correcta: 2 },
    { pregunta: '¿En qué moneda se usa en México?', opciones: ['Dólar', 'Euro', 'Peso MXN', 'Yen'], correcta: 2 },
  ],
  4: [
    { pregunta: '¿Cuál ES violencia económica?', opciones: ['Recibir un préstamo', 'Impedirte trabajar', 'Abrir tu propia cuenta', 'Hacer un presupuesto'], correcta: 1 },
    { pregunta: '¿Tienes derecho a tener tu propio dinero?', opciones: ['Solo si tu pareja lo permite', 'No, el dinero es de la familia', 'Sí, siempre', 'Solo si trabajas'], correcta: 2 },
    { pregunta: '¿Qué debes hacer si alguien controla tu dinero?', opciones: ['Aceptarlo', 'Buscar ayuda — INMUJERES: 800 911 2511', 'No hacer nada', 'Esconderlo'], correcta: 1 },
  ],
  2: [], 3: [], 5: [], 6: [],
};

// ─── COMPONENTE PRINCIPAL ────────────────────────────
interface Props {
  onAddFlowers?: (amount: number, achievementId?: string) => void;
}

export function AcademiaScreen({ onAddFlowers }: Props) {
  const ins = useSafeAreaInsets();
  const [vista, setVista]               = useState<VistaId>('bienvenida');
  const [nivelActual, setNivelActual]   = useState<Nivel | null>(null);
  const [teoriaIdx, setTeoriaIdx]       = useState(0);
  const [nivelesDesbloqueados, setDesbloqueados] = useState<Set<NivelId>>(new Set([1]));
  const [nivelesCompletados, setCompletados]     = useState<Set<NivelId>>(new Set());
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);

  // Cargar progreso guardado
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.desbloqueados) setDesbloqueados(new Set(data.desbloqueados));
      if (data.completados)   setCompletados(new Set(data.completados));
    });
  }, []);

  const guardarProgreso = async (desbloq: Set<NivelId>, complet: Set<NivelId>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      desbloqueados: [...desbloq],
      completados:   [...complet],
    }));
  };

  const completarNivel = (nivel: Nivel) => {
    const newComplet = new Set([...nivelesCompletados, nivel.id]);
    const siguiente  = (nivel.id + 1) as NivelId;
    const newDesblq  = new Set([...nivelesDesbloqueados, siguiente]);
    setCompletados(newComplet);
    setDesbloqueados(newDesblq);
    guardarProgreso(newDesblq, newComplet);
    onAddFlowers?.(nivel.flores, `academia_nivel_${nivel.id}`);
    setVista('completado');
  };

  const iniciarNivel = (nivel: Nivel) => {
    setNivelActual(nivel);
    setTeoriaIdx(0);
    setVista('teoria');
  };

  // ── BIENVENIDA ───────────────────────────────────────
  if (vista === 'bienvenida' && mostrarBienvenida) {
    return (
      <View style={[s.container, { paddingTop: ins.top }]}>
        <ScrollView contentContainerStyle={s.bienvenidaContent} showsVerticalScrollIndicator={false}>
          <View style={s.bienvenidaTomasaWrap}>
            <TomasaSVG size={110} floating mood="happy" />
          </View>

          <View style={s.bienvenidaCard}>
            <Text style={s.bienvenidaTitulo}>¡Bienvenida a TomyAcademia! 🌸</Text>
            <Text style={s.bienvenidaTexto}>
              Aquí aprenderás finanzas personales desde lo más básico hasta lo más avanzado, a tu propio ritmo.
            </Text>
            <Text style={s.bienvenidaTexto}>
              El conocimiento es poder — y el conocimiento financiero es libertad real 💪
            </Text>

            {/* Cómo funciona */}
            <View style={s.bienvenidaComoRow}>
              <View style={s.bienvenidaComo}>
                <Text style={s.bienvenidaComoEmoji}>📖</Text>
                <Text style={s.bienvenidaComoTxt}>Lee la teoría</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#F4ACB7" />
              <View style={s.bienvenidaComo}>
                <Text style={s.bienvenidaComoEmoji}>🎮</Text>
                <Text style={s.bienvenidaComoTxt}>Juega y practica</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#F4ACB7" />
              <View style={s.bienvenidaComo}>
                <Text style={s.bienvenidaComoEmoji}>🌸</Text>
                <Text style={s.bienvenidaComoTxt}>Gana flores</Text>
              </View>
            </View>

            {/* Flores */}
            <View style={s.floresCard}>
              <Text style={s.floresEmoji}>🌸</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.floresTitulo}>Gana flores de cempasúchil</Text>
                <Text style={s.floresDesc}>
                  Cada lección completada te da flores 🌸 que podrás canjear por puntos en tu banco favorito. ¡Aprende y gana!
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={s.bienvenidaBtn} onPress={() => setMostrarBienvenida(false)}>
            <Text style={s.bienvenidaBtnTxt}>¡Empezar a aprender! 🚀</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── MAPA DE NIVELES ──────────────────────────────────
  if (vista === 'mapa' || !mostrarBienvenida) {
    return (
      <View style={[s.container, { paddingTop: ins.top }]}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitulo}>TomyAcademia 🎓</Text>
            <Text style={s.headerSub}>Elige tu próxima lección</Text>
          </View>
          <View style={s.floresBadge}>
            <Text style={s.floresBadgeTxt}>🌸 {[...nivelesCompletados].reduce((a, id) => {
              const n = NIVELES.find(n => n.id === id);
              return a + (n?.flores || 0);
            }, 0)}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {SECCIONES.map(seccion => {
            const nivelesSeccion = NIVELES.filter(n => n.seccion === seccion.id);
            const seccionDesbloqueada = seccion.id === 1 ||
              nivelesSeccion.some(n => nivelesDesbloqueados.has(n.id));

            return (
              <View key={seccion.id} style={s.seccion}>
                {/* Header de sección */}
                <View style={[s.seccionHeader, { borderColor: seccion.color }]}>
                  <View style={[s.seccionDot, { backgroundColor: seccionDesbloqueada ? seccion.color : '#ccc' }]} />
                  <Text style={[s.seccionTitulo, { color: seccionDesbloqueada ? seccion.color : '#ccc' }]}>
                    {seccion.label}
                  </Text>
                  {!seccionDesbloqueada && <Ionicons name="lock-closed" size={14} color="#ccc" />}
                </View>

                {/* Niveles */}
                {nivelesSeccion.map((nivel, idx) => {
                  const desbloqueado = nivelesDesbloqueados.has(nivel.id);
                  const completado   = nivelesCompletados.has(nivel.id);
                  const esAlternado  = idx % 2 === 0;

                  return (
                    <View key={nivel.id} style={[s.nivelRow, esAlternado ? s.nivelLeft : s.nivelRight]}>
                      <TouchableOpacity
                        style={[
                          s.nivelBtn,
                          desbloqueado && { borderColor: seccion.color, backgroundColor: seccion.color + '15' },
                          completado   && { backgroundColor: seccion.color + '30' },
                          !desbloqueado && s.nivelBloqueado,
                        ]}
                        onPress={() => desbloqueado && iniciarNivel(nivel)}
                        disabled={!desbloqueado}
                        activeOpacity={0.7}
                      >
                        {completado ? (
                          <Ionicons name="checkmark-circle" size={32} color={seccion.color} />
                        ) : desbloqueado ? (
                          <Text style={s.nivelEmoji}>{nivel.emoji}</Text>
                        ) : (
                          <Ionicons name="lock-closed" size={24} color="#ccc" />
                        )}
                        {desbloqueado && !completado && (
                          <View style={[s.floresNivel, { backgroundColor: seccion.color }]}>
                            <Text style={s.floresNivelTxt}>+{nivel.flores}🌸</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <View style={[s.nivelInfo, esAlternado ? s.nivelInfoRight : s.nivelInfoLeft]}>
                        <Text style={[s.nivelTitulo, !desbloqueado && { color: '#ccc' }]}>{nivel.titulo}</Text>
                        <Text style={[s.nivelSub, !desbloqueado && { color: '#ccc' }]}>{nivel.subtitulo}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  // ── TEORÍA ───────────────────────────────────────────
  if (vista === 'teoria' && nivelActual) {
    const tarjetas = TEORIA[nivelActual.id];
    const esUltima = teoriaIdx === tarjetas.length - 1;
    const tarjeta  = tarjetas[teoriaIdx];

    return (
      <View style={[s.container, { paddingTop: ins.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { setVista('mapa'); setMostrarBienvenida(false); }}>
            <Ionicons name="chevron-back" size={24} color="#9D8189" />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>{nivelActual.titulo}</Text>
          <Text style={s.headerSub}>{teoriaIdx + 1}/{tarjetas.length}</Text>
        </View>

        {/* Barra de progreso */}
        <View style={s.progresoBarra}>
          <View style={[s.progresoRelleno, {
            width: `${((teoriaIdx + 1) / tarjetas.length) * 100}%` as any,
            backgroundColor: SECCIONES.find(s => s.id === nivelActual.seccion)?.color || '#F4ACB7',
          }]} />
        </View>

        <ScrollView contentContainerStyle={s.teoriaContent} showsVerticalScrollIndicator={false}>
          {/* Tomasa */}
          <View style={s.tomasaWrap}>
            <TomasaSVG size={90} floating mood="neutral" />
          </View>

          {/* Tarjeta */}
          <View style={s.teoriaCard}>
            <Text style={s.teoriaEmoji}>{tarjeta.emoji}</Text>
            <Text style={s.teoriaTitulo}>{tarjeta.titulo}</Text>
            <Text style={s.teoriaTexto}>{tarjeta.contenido}</Text>
          </View>
        </ScrollView>

        {/* Navegación */}
        <View style={[s.navRow, { paddingBottom: ins.bottom + 12 }]}>
          <TouchableOpacity
            style={[s.navBack, teoriaIdx === 0 && { opacity: 0 }]}
            onPress={() => setTeoriaIdx(i => i - 1)}
            disabled={teoriaIdx === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#9D8189" />
            <Text style={s.navBackTxt}>Anterior</Text>
          </TouchableOpacity>

          <View style={s.puntosFila}>
            {tarjetas.map((_, i) => (
              <View key={i} style={[s.punto, i === teoriaIdx && s.puntoActivo]} />
            ))}
          </View>

          <TouchableOpacity
            style={[s.navNext, { backgroundColor: SECCIONES.find(s => s.id === nivelActual.seccion)?.color || '#F4ACB7' }]}
            onPress={() => esUltima ? setVista('juego') : setTeoriaIdx(i => i + 1)}
          >
            <Text style={s.navNextTxt}>{esUltima ? '¡A jugar!' : 'Siguiente'}</Text>
            <Ionicons name={esUltima ? 'game-controller-outline' : 'chevron-forward'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── JUEGO ────────────────────────────────────────────
  if (vista === 'juego' && nivelActual) {
    const juego = JUEGOS[nivelActual.id];
    return (
      <JuegoWrapper
        nivel={nivelActual}
        juego={juego}
        onBack={() => setVista('teoria')}
        onComplete={() => completarNivel(nivelActual)}
        ins={ins}
      />
    );
  }

  // ── COMPLETADO ───────────────────────────────────────
  if (vista === 'completado' && nivelActual) {
    return (
      <View style={[s.container, s.completadoContainer, { paddingTop: ins.top }]}>
        <TomasaSVG size={120} floating mood="happy" />
        <Text style={s.completadoTitulo}>¡Lo lograste! 🎉</Text>
        <Text style={s.completadoSub}>{nivelActual.titulo} completado</Text>
        <View style={s.completadoFlores}>
          <Text style={s.completadoFloresEmoji}>🌸</Text>
          <Text style={s.completadoFloresTxt}>+{nivelActual.flores} flores ganadas</Text>
        </View>
        <Text style={s.completadoMsg}>
          Cada lección te acerca más a tu independencia financiera 💪
        </Text>
        <TouchableOpacity
          style={s.completadoBtn}
          onPress={() => { setVista('mapa'); setMostrarBienvenida(false); }}
        >
          <Text style={s.completadoBtnTxt}>Ver mis niveles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

// ─── WRAPPER DE JUEGOS ────────────────────────────────
function JuegoWrapper({ nivel, juego, onBack, onComplete, ins }: {
  nivel: Nivel;
  juego: JuegoConfig;
  onBack: () => void;
  onComplete: () => void;
  ins: any;
}) {
  if (juego.tipo === 'quiz') {
    return <JuegoQuiz nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  }
  if (juego.tipo === 'distribuir') {
    return <JuegoDistribuir nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  }
  if (juego.tipo === 'calculadora') {
    return <JuegoCalculadora nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  }
  return (
    <View style={[s.container, { paddingTop: ins.top, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={{ fontSize: 48 }}>{nivel.emoji}</Text>
      <Text style={[s.headerTitulo, { textAlign: 'center', marginVertical: 16 }]}>{juego.titulo}</Text>
      <Text style={[s.headerSub, { textAlign: 'center', marginBottom: 32 }]}>{juego.instruccion}</Text>
      <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
        <Text style={s.completadoBtnTxt}>Completar lección</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── JUEGO: QUIZ ─────────────────────────────────────
function JuegoQuiz({ nivel, onBack, onComplete, ins }: any) {
  const preguntas = QUIZ[nivel.id as NivelId] || [];
  const [idx, setIdx]           = useState(0);
  const [respuesta, setRespuesta] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const responder = (i: number) => {
    if (respuesta !== null) return;
    setRespuesta(i);
    if (i === preguntas[idx].correcta) {
      setAciertos(a => a + 1);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  };

  const siguiente = () => {
    if (idx < preguntas.length - 1) {
      setIdx(i => i + 1);
      setRespuesta(null);
    } else {
      setTerminado(true);
    }
  };

  if (terminado) {
    const perfecto = aciertos === preguntas.length;
    return (
      <View style={[s.container, s.completadoContainer, { paddingTop: ins.top }]}>
        <Text style={{ fontSize: 60 }}>{perfecto ? '🏆' : '💪'}</Text>
        <Text style={s.completadoTitulo}>{perfecto ? '¡Perfecto!' : '¡Bien hecho!'}</Text>
        <Text style={s.completadoSub}>{aciertos}/{preguntas.length} respuestas correctas</Text>
        <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
          <Text style={s.completadoBtnTxt}>Continuar 🌸</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const p = preguntas[idx];

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#9D8189" />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Quiz</Text>
        <Text style={s.headerSub}>{idx + 1}/{preguntas.length}</Text>
      </View>
      <View style={s.progresoBarra}>
        <View style={[s.progresoRelleno, { width: `${((idx + 1) / preguntas.length) * 100}%` as any, backgroundColor: '#F4ACB7' }]} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <TomasaSVG size={80} floating={false} mood={respuesta === null ? 'neutral' : respuesta === p.correcta ? 'happy' : 'worried'} />
        <Animated.View style={[s.quizCard, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={s.quizPregunta}>{p.pregunta}</Text>
        </Animated.View>

        {p.opciones.map((op, i) => {
          const esCorrecta  = i === p.correcta;
          const esElegida   = i === respuesta;
          const mostrarBien = respuesta !== null && esCorrecta;
          const mostrarMal  = respuesta !== null && esElegida && !esCorrecta;

          return (
            <TouchableOpacity
              key={i}
              style={[s.quizOpcion,
                mostrarBien && s.quizCorrecta,
                mostrarMal  && s.quizIncorrecta,
                respuesta !== null && !esCorrecta && !esElegida && { opacity: 0.4 },
              ]}
              onPress={() => responder(i)}
              disabled={respuesta !== null}
            >
              <View style={[s.quizCirculo,
                mostrarBien && { backgroundColor: '#85A89E', borderColor: '#85A89E' },
                mostrarMal  && { backgroundColor: '#FF8A80', borderColor: '#FF8A80' },
              ]}>
                {mostrarBien ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : mostrarMal ? <Ionicons name="close" size={14} color="#fff" />
                  : <Text style={s.quizLetra}>{['A','B','C','D'][i]}</Text>}
              </View>
              <Text style={[s.quizOpcionTxt, mostrarBien && { color: '#5B776F', fontWeight: '700' }]}>{op}</Text>
            </TouchableOpacity>
          );
        })}

        {respuesta !== null && (
          <TouchableOpacity style={[s.navNext, { backgroundColor: '#F4ACB7', alignSelf: 'flex-end' }]} onPress={siguiente}>
            <Text style={s.navNextTxt}>{idx < preguntas.length - 1 ? 'Siguiente' : 'Ver resultados'}</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── JUEGO: DISTRIBUIR 50/30/20 ──────────────────────
function JuegoDistribuir({ nivel, onBack, onComplete, ins }: any) {
  const TOTAL_MONEDAS = 10;
  const FRASCOS = [
    { id: 'needs', label: 'Necesidades', pct: 50, esperadas: 5, color: '#F4ACB7' },
    { id: 'wants', label: 'Gustos',      pct: 30, esperadas: 3, color: '#F3C57C' },
    { id: 'savings', label: 'Futuro',    pct: 20, esperadas: 2, color: '#85A89E' },
  ];
  const [distribucion, setDistribucion] = useState<Record<string, number>>({ needs: 0, wants: 0, savings: 0 });
  const [sinAsignar, setSinAsignar]     = useState(TOTAL_MONEDAS);
  const [verificado, setVerificado]     = useState(false);
  const [correcto, setCorrecto]         = useState(false);

  const agregarMoneda = (id: string) => {
    if (sinAsignar === 0) return;
    setDistribucion(d => ({ ...d, [id]: d[id] + 1 }));
    setSinAsignar(n => n - 1);
  };

  const quitarMoneda = (id: string) => {
    if (distribucion[id] === 0) return;
    setDistribucion(d => ({ ...d, [id]: d[id] - 1 }));
    setSinAsignar(n => n + 1);
  };

  const verificar = () => {
    const esCorr = FRASCOS.every(f => distribucion[f.id] === f.esperadas);
    setCorrecto(esCorr);
    setVerificado(true);
  };

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <Text style={s.headerTitulo}>El Timón 50/30/20</Text>
        <Text style={s.headerSub}>🪙 {sinAsignar} restantes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center' }}>
        <Text style={[s.quizPregunta, { textAlign: 'center' }]}>
          Tienes 10 monedas (cada una = 10% de tu dinero).{'\n'}Ponlas en los frascos según la regla 50/30/20.
        </Text>

        {FRASCOS.map(frasco => (
          <View key={frasco.id} style={[s.frascoCard, { borderColor: frasco.color }]}>
            <View style={[s.frascoBarra, { backgroundColor: frasco.color + '30' }]}>
              <View style={[s.frascoRelleno, {
                height: `${(distribucion[frasco.id] / frasco.esperadas) * 100}%` as any,
                backgroundColor: frasco.color,
              }]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.frascoLabel}>{frasco.label}</Text>
              <Text style={[s.frascoPct, { color: frasco.color }]}>{frasco.pct}%</Text>
              <Text style={s.frascoCount}>{distribucion[frasco.id]}/10 monedas</Text>
            </View>
            <View style={s.frascoControles}>
              <TouchableOpacity style={[s.frascoBtn, { backgroundColor: frasco.color }]} onPress={() => agregarMoneda(frasco.id)} disabled={sinAsignar === 0}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[s.frascoBtn, { backgroundColor: '#F0E0E5' }]} onPress={() => quitarMoneda(frasco.id)}>
                <Ionicons name="remove" size={20} color="#9D8189" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {verificado && (
          <View style={[s.quizCard, { backgroundColor: correcto ? '#D8F5EE' : '#FFF0F0' }]}>
            <Text style={[s.quizPregunta, { color: correcto ? '#2D7A5E' : '#D64545', textAlign: 'center' }]}>
              {correcto
                ? '¡Perfecto! 50% necesidades, 30% gustos, 20% futuro 🎉'
                : 'Casi 💪 Recuerda: 5 monedas para necesidades, 3 para gustos y 2 para futuro'}
            </Text>
          </View>
        )}

        {!verificado ? (
          <TouchableOpacity
            style={[s.completadoBtn, sinAsignar > 0 && { opacity: 0.4 }]}
            onPress={verificar}
            disabled={sinAsignar > 0}
          >
            <Text style={s.completadoBtnTxt}>Verificar distribución</Text>
          </TouchableOpacity>
        ) : correcto ? (
          <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
            <Text style={s.completadoBtnTxt}>¡Continuar! 🌸</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.completadoBtn, { backgroundColor: '#9D8189' }]} onPress={() => {
            setDistribucion({ needs: 0, wants: 0, savings: 0 });
            setSinAsignar(TOTAL_MONEDAS);
            setVerificado(false);
          }}>
            <Text style={s.completadoBtnTxt}>Intentar de nuevo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ─── JUEGO: CALCULADORA HORMIGA ──────────────────────
function JuegoCalculadora({ nivel, onBack, onComplete, ins }: any) {
  const ITEMS = [
    { id: 'cafe',    emoji: '☕', label: 'Café diario',      precio: 45  },
    { id: 'tacos',   emoji: '🌮', label: 'Tacos de antojo', precio: 80  },
    { id: 'botanas', emoji: '🍟', label: 'Botanas',          precio: 30  },
    { id: 'refresco',emoji: '🥤', label: 'Refresco',         precio: 25  },
  ];
  const [seleccionado, setSeleccionado] = useState(ITEMS[0]);
  const [precio, setPrecio]             = useState(String(ITEMS[0].precio));
  const [visto, setVisto]               = useState(false);
  const anual = (Number(precio) || 0) * 365;
  const mensual = (Number(precio) || 0) * 30;

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <Text style={s.headerTitulo}>Calculadora Hormiga</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={[s.quizPregunta, { textAlign: 'center' }]}>
          ¿Cuánto gastas al año en pequeños gustos?
        </Text>

        {/* Selector */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[s.quizOpcion, { paddingVertical: 10, paddingHorizontal: 16 },
                seleccionado.id === item.id && { backgroundColor: '#F4ACB720', borderColor: '#F4ACB7' }]}
              onPress={() => { setSeleccionado(item); setPrecio(String(item.precio)); setVisto(false); }}
            >
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              <Text style={[s.quizOpcionTxt, { fontSize: 12 }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Precio */}
        <View style={s.quizCard}>
          <Text style={s.quizPregunta}>¿Cuánto cuesta tu {seleccionado.label.toLowerCase()}?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#F4ACB7' }}>$</Text>
            <View style={{ flex: 1, backgroundColor: '#FFF8F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#FFCAD4' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#9D8189' }}>{precio}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {['15','25','30','45','60','80','100'].map(v => (
              <TouchableOpacity key={v} style={[s.mesBtn, precio === v && s.mesBtnActive]} onPress={() => { setPrecio(v); setVisto(false); }}>
                <Text style={[s.mesBtnTxt, precio === v && s.mesBtnTxtActive]}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resultado */}
        <TouchableOpacity
          style={[s.completadoBtn, !precio && { opacity: 0.4 }]}
          onPress={() => setVisto(true)}
          disabled={!precio}
        >
          <Text style={s.completadoBtnTxt}>¡Calcular! 🐜</Text>
        </TouchableOpacity>

        {visto && (
          <View style={[s.quizCard, { backgroundColor: '#FFF0F0', gap: 8 }]}>
            <Text style={{ fontSize: 32, textAlign: 'center' }}>{seleccionado.emoji}</Text>
            <Text style={[s.quizPregunta, { textAlign: 'center', color: '#D64545' }]}>
              Al mes gastas ${mensual.toLocaleString('es-MX')}
            </Text>
            <Text style={[s.completadoTitulo, { color: '#D64545' }]}>
              ¡Al año son ${anual.toLocaleString('es-MX')}!
            </Text>
            <Text style={{ fontSize: 13, color: '#9D8189', textAlign: 'center', lineHeight: 19 }}>
              No se trata de no disfrutar — se trata de ser consciente de lo que gastas 💡
            </Text>
            <TouchableOpacity style={[s.completadoBtn, { marginTop: 8 }]} onPress={onComplete}>
              <Text style={s.completadoBtnTxt}>¡Entendido! 🌸</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── ESTILOS ─────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFF8F9' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#FFF0F4',
  },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: '#9D8189' },
  headerSub:    { fontSize: 12, color: '#9D8189', opacity: 0.6 },

  // Bienvenida
  bienvenidaContent: { padding: 24, gap: 20, alignItems: 'center' },
  bienvenidaTomasaWrap: { marginTop: 20 },
  bienvenidaCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, gap: 14, elevation: 4, width: '100%' },
  bienvenidaTitulo: { fontSize: 22, fontWeight: '800', color: '#F4ACB7', textAlign: 'center' },
  bienvenidaTexto:  { fontSize: 14, color: '#9D8189', lineHeight: 22, textAlign: 'center' },
  bienvenidaComoRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  bienvenidaComo:   { alignItems: 'center', gap: 4 },
  bienvenidaComoEmoji:{ fontSize: 24 },
  bienvenidaComoTxt:  { fontSize: 11, fontWeight: '600', color: '#9D8189', textAlign: 'center' },
  floresCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF8F9', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FFCAD4' },
  floresEmoji:  { fontSize: 32 },
  floresTitulo: { fontSize: 14, fontWeight: '800', color: '#9D8189', marginBottom: 4 },
  floresDesc:   { fontSize: 12, color: '#9D8189', opacity: 0.8, lineHeight: 18 },
  bienvenidaBtn: { backgroundColor: '#F4ACB7', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 40, elevation: 4, width: '100%' },
  bienvenidaBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },

  // Header flores
  floresBadge:    { backgroundColor: '#FFF0F4', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  floresBadgeTxt: { fontSize: 14, fontWeight: '800', color: '#F4ACB7' },

  // Mapa
  seccion:       { paddingHorizontal: 20, marginBottom: 8 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16, paddingBottom: 8, borderBottomWidth: 2 },
  seccionDot:    { width: 10, height: 10, borderRadius: 5 },
  seccionTitulo: { fontSize: 14, fontWeight: '800', flex: 1 },
  nivelRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  nivelLeft:     { flexDirection: 'row' },
  nivelRight:    { flexDirection: 'row-reverse' },
  nivelBtn: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#F0E0E5',
    elevation: 3, flexShrink: 0,
  },
  nivelBloqueado:  { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  nivelEmoji:      { fontSize: 30 },
  nivelInfo:       { flex: 1 },
  nivelInfoRight:  { alignItems: 'flex-start' },
  nivelInfoLeft:   { alignItems: 'flex-end' },
  nivelTitulo:     { fontSize: 14, fontWeight: '800', color: '#6D5A62', marginBottom: 2 },
  nivelSub:        { fontSize: 12, color: '#9D8189', opacity: 0.7 },
  floresNivel: {
    position: 'absolute', bottom: -6, right: -6,
    borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2,
  },
  floresNivelTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Progreso
  progresoBarra:  { height: 4, backgroundColor: '#F0E0E5', margin: 0 },
  progresoRelleno:{ height: '100%', borderRadius: 2 },

  // Teoría
  teoriaContent: { padding: 24, gap: 20, alignItems: 'center' },
  tomasaWrap:    { marginTop: 8 },
  teoriaCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    gap: 12, elevation: 4, width: '100%',
    borderWidth: 1, borderColor: '#FFF0F4',
  },
  teoriaEmoji:  { fontSize: 44, textAlign: 'center' },
  teoriaTitulo: { fontSize: 20, fontWeight: '800', color: '#F4ACB7', textAlign: 'center' },
  teoriaTexto:  { fontSize: 15, color: '#9D8189', lineHeight: 24, textAlign: 'left' },

  // Navegación
  navRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#FFF0F4' },
  navBack:    { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navBackTxt: { fontSize: 14, fontWeight: '600', color: '#9D8189' },
  puntosFila: { flexDirection: 'row', gap: 6 },
  punto:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F0E0E5' },
  puntoActivo:{ width: 16, backgroundColor: '#F4ACB7' },
  navNext:    { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 99, elevation: 3 },
  navNextTxt: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Completado
  completadoContainer: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  completadoTitulo:    { fontSize: 28, fontWeight: '800', color: '#F4ACB7', textAlign: 'center' },
  completadoSub:       { fontSize: 16, color: '#9D8189', textAlign: 'center' },
  completadoFlores:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F4', borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10 },
  completadoFloresEmoji:{ fontSize: 28 },
  completadoFloresTxt: { fontSize: 16, fontWeight: '800', color: '#F4ACB7' },
  completadoMsg:       { fontSize: 14, color: '#9D8189', textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  completadoBtn:       { backgroundColor: '#F4ACB7', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, elevation: 4 },
  completadoBtnTxt:    { color: '#fff', fontWeight: '800', fontSize: 15, textAlign: 'center' },

  // Quiz
  quizCard:     { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 3, borderWidth: 1, borderColor: '#FFF0F4' },
  quizPregunta: { fontSize: 16, fontWeight: '700', color: '#6D5A62', lineHeight: 24 },
  quizOpcion: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#F0E0E5',
  },
  quizCorrecta:   { borderColor: '#85A89E', backgroundColor: '#F0F9F4' },
  quizIncorrecta: { borderColor: '#FF8A80', backgroundColor: '#FFF5F5' },
  quizCirculo: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: '#F0E0E5',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  quizLetra:     { fontSize: 12, fontWeight: '800', color: '#9D8189' },
  quizOpcionTxt: { flex: 1, fontSize: 14, fontWeight: '600', color: '#6D5A62' },

  // Frasco 50/30/20
  frascoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 2, elevation: 2, width: '100%',
  },
  frascoBarra:    { width: 24, height: 100, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  frascoRelleno:  { width: '100%', borderRadius: 12 },
  frascoLabel:    { fontSize: 15, fontWeight: '800', color: '#6D5A62', marginBottom: 2 },
  frascoPct:      { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  frascoCount:    { fontSize: 12, color: '#9D8189', opacity: 0.7 },
  frascoControles:{ gap: 8 },
  frascoBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  // Mes selector
  mesBtn:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 99, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0E0E5' },
  mesBtnActive:  { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' },
  mesBtnTxt:     { fontSize: 12, fontWeight: '600', color: '#9D818980' },
  mesBtnTxtActive:{ color: '#fff', fontWeight: '800' },
});
