import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, PanResponder, Modal, Alert,
  GestureResponderEvent
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TomasaSVG } from '../components/TomasaSVG';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TutorialOverlay, BotonAyuda } from '../components/TutorialOverlay';
import { EmergencyModal } from '../components/EmergencyModal';
import type { PasoTutorial } from '../components/TutorialOverlay';

const { width: SW, height: SH } = Dimensions.get('window');
const STORAGE_KEY  = 'tomy_academia_progress';
const VE_INTRO_KEY = 'tomy_academia_ve_visto';

// ─── PALETA MEXA PINK ────────────────────────────────
const C = {
  ROSA:    '#F4ACB7',  // rosa principal
  ROSA2:   '#FFCAD4',  // rosa claro
  ROSA3:   '#FFF0F4',  // rosa muy claro fondo
  AMARILLO:'#F3C57C',  // gustos
  VERDE:   '#85A89E',  // futuro
  MORADO:  '#9D8189',  // texto principal
  MORADO2: '#6D5A62',  // texto oscuro
  MORADO3: '#D8B4BE',  // borde suave
  CEMPASUCHIL: '#FF6B35', // naranja mexicano
  JADE:    '#2D9596',  // verde jade mexicano
  ORO:     '#C9A84C',  // oro mexicano
  PURPURA: '#7B2D8B',  // morado mexicano
};

// ─── TIPOS ───────────────────────────────────────────
type NivelId = 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15;
type SeccionId = 1|2|3|4;
type VistaId = 'mapa'|'bienvenida'|'teoria'|'juego'|'completado';

interface Nivel {
  id: NivelId;
  titulo: string;
  subtitulo: string;
  seccion: SeccionId;
  emoji: string;
  flores: number;
  colorAccent: string;
}

// ─── 15 NIVELES ──────────────────────────────────────
const NIVELES: Nivel[] = [
  // SECCIÓN 1 — Conoce tu dinero (rosa mexicano)
  { id: 1,  titulo: '¿Qué es el dinero?',      subtitulo: 'Ingreso, gasto y control',           seccion: 1, emoji: '✨', flores: 5  },
  { id: 2,  titulo: 'Gastos Hormiga',           subtitulo: 'Los pequeños gastos importan',        seccion: 1, emoji: '🐜', flores: 5  },
  { id: 3,  titulo: 'El Timón 50/30/20',        subtitulo: 'Distribuye tu quincena',              seccion: 1, emoji: '⚖️', flores: 10 },
  { id: 4,  titulo: 'Violencia Económica',      subtitulo: 'Conoce y protege tus derechos',       seccion: 1, emoji: '🛡️', flores: 10 },
  // SECCIÓN 2 — Controla tu dinero (amarillo maíz)
  { id: 5,  titulo: 'Presupuesto Inteligente',  subtitulo: 'Tu plan mensual personalizado',       seccion: 2, emoji: '📋', flores: 15 },
  { id: 6,  titulo: 'Deudas: Buenas vs Malas',  subtitulo: 'No toda deuda es mala',               seccion: 2, emoji: '💳', flores: 15 },
  { id: 7,  titulo: 'Crédito e Historial',      subtitulo: 'Tu reputación financiera',            seccion: 2, emoji: '⭐', flores: 15 },
  { id: 8,  titulo: 'El SAT Sin Miedo',         subtitulo: 'RFC, facturas y declaraciones',       seccion: 2, emoji: '🧾', flores: 15 },
  // SECCIÓN 3 — Haz crecer tu dinero (verde Oaxaca)
  { id: 9,  titulo: 'Ahorro vs Inversión',      subtitulo: 'Haz que tu dinero trabaje',           seccion: 3, emoji: '🌱', flores: 20 },
  { id: 10, titulo: 'CETES y Fondos',           subtitulo: 'Invierte desde $100 pesos',           seccion: 3, emoji: '📈', flores: 20 },
  { id: 11, titulo: 'Tu AFORE',                 subtitulo: 'El dinero que te espera al retiro',   seccion: 3, emoji: '🏦', flores: 20 },
  { id: 12, titulo: 'Emprende Segura',          subtitulo: 'Formaliza tu negocio',                seccion: 3, emoji: '🚀', flores: 20 },
  // SECCIÓN 4 — Conoce tus derechos (morado mexicano)
  { id: 13, titulo: 'Derechos Laborales',       subtitulo: 'Lo que no te pueden negar',           seccion: 4, emoji: '💼', flores: 25 },
  { id: 14, titulo: 'Contrato de Renta',        subtitulo: 'Cláusulas trampa y la ley',           seccion: 4, emoji: '🏠', flores: 25 },
  { id: 15, titulo: 'SAT Para Principiantes',   subtitulo: 'RFC, e.firma sin estrés',             seccion: 4, emoji: '📑', flores: 25 },
];

const SECCIONES = [
  { id:1 as SeccionId, label:'🌸 Conoce tu dinero',      sub:'Básico',     color:C.ROSA,        bg:C.ROSA3 },
  { id:2 as SeccionId, label:'🌻 Controla tu dinero',    sub:'Intermedio', color:C.CEMPASUCHIL, bg:'#FFF5F0' },
  { id:3 as SeccionId, label:'🌿 Haz crecer tu dinero',  sub:'Avanzado',   color:C.JADE,        bg:'#F0FAF9' },
  { id:4 as SeccionId, label:'💜 Conoce tus derechos',   sub:'Legal',      color:C.PURPURA,     bg:'#F5F0FF' },
];

// ─── TEORÍA POR NIVEL ────────────────────────────────
const TEORIA: Record<NivelId, {titulo:string;contenido:string;emoji:string}[]> = {
  1: [
    { emoji: '✨', titulo: '¿Por qué importa saber de dinero?', contenido: 'El 60% de las mujeres en México no tiene hábitos de ahorro. No porque no quieran — sino porque nadie les enseñó.\n\nConocer de finanzas no es para ricas. Es para todas. Y empieza con algo simple: entender que el dinero es una herramienta, no un enemigo.' },
    { emoji: '💰', titulo: 'Ingreso vs Gasto', contenido: 'Ingreso es todo lo que entra: sueldo, ventas, transferencias, regalos.\n\nGasto es todo lo que sale: renta, comida, transporte, gustos.\n\nLa clave de la libertad financiera es simple:\nIngresos > Gastos = Libertad\nGastos > Ingresos = Estrés' },
    { emoji: '📝', titulo: 'Tu primer paso hoy', contenido: 'No necesitas ser experta para empezar. Solo necesitas saber a dónde va tu dinero.\n\nRegistrar tus gastos — aunque sea en papel — es el acto más poderoso que puedes hacer por tus finanzas.\n\nLo que no mides, no puedes mejorar.' },
  ],
  2: [
    { emoji: '🐜', titulo: '¿Qué son los gastos hormiga?', contenido: 'Son compras pequeñas y cotidianas que parecen inofensivas pero que suman muchísimo:\n\n☕ Café diario: $45\n🌮 Tacos de antojo: $80\n🍬 Botanas: $30\n📱 Suscripciones olvidadas: $150\n\nAisladas parecen poca cosa. Juntas pueden comerse hasta el 20% de tu sueldo.' },
    { emoji: '❄️', titulo: 'El efecto nieve', contenido: 'Imagina una bolita de nieve que rueda por una montaña. Empieza pequeña, pero crece y crece.\n\nAsí funcionan los gastos hormiga:\n\nUn café diario de $45 al año = $16,425\nUna salida semanal de $200 al año = $10,400\n\nNo se trata de no disfrutar. Se trata de ser consciente.' },
  ],
  3: [
    { emoji: '⚖️', titulo: 'La regla 50/30/20', contenido: 'Divide tu ingreso mensual en tres partes:\n\n🌸 50% Necesidades\nRenta, luz, agua, comida, transporte. Lo que sí o sí tienes que pagar.\n\n🌞 30% Gustos\nSalidas, ropa, Netflix, cafés. Lo que disfrutas sin culpa.\n\n🛡️ 20% Futuro\nAhorro, fondo de emergencia, inversión.' },
    { emoji: '🎯', titulo: '¿Por qué funciona?', contenido: 'Esta regla fue creada por Elizabeth Warren, senadora y profesora de Harvard.\n\nFunciona porque:\n• Es flexible — puedes adaptarla a tu situación\n• Es simple — no necesitas ser contadora\n• Es poderosa — cubre todas las áreas de tu vida financiera\n\nSi rentas y ganas poco, quizás tu 50% no alcanza. Ajústalo. Lo importante es siempre guardar ese 20%.' },
  ],
  4: [
    { emoji: '🛡️', titulo: '¿Qué es la violencia económica?', contenido: 'Es una forma de abuso que pocas veces se habla:\n\n❌ Controlarte el dinero\n❌ Impedirte trabajar o estudiar\n❌ Obligarte a pedir dinero para lo básico\n❌ Poner deudas a tu nombre sin permiso\n❌ Destruir tus cosas o documentos\n\nPuede venir de una pareja, familiar o jefe. No es normal y no es tu culpa.' },
    { emoji: '💜', titulo: 'Tus derechos son irrenunciables', contenido: 'Por ley en México tienes derecho a:\n\n✅ Tener tu propio dinero y cuentas bancarias\n✅ Trabajar y recibir tu sueldo directamente\n✅ Conocer y controlar tus documentos\n✅ Tomar decisiones financieras independientes\n✅ No ser responsable de deudas que no contrajiste\n\nNadie puede quitarte estos derechos.' },
    { emoji: '📞', titulo: 'No estás sola', contenido: 'Si identificas violencia económica en tu vida:\n\n1. Documenta todo — capturas, recibos, mensajes\n2. Abre una cuenta bancaria solo tuya (Nu es gratis)\n3. Tramita tus documentos: CURP, INE, RFC\n4. Busca apoyo en alguien de confianza\n\n📞 INMUJERES: 800 911 2511\n📞 CNDH: 800 715 0505\n\nAmbas líneas son gratuitas las 24 horas.' },
  ],
  5: [
    { emoji: '📋', titulo: '¿Por qué hacer un presupuesto?', contenido: 'Solo el 28% de las mujeres en México confía en su conocimiento financiero. Un presupuesto cambia eso.\n\nNo es una dieta de dinero. Es un plan que tú controlas.\n\nCon un presupuesto:\n✅ Sabes exactamente a dónde va tu dinero\n✅ Dejas de preguntarte "¿en qué se fue?"\n✅ Puedes planear cosas que quieres lograr' },
    { emoji: '🗂️', titulo: 'Las 4 categorías esenciales', contenido: 'Todo gasto cabe en una de estas categorías:\n\n🏠 Vivienda — renta, luz, agua, gas\n🍽️ Vida diaria — comida, transporte, salud\n🌞 Gustos — entretenimiento, ropa, salidas\n💰 Futuro — ahorro, deudas, inversión\n\nTip: en el primer mes solo registra sin juzgar. El objetivo es conocerte, no castigarte.' },
  ],
  6: [
    { emoji: '💳', titulo: 'No toda deuda es mala', contenido: 'Deuda BUENA: te genera más valor del que cuesta\n• Crédito para estudiar y mejorar tus ingresos\n• Hipoteca para una casa propia\n• Préstamo para un negocio rentable\n\nDeuda MALA: te quita valor y no genera nada\n• Tarjeta de crédito para gastos de consumo\n• Crédito de nómina para gustos\n• Préstamos con intereses altísimos' },
    { emoji: '⚠️', titulo: 'El CAT — el número que debes conocer', contenido: 'El CAT (Costo Anual Total) te dice el costo real de un crédito, incluyendo todos los intereses y comisiones.\n\nEjemplo:\n• Tarjeta departamental: CAT 80-120%\n• Tarjeta Nu: CAT 28-35%\n• Crédito informal: puede ser +300%\n\nSiempre compara el CAT antes de contratar cualquier crédito. La ley obliga a informarlo.' },
  ],
  7: [
    { emoji: '⭐', titulo: '¿Qué es el historial crediticio?', contenido: 'Es tu "reputación" en el mundo del dinero. Registra cómo pagas tus deudas.\n\nLo guarda el Buró de Crédito — y no es malo estar ahí. Todos los que han tenido algún crédito estamos.\n\nLo malo es tener mal historial: pagos atrasados, deudas sin pagar.\n\nLo bueno: pagar a tiempo construye un historial positivo que abre puertas.' },
    { emoji: '🚪', titulo: '¿Para qué sirve un buen historial?', contenido: 'Un historial crediticio positivo te permite:\n\n✅ Obtener mejores tasas en préstamos\n✅ Rentar departamentos (muchas inmobiliarias lo piden)\n✅ Conseguir tarjetas con mejores beneficios\n✅ Acceder a créditos hipotecarios\n\nSe construye siendo consistente: paga aunque sea el mínimo, paga a tiempo, no uses más del 30% de tu límite.' },
  ],
  8: [
    { emoji: '🧾', titulo: 'El SAT no da miedo — solo da flojera', contenido: 'El SAT (Servicio de Administración Tributaria) es la institución que recauda impuestos en México.\n\nSi trabajas formalmente, tu empresa ya descuenta tus impuestos. Pero si eres freelance, tienes negocio o recibes pagos extras, necesitas conocerlo.\n\nLo básico que debes tener: RFC activo y Buzón Tributario.' },
    { emoji: '🔑', titulo: 'Los 3 documentos del SAT que necesitas', contenido: '1️⃣ RFC — Tu clave fiscal. Gratis en sat.gob.mx. Lo necesitas para cobrar formalmente, abrir cuentas de inversión y hacer trámites.\n\n2️⃣ e.firma — Tu firma digital. La tramitas en el SAT con una USB. Tiene vigencia de 4 años.\n\n3️⃣ Constancia de Situación Fiscal — Comprobante de que estás al corriente. La piden para muchos empleos y contratos.' },
  ],
  9: [
    { emoji: '🌱', titulo: 'Guardar vs Invertir — no es lo mismo', contenido: 'Guardar: poner dinero en una cuenta de banco o debajo del colchón. Tu dinero no crece — y con la inflación, en realidad pierde valor.\n\nInvertir: poner tu dinero a trabajar en instrumentos que generan rendimientos.\n\nEjemplo:\n$10,000 guardados en 10 años = $10,000\n$10,000 invertidos al 10% anual = $25,937' },
    { emoji: '⏰', titulo: 'El poder del interés compuesto', contenido: 'Einstein llamó al interés compuesto "la octava maravilla del mundo".\n\nEs ganar intereses sobre tus intereses. Con el tiempo, tu dinero crece exponencialmente.\n\nEmpezar a los 25 vs empezar a los 35 marca una diferencia enorme:\n\n$500/mes desde los 25 (40 años, 8% anual) = $1.7 millones\n$500/mes desde los 35 (30 años, 8% anual) = $745,000\n\nEl tiempo es tu mayor aliado. Empieza hoy, aunque sea poco.' },
  ],
  10: [
    { emoji: '📈', titulo: 'CETES — invierte con el gobierno', contenido: 'Los CETES (Certificados de la Tesorería) son la inversión más segura de México porque son emitidos por el gobierno federal.\n\n✅ Desde $100 pesos\n✅ Completamente digital en cetesdirecto.com\n✅ Rendimiento actual: ~10% anual\n✅ Sin comisiones\n✅ Tu dinero está garantizado por el gobierno\n\nIdeal para tu fondo de emergencia o ahorros de corto plazo.' },
    { emoji: '🏦', titulo: 'Fondos de inversión', contenido: 'Un fondo de inversión reúne el dinero de muchas personas para invertir en múltiples instrumentos.\n\nVentajas:\n• Más rendimiento que los CETES (generalmente)\n• Diversificación automática\n• Accesible desde apps como GBM, Fintual o Nu Cuentas\n\nRiesgo: mayor que CETES pero manejable a largo plazo.\n\nRegla de oro: nunca inviertas dinero que puedas necesitar pronto.' },
  ],
  11: [
    { emoji: '🏦', titulo: '¿Qué es tu AFORE?', contenido: 'La AFORE (Administradora de Fondos para el Retiro) guarda el 6.5% de tu sueldo para cuando te retires.\n\nTu empleador lo deposita mensualmente sin que lo veas, pero ese dinero es TUYO.\n\nPuedes consultar cuánto tienes en e-sar.com.mx con tu CURP.\n\nDato importante: si cambias de trabajo, el dinero no se pierde — se queda en tu AFORE.' },
    { emoji: '💪', titulo: 'Cómo aumentar tu AFORE', contenido: 'Las aportaciones voluntarias son la herramienta más poderosa:\n\n✅ Puedes depositar cuando quieras desde la app de tu AFORE\n✅ Son deducibles de impuestos hasta cierto límite\n✅ Generan rendimientos sobre rendimientos\n✅ Puedes retirarlas en caso de desempleo\n\nIncluso $200 al mes desde los 25 puede significar cientos de miles de pesos adicionales al retiro.' },
  ],
  12: [
    { emoji: '🚀', titulo: 'Formalizar tu negocio no es complicado', contenido: 'El 60% de los negocios en México operan en la informalidad. Formalizarte te protege y te abre puertas.\n\nVentajas de ser formal:\n✅ Puedes emitir facturas y cobrar a empresas\n✅ Accedes a créditos empresariales\n✅ Tienes seguridad social (IMSS)\n✅ Tu negocio tiene credibilidad\n✅ Proteges tus bienes personales' },
    { emoji: '📋', titulo: 'El RESICO — el régimen más fácil', contenido: 'El Régimen Simplificado de Confianza (RESICO) es perfecto para empezar:\n\n✅ Para ingresos menores a 3.5 millones al año\n✅ Pagos de ISR muy bajos (1% a 2.5%)\n✅ Declaración simplificada\n✅ Sin contabilidad compleja\n\nPasos para registrarte:\n1. Obtén tu RFC en sat.gob.mx\n2. Elige el RESICO como régimen\n3. Emite facturas CFDI desde el SAT o apps como Facturama\n4. Paga mensualmente (muy poco)' },
  ],
  13: [
    { emoji: '💼', titulo: 'Lo que la Ley Federal del Trabajo garantiza', contenido: 'Estos derechos son irrenunciables — nadie puede quitártelos:\n\n✅ Salario mínimo: $278.80/día en 2025\n✅ 6 días de vacaciones el primer año (aumentan cada año)\n✅ Prima vacacional: 25% del salario\n✅ Aguinaldo: mínimo 15 días antes del 20 de diciembre\n✅ IMSS desde el primer día de trabajo\n✅ No despido por embarazo (es ilegal)\n✅ Jornada máxima: 8 horas diarias' },
    { emoji: '⚖️', titulo: '¿Qué puedes hacer si no se cumplen?', contenido: 'Si tu empleador no respeta tus derechos:\n\n1. Documenta todo: contratos, recibos, mensajes\n2. Habla con Recursos Humanos por escrito\n3. Denuncia ante la STPS (stps.gob.mx) — es gratuito\n4. Acude a la Junta de Conciliación y Arbitraje — también gratuito\n\nNo tienes que tolerar violaciones a tus derechos. La ley está de tu lado.' },
  ],
  14: [
    { emoji: '🏠', titulo: 'Tus derechos como inquilina', contenido: 'La Ley de Arrendamiento Inmobiliario protege a los inquilinos:\n\n✅ El contrato mínimo es de 1 año\n✅ El depósito máximo es 2 meses de renta\n✅ La renta solo puede aumentar una vez al año y con 30 días de aviso\n✅ El arrendador no puede entrar sin tu permiso\n✅ Debes recibir recibos de pago\n✅ Puedes rescindir con 30 días de aviso' },
    { emoji: '⚠️', titulo: 'Cláusulas trampa que debes detectar', contenido: 'Antes de firmar, revisa que NO diga:\n\n❌ "El arrendador puede subir la renta cuando quiera"\n❌ "El inquilino renuncia a sus derechos legales"\n❌ "Depósito no reembolsable en ningún caso"\n❌ "El arrendador puede entrar en cualquier momento"\n❌ Pagos de servicios que corresponden al dueño\n\nSi algo no entiendes, pregunta antes de firmar. Nunca firmes bajo presión.' },
  ],
  15: [
    { emoji: '📑', titulo: 'RFC — tu identidad fiscal', contenido: 'El RFC (Registro Federal de Contribuyentes) es obligatorio para todos los mayores de 18 años en México.\n\nLo necesitas para:\n✅ Cobrar formalmente\n✅ Abrir cuentas de inversión\n✅ Hacer trámites bancarios y gubernamentales\n✅ Pedir facturas deducibles\n\nEs GRATIS y se tramita en sat.gob.mx en menos de 30 minutos.' },
    { emoji: '🔐', titulo: 'e.firma y Buzón Tributario', contenido: 'e.firma: tu firma digital oficial\n• La tramitas en el SAT con identificación oficial y USB\n• Vigencia de 4 años\n• Necesaria para trámites del IMSS, Infonavit, CURP\n\nBuzón Tributario: tu buzón oficial con el SAT\n• Obligatorio activarlo\n• Aquí llegan notificaciones del SAT\n• Puedes hacer trámites sin ir a oficinas\n\nAmbos son gratuitos y te dan acceso a todo el sistema fiscal digital.' },
  ],
};


// ─── JUEGOS POR NIVEL ────────────────────────────────
type JuegoTipo = 'red'|'calculadora'|'distribuir'|'quiz'|'ordenar'|'presupuesto'|'casos'|'simulador'|'checklist'|'contrato';

interface JuegoConfig {
  tipo: JuegoTipo;
  titulo: string;
  instruccion: string;
}

const JUEGOS: Record<NivelId, JuegoConfig> = {
  1:  { tipo: 'quiz',        titulo: 'Quiz: Lo básico',            instruccion: 'Responde las preguntas' },
  2:  { tipo: 'calculadora', titulo: 'Calculadora Hormiga',         instruccion: '¿Cuánto gastas al año?' },
  3:  { tipo: 'distribuir',  titulo: 'El Timón 50/30/20',           instruccion: 'Distribuye las monedas' },
  4:  { tipo: 'quiz',        titulo: 'Quiz: Violencia económica',   instruccion: 'Identifica el abuso' },
  5:  { tipo: 'ordenar',     titulo: 'Organiza tu presupuesto',     instruccion: 'Arrastra los gastos' },
  6:  { tipo: 'ordenar',     titulo: 'Deudas: buenas vs malas',     instruccion: 'Clasifica cada deuda' },
  7:  { tipo: 'quiz',        titulo: 'Quiz: Crédito',               instruccion: 'Demuestra lo aprendido' },
  8:  { tipo: 'quiz',        titulo: 'Quiz: El SAT',                instruccion: 'Trámites sin miedo' },
  9:  { tipo: 'calculadora', titulo: 'Calculadora de inversión',    instruccion: 'Compara ahorro vs inversión' },
  10: { tipo: 'quiz',        titulo: 'Quiz: CETES y fondos',        instruccion: 'Demuestra lo aprendido' },
  11: { tipo: 'calculadora', titulo: 'Calculadora AFORE',           instruccion: '¿Cuánto tendrás al retiro?' },
  12: { tipo: 'quiz',        titulo: 'Quiz: Emprender',             instruccion: 'Formaliza tu negocio' },
  13: { tipo: 'quiz',        titulo: 'Quiz: Derechos laborales',    instruccion: 'Identifica la violación' },
  14: { tipo: 'quiz',        titulo: 'Quiz: Contrato de renta',     instruccion: 'Detecta las trampas' },
  15: { tipo: 'quiz',        titulo: 'Quiz: SAT',                   instruccion: 'RFC sin miedo' },
};


// ─── QUIZ DATA ────────────────────────────────────────
const QUIZ: Record<NivelId, {pregunta:string;opciones:string[];correcta:number}[]> = {
  1: [
    { pregunta: '¿Qué es el ingreso?', opciones: ['Lo que gastas', 'Lo que entra a tu bolsillo', 'Una deuda', 'Un banco'], correcta: 1 },
    { pregunta: '¿Cuál es el primer paso para controlar tu dinero?', opciones: ['Ahorrar todo', 'Gastar menos', 'Registrar tus gastos', 'Pedir prestado'], correcta: 2 },
    { pregunta: 'Si ganas $8,000 y gastas $9,000, ¿qué pasa?', opciones: ['Tienes libertad financiera', 'Estás en déficit — gastas más de lo que ganas', 'Todo está bien', 'Necesitas invertir'], correcta: 1 },
  ],
  2: [], 3: [],
  4: [
    { pregunta: '¿Cuál ES violencia económica?', opciones: ['Tu pareja te pide que trabajes', 'Alguien controla todo tu dinero y no te deja gastarlo', 'Tener deudas propias', 'No tener tarjeta de crédito'], correcta: 1 },
    { pregunta: '¿Tienes derecho a tener tu propia cuenta bancaria?', opciones: ['Solo si tu pareja lo permite', 'Solo si trabajas formalmente', 'Siempre, es tu derecho', 'Solo si eres soltera'], correcta: 2 },
    { pregunta: 'Tu jefe te paga menos que a tus compañeros hombres por el mismo trabajo. ¿Es violencia económica?', opciones: ['No, es decisión del jefe', 'Sí, es discriminación salarial por género', 'Depende del contrato', 'Solo si lo denuncia'], correcta: 1 },
  ],
  5: [], 6: [],
  7: [
    { pregunta: '¿Qué indica un CAT alto en un crédito?', opciones: ['Que el crédito es muy seguro', 'Que el costo real del crédito es alto', 'Que la tasa de interés es baja', 'Que es el mejor crédito'], correcta: 1 },
    { pregunta: '¿Qué porcentaje del límite de tu tarjeta es recomendable usar?', opciones: ['Todo el límite', 'Más del 80%', 'Máximo el 30%', 'No usarla nunca'], correcta: 2 },
    { pregunta: '¿Qué pasa si pagas tarde tu tarjeta de crédito?', opciones: ['Nada, el banco lo entiende', 'Se registra en tu historial crediticio negativamente', 'El banco te cancela la tarjeta inmediatamente', 'Solo pierdes puntos'], correcta: 1 },
  ],
  8: [
    { pregunta: '¿Qué significa RFC?', opciones: ['Registro Fiscal de Ciudadanos', 'Registro Federal de Contribuyentes', 'Red Federal de Crédito', 'Régimen Fiscal de Cobros'], correcta: 1 },
    { pregunta: '¿El RFC es gratuito?', opciones: ['No, cuesta $500', 'Sí, es completamente gratuito', 'Solo para empleados formales', 'Cuesta según tu ingreso'], correcta: 1 },
    { pregunta: '¿Para qué necesitas el RFC?', opciones: ['Solo para pagar impuestos', 'Para cobrar formalmente, abrir cuentas de inversión y hacer trámites', 'Solo si tienes negocio', 'Solo si ganas más de $10,000'], correcta: 1 },
  ],
  9: [], 10: [
    { pregunta: '¿Quién respalda los CETES?', opciones: ['Los bancos privados', 'El gobierno federal mexicano', 'Fondos internacionales', 'La Bolsa Mexicana de Valores'], correcta: 1 },
    { pregunta: '¿Desde cuánto puedes invertir en CETES?', opciones: ['$10,000', '$5,000', '$1,000', '$100'], correcta: 3 },
    { pregunta: '¿Dónde se compran los CETES directamente?', opciones: ['En cualquier banco', 'En cetesdirecto.com', 'En la Bolsa de Valores', 'Solo con un asesor financiero'], correcta: 1 },
  ],
  11: [],
  12: [
    { pregunta: '¿Qué es el RESICO?', opciones: ['Un banco del gobierno', 'Un régimen fiscal simplificado para pequeños negocios', 'Un tipo de AFORE', 'Una cuenta de ahorro'], correcta: 1 },
    { pregunta: '¿Hasta cuánto de ingreso anual aplica el RESICO?', opciones: ['$500,000', '$1,000,000', '$3,500,000', '$10,000,000'], correcta: 2 },
    { pregunta: '¿Qué ventaja tiene facturar formalmente?', opciones: ['Pagas más impuestos', 'Puedes cobrar a empresas y acceder a créditos', 'Solo es necesario para grandes negocios', 'No tiene ventajas'], correcta: 1 },
  ],
  13: [
    { pregunta: '¿Cuántos días de vacaciones tienes el primer año según la LFT?', opciones: ['3 días', '6 días', '10 días', '15 días'], correcta: 1 },
    { pregunta: '¿Te pueden despedir por estar embarazada?', opciones: ['Sí, si afecta el trabajo', 'Solo en el primer trimestre', 'No, está prohibido por ley', 'Depende del contrato'], correcta: 2 },
    { pregunta: '¿Cuándo deben darte el aguinaldo?', opciones: ['Cuando el jefe quiera', 'Antes del 20 de diciembre', 'En enero del siguiente año', 'Solo si cumpliste un año'], correcta: 1 },
  ],
  14: [
    { pregunta: '¿Cuánto es el máximo de depósito que puede pedir un arrendador?', opciones: ['1 mes de renta', '2 meses de renta', '3 meses de renta', 'Lo que quiera'], correcta: 1 },
    { pregunta: '¿Con cuánto tiempo de aviso puede el arrendador subir la renta?', opciones: ['Sin aviso, cuando quiera', '15 días de aviso', '30 días de aviso', '60 días de aviso'], correcta: 2 },
    { pregunta: '¿Cuál de estas cláusulas es un abuso del arrendador?', opciones: ['Pagar renta mensual', 'El arrendador puede entrar sin avisar cuando quiera', 'Dar aviso de 30 días al terminar', 'Pagar servicios que uses'], correcta: 1 },
  ],
  15: [
    { pregunta: '¿Cuánto tiempo tiene vigencia la e.firma?', opciones: ['1 año', '2 años', '4 años', '10 años'], correcta: 2 },
    { pregunta: '¿Qué es el Buzón Tributario?', opciones: ['Un banco del SAT', 'Tu buzón oficial de comunicación con el SAT', 'Una cuenta de ahorro fiscal', 'Un tipo de RFC'], correcta: 1 },
    { pregunta: '¿La e.firma es gratuita?', opciones: ['No, cuesta $300', 'No, cuesta $1,000', 'Sí, es completamente gratuita', 'Solo para empresas'], correcta: 2 },
  ],
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
  const [nivelesDesbloqueados, setDesbloqueados] = useState<Set<NivelId>>(new Set([1 as NivelId]));
  const [nivelesCompletados, setCompletados]     = useState<Set<NivelId>>(new Set());
  const [mostrarBienvenida, setMostrarBienvenida] = useState(true);
  const [showTutorial, setShowTutorial]           = useState(false);
  const [showEmergency, setShowEmergency]         = useState(false);
  const [showIntroVE, setShowIntroVE]             = useState(false);

  const TUTORIAL_PASOS: PasoTutorial[] = [
    { id: 'intro',   mensaje: '¡Bienvenida a TomyAcademia! 🎓 Aquí aprenderás finanzas personales desde lo básico hasta lo avanzado, jugando. ¡El conocimiento es poder!', mood: 'happy',   posicion: 'center' },
    { id: 'niveles', mensaje: 'Los niveles se desbloquean conforme avanzas. Empieza por el primero — cada uno tiene una parte de teoría y un juego interactivo para practicar lo que aprendiste.', mood: 'neutral', posicion: 'bottom' },
    { id: 'flores',  mensaje: 'Al completar cada nivel ganas 🌸 flores de cempasúchil que se suman a tu perfil. ¡Cuantas más flores tengas, más aprendiste!', mood: 'happy',   posicion: 'bottom' },
    { id: 'juegos',  mensaje: 'Hay 3 tipos de juegos: Quiz de preguntas, Calculadora para ver cuánto gastas en pequeños gustos al año, y el Juego del 50/30/20 para distribuir tu dinero. ¡Son divertidos! 🎮', mood: 'happy', posicion: 'center' },
  ];

  // Cargar progreso guardado
  useEffect(() => {
    const load = async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.desbloqueados) setDesbloqueados(new Set(data.desbloqueados));
        if (data.completados)   setCompletados(new Set(data.completados));
      }
      // Mostrar intro VE la primera vez
      const veVisto = await AsyncStorage.getItem(VE_INTRO_KEY);
      if (!veVisto) setShowIntroVE(true);
    };
    load();
  }, []);

  const guardarProgreso = async (desbloq: Set<NivelId>, complet: Set<NivelId>) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      desbloqueados: [...desbloq],
      completados:   [...complet],
    }));
  };

  const completarNivel = (nivel: Nivel) => {
    const newComplet = new Set([...nivelesCompletados, nivel.id]);
    const siguienteId = nivel.id + 1;
    const newDesblq  = siguienteId <= 15
      ? new Set([...nivelesDesbloqueados, siguienteId as NivelId])
      : new Set([...nivelesDesbloqueados]);
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

          <TouchableOpacity style={s.bienvenidaBtn} onPress={() => { setMostrarBienvenida(false); setVista('mapa'); }}>
            <Text style={s.bienvenidaBtnTxt}>¡Empezar a aprender! 🚀</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── MAPA DE NIVELES ──────────────────────────────────
  if (vista === 'mapa') {
    return (
      <View style={[s.container, { paddingTop: ins.top }]}>
        {/* Header */}
        <View style={[s.header, { backgroundColor: '#FFF0F4', borderBottomColor: '#FFCAD4' }]}>
          <View>
            <Text style={[s.headerTitulo, { color: '#E91E8C' }]}>TomyAcademia 🎓</Text>
            <Text style={s.headerSub}>15 lecciones · aprende a tu ritmo</Text>
          </View>
          <BotonAyuda onPress={() => setShowTutorial(true)} color="#F3C57C" />
          <TouchableOpacity
            style={s.emergBtnAcad}
            onPress={() => setShowEmergency(true)}
          >
            <Ionicons name="shield-half-outline" size={18} color="#F4ACB7" />
          </TouchableOpacity>
          <View style={s.floresBadge}>
            <Text style={s.floresBadgeTxt}>🌸 {[...nivelesCompletados].reduce((a, id) => {
              const n = NIVELES.find(n => n.id === id);
              return a + (n?.flores || 0);
            }, 0)}</Text>
          </View>
        </View>

        {/* Intro Violencia Económica */}
        <Modal visible={showIntroVE} transparent animationType="fade" onRequestClose={() => setShowIntroVE(false)}>
          <View style={s.veOverlay}>
            <View style={s.veCard}>
              <View style={s.veHandle} />
              <TomasaSVG size={80} floating mood="worried" />
              <Text style={s.veTitulo}>Bienvenida a TomyAcademia 🌸</Text>
              <Text style={s.veTexto}>
                Aquí aprenderás sobre finanzas personales, tus derechos y más. Pero primero, algo importante:
              </Text>
              <View style={s.veAlertCard}>
                <Text style={s.veAlertTitulo}>¿Sabes qué es la violencia económica? 💜</Text>
                <Text style={s.veTexto}>
                  Es cuando alguien <Text style={{ fontWeight: '800' }}>controla tu dinero</Text>, te impide trabajar, o pone deudas a tu nombre sin permiso. No es normal y <Text style={{ fontWeight: '800' }}>no es tu culpa</Text>.
                </Text>
                <Text style={s.veTexto}>
                  Si estás viviendo algo así, toca el botón de abajo — hay ayuda gratuita disponible las 24 horas.
                </Text>
              </View>
              <View style={s.veBotones}>
                <TouchableOpacity
                  style={s.veBotonEmerg}
                  onPress={async () => {
                    await AsyncStorage.setItem(VE_INTRO_KEY, 'true');
                    setShowIntroVE(false);
                    setShowEmergency(true);
                  }}
                >
                  <Ionicons name="shield-half-outline" size={16} color="#F4ACB7" />
                  <Text style={s.veBotonEmergTxt}>Necesito ayuda ahora</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.veBotonCont}
                  onPress={async () => {
                    await AsyncStorage.setItem(VE_INTRO_KEY, 'true');
                    setShowIntroVE(false);
                  }}
                >
                  <Text style={s.veBotonContTxt}>Entendido, ¡a aprender! 🎓</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Emergency Modal */}
        <EmergencyModal visible={showEmergency} onClose={() => setShowEmergency(false)} />

        <TutorialOverlay
          visible={showTutorial}
          pasos={TUTORIAL_PASOS}
          onClose={() => setShowTutorial(false)}
          color="#F3C57C"
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {SECCIONES.map(seccion => {
            const nivelesSeccion = NIVELES.filter(n => n.seccion === seccion.id);
            const seccionDesbloqueada = seccion.id === 1 ||
              nivelesSeccion.some(n => nivelesDesbloqueados.has(n.id));
            return (
              <View key={seccion.id} style={[s.seccionWrap, { borderColor: seccion.color + '40' }]}>
                {/* Header sección con fondo de color */}
                <View style={[s.seccionHeader2, { backgroundColor: seccion.bg }]}>
                  <View style={[s.seccionDot, { backgroundColor: seccionDesbloqueada ? seccion.color : '#ddd' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.seccionTitulo, { color: seccionDesbloqueada ? seccion.color : '#ccc' }]}>
                      {seccion.label}
                    </Text>
                    <Text style={[s.seccionSub, { color: seccionDesbloqueada ? seccion.color + 'AA' : '#ccc' }]}>
                      {seccion.sub} · {nivelesSeccion.filter(n => nivelesCompletados.has(n.id)).length}/{nivelesSeccion.length} completados
                    </Text>
                  </View>
                  {!seccionDesbloqueada && <Ionicons name="lock-closed" size={16} color="#ccc" />}
                </View>

                {/* Grid de niveles 2 columnas */}
                <View style={s.nivelesGrid}>
                  {nivelesSeccion.map(nivel => {
                    const desbloqueado = nivelesDesbloqueados.has(nivel.id);
                    const completado   = nivelesCompletados.has(nivel.id);
                    return (
                      <TouchableOpacity
                        key={nivel.id}
                        style={[
                          s.nivelCard,
                          desbloqueado && { borderColor: nivel.colorAccent + '60', backgroundColor: nivel.colorAccent + '08' },
                          completado   && { backgroundColor: nivel.colorAccent + '15', borderColor: nivel.colorAccent },
                          !desbloqueado && s.nivelCardBloq,
                        ]}
                        onPress={() => desbloqueado && iniciarNivel(nivel)}
                        disabled={!desbloqueado}
                        activeOpacity={0.7}
                      >
                        {/* Emoji + lock */}
                        <View style={s.nivelCardTop}>
                          {completado ? (
                            <View style={[s.nivelEmojiCircle, { backgroundColor: nivel.colorAccent + '20' }]}>
                              <Ionicons name="checkmark-circle" size={28} color={nivel.colorAccent} />
                            </View>
                          ) : desbloqueado ? (
                            <View style={[s.nivelEmojiCircle, { backgroundColor: nivel.colorAccent + '15' }]}>
                              <Text style={{ fontSize: 24 }}>{nivel.emoji}</Text>
                            </View>
                          ) : (
                            <View style={[s.nivelEmojiCircle, { backgroundColor: '#F0F0F0' }]}>
                              <Ionicons name="lock-closed" size={20} color="#ccc" />
                            </View>
                          )}
                          {desbloqueado && !completado && (
                            <View style={[s.floresNivel, { backgroundColor: nivel.colorAccent }]}>
                              <Text style={s.floresNivelTxt}>+{nivel.flores}🌸</Text>
                            </View>
                          )}
                          {completado && (
                            <View style={[s.floresNivel, { backgroundColor: '#85A89E' }]}>
                              <Text style={s.floresNivelTxt}>✓ Hecho</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[s.nivelCardNum, !desbloqueado && { color: '#ddd' }]}>
                          Nivel {nivel.id}
                        </Text>
                        <Text style={[s.nivelCardTitulo, !desbloqueado && { color: '#ccc' }]}>
                          {nivel.titulo}
                        </Text>
                        <Text style={[s.nivelCardSub, !desbloqueado && { color: '#ddd' }]}>
                          {nivel.subtitulo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
            backgroundColor: SECCIONES.find(sec => sec.id === nivelActual.seccion)?.color || '#E91E8C',
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
            style={[s.navNext, { backgroundColor: SECCIONES.find(sec => sec.id === nivelActual.seccion)?.color || '#E91E8C' }]}
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
  if (juego.tipo === 'quiz')        return <JuegoQuiz nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'red')         return <JuegoRed nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'distribuir')  return <JuegoDistribuir nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'calculadora') return <JuegoCalculadora nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'presupuesto') return <JuegoPresupuesto nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'ordenar')     return <JuegoOrdenar nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'simulador')   return <JuegoSimulador nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'checklist')   return <JuegoChecklist nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'casos')       return <JuegoCasos nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  if (juego.tipo === 'contrato')    return <JuegoContrato nivel={nivel} onBack={onBack} onComplete={onComplete} ins={ins} />;
  return (
    <View style={[s.container, { paddingTop: ins.top, alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={{ fontSize: 48 }}>{nivel.emoji}</Text>
      <Text style={[s.headerTitulo, { textAlign: 'center', marginVertical: 16 }]}>{juego.titulo}</Text>
      <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
        <Text style={s.completadoBtnTxt}>Completar lección 🌸</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── JUEGO 1: LA RED DE TOMY ────────────────────────
const NET_W    = 90;
const ITEM_SIZE = 36;
const GAME_H   = SH * 0.52;

function JuegoRed({ nivel, onBack, onComplete, ins }: any) {
  const [netX, setNetX]       = useState(SW / 2 - NET_W / 2);
  const [score, setScore]     = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [items, setItems]     = useState<{id:number;x:number;y:number;type:'good'|'bad';speed:number;emoji:string}[]>([]);
  const [showInst, setShowInst] = useState(true);
  const itemIdRef   = useRef(0);
  const rafRef      = useRef<number>(0);
  const gameOverRef = useRef(false);
  const netXRef     = useRef(SW / 2 - NET_W / 2);

  // Sync netX to ref para el game loop
  useEffect(() => { netXRef.current = netX; }, [netX]);

  // Ocultar instrucción después de 3s
  useEffect(() => {
    const t = setTimeout(() => setShowInst(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { gameOverRef.current = true; setGameOver(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver]);

  // Spawn items cada 900ms
  useEffect(() => {
    if (gameOver) return;
    const goodEmojis = ['💼','💰','🪙','💵','🏦'];
    const badEmojis  = ['🛍️','💄','🍕','👟'];
    const spawn = setInterval(() => {
      const isGood = Math.random() > 0.3;
      setItems(p => [...p, {
        id: itemIdRef.current++,
        x: Math.random() * (SW - ITEM_SIZE - 40) + 20,
        y: -ITEM_SIZE,
        type: isGood ? 'good' : 'bad',
        speed: 3 + Math.random() * 2,
        emoji: isGood
          ? goodEmojis[Math.floor(Math.random() * goodEmojis.length)]
          : badEmojis[Math.floor(Math.random() * badEmojis.length)],
      }]);
    }, 900);
    return () => clearInterval(spawn);
  }, [gameOver]);

  // Game loop
  useEffect(() => {
    let lastTime = 0;
    const loop = (timestamp: number) => {
      if (gameOverRef.current) return;
      if (timestamp - lastTime > 16) {
        lastTime = timestamp;
        setItems(prev => {
          const kept: typeof prev = [];
          let goodCaught = 0, badCaught = 0;
          // La red está a bottom:16, y tiene 36px de alto
          // La colisión solo ocurre en esa zona precisa
          const netBottom = GAME_H - 16;
          const netTop    = netBottom - 40; // zona de colisión de 40px
          const curNetX   = netXRef.current;
          for (const item of prev) {
            const ny = item.y + item.speed;
            const itemCenterY = ny + ITEM_SIZE / 2;
            const itemCenterX = item.x + ITEM_SIZE / 2;
            // Solo detectar colisión si el item está dentro de la zona de la red
            const enZonaY = itemCenterY >= netTop && itemCenterY <= netBottom;
            const enZonaX = itemCenterX >= curNetX + 8 && itemCenterX <= curNetX + NET_W - 8;
            if (enZonaY && enZonaX) {
              item.type === 'good' ? goodCaught++ : badCaught++;
              continue;
            }
            if (ny < GAME_H + 20) kept.push({ ...item, y: ny });
          }
          if (goodCaught > 0) setScore(s => s + goodCaught);
          if (badCaught > 0)  setScore(s => Math.max(0, s - badCaught));
          return kept;
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gameOver]);

  // PanResponder para mover la red
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderMove: (_, gs) => {
        const nx = gs.moveX - NET_W / 2;
        const clamped = Math.max(0, Math.min(nx, SW - NET_W));
        setNetX(clamped);
        netXRef.current = clamped;
      },
    })
  ).current;

  if (gameOver) {
    return (
      <View style={[s.container, s.centrado, { paddingTop: ins.top }]}>
        <Text style={{ fontSize: 60 }}>⏰</Text>
        <Text style={s.completadoTitulo}>¡Tiempo!</Text>
        <Text style={s.completadoSub}>Recogiste {score} conceptos valiosos</Text>
        <View style={[s.completadoFlores, { marginVertical: 20 }]}>
          <Text style={s.completadoFloresEmoji}>🌸</Text>
          <Text style={s.completadoFloresTxt}>+{Math.max(1, score)} flores</Text>
        </View>
        <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
          <Text style={s.completadoBtnTxt}>¡Lo tengo, Tomy! 🌸</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      {/* HUD */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#9D8189" />
        </TouchableOpacity>
        <View style={s.hudRow}>
          <View style={s.hudPill}>
            <Text style={s.hudTxt}>⏳ {timeLeft}s</Text>
          </View>
          <View style={[s.hudPill, { backgroundColor: '#D8F5EE' }]}>
            <Text style={[s.hudTxt, { color: '#2D7A5E' }]}>Score: {score}</Text>
          </View>
        </View>
      </View>

      {/* Área de juego */}
      <View
        style={[s.gameArea, { height: GAME_H }]}
        {...panResponder.panHandlers}
      >
        {/* Instrucción */}
        {showInst && (
          <View style={s.instruccionBanner}>
            <Text style={s.instruccionTxt}>¡Mueve la red y atrapa el dinero! Evita las compras 🛍️</Text>
          </View>
        )}

        {/* Items cayendo */}
        {items.map(item => (
          <View
            key={item.id}
            style={[s.fallingItem, {
              left: item.x,
              top: item.y,
              backgroundColor: item.type === 'good' ? '#D8F5EE' : '#FFF0F0',
            }]}
          >
            <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
          </View>
        ))}

        {/* Red de Tomy */}
        <View style={[s.netContainer, { left: netX, bottom: 16 }]}>
          {/* Net visual */}
          <View style={s.netVisual} />
          {/* Tomy */}
          <View style={s.tomitaFace}>
            <View style={s.tomitaEyes}>
              <View style={s.tomitaEye} />
              <View style={s.tomitaEye} />
            </View>
            <View style={s.tomitaMouth} />
            {[[-10,6,-20],[-10,14,15],[null,6,20],[null,14,-15]].map(([left,top,rot], i) => (
              <View key={i} style={[s.gill,
                left !== null ? { left, top, transform:[{rotate:`${rot}deg`}] } : { right: -10, top, transform:[{rotate:`${rot}deg`}] }
              ]} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── JUEGO 2: CALCULADORA HORMIGA ────────────────────
function JuegoCalculadora({ nivel, onBack, onComplete, ins }: any) {
  const ITEMS_DATA = [
    { key: 'cafe',    emoji: '☕', label: 'Café Diario',     default: 45  },
    { key: 'tacos',   emoji: '🌮', label: 'Tacos de Antojo', default: 80  },
    { key: 'otros',   emoji: '🛒', label: 'Botanas / Otros', default: 30  },
  ];
  const [selected, setSelected] = useState(ITEMS_DATA[0]);
  const [expense, setExpense]   = useState(45);
  const [displayVal, setDisplayVal] = useState(0);

  const annual  = expense * 365;
  const monthly = expense * 30;

  // Animar contador al cambiar expense
  useEffect(() => {
    let start = displayVal;
    const target = annual;
    const steps = 40;
    const increment = (target - start) / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      start += increment;
      setDisplayVal(Math.round(start));
      if (step >= steps) { setDisplayVal(target); clearInterval(t); }
    }, 30);
    return () => clearInterval(t);
  }, [annual]);

  const OPCIONES = [10, 20, 30, 45, 60, 80, 100, 150, 200];

  return (
    <View style={[s.container, { paddingTop: ins.top, backgroundColor: '#D8E2DC' }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#9D8189" />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitulo}>El Efecto Nieve ❄️</Text>
          <Text style={s.headerSub}>¿Cuánto cuesta un gustito al año?</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: 'center' }}>

        {/* Selector de item */}
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          {ITEMS_DATA.map(item => {
            const isSelected = selected.key === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[s.itemSelectorBtn, isSelected && s.itemSelectorBtnActive]}
                onPress={() => { setSelected(item); setExpense(item.default); }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 28, marginBottom: 4 }}>{item.emoji}</Text>
                <Text style={[s.itemSelectorTxt, isSelected && { color: '#fff' }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slider card */}
        <View style={s.sliderCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={s.sliderLabel}>Gasto Diario</Text>
            <Text style={s.sliderValor}>${expense} <Text style={{ fontSize: 12, fontWeight: '500', color: '#9D8189' }}>MXN</Text></Text>
          </View>
          {/* Opciones de precio como botones */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {OPCIONES.map(v => (
              <TouchableOpacity
                key={v}
                style={[s.precioBtn, expense === v && s.precioBtnActive]}
                onPress={() => setExpense(v)}
              >
                <Text style={[s.precioBtnTxt, expense === v && { color: '#fff', fontWeight: '800' }]}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resultado animado */}
        <View style={s.resultadoCard}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>{selected.emoji}</Text>
          <Text style={s.resultadoLabel}>Al mes gastas</Text>
          <Text style={s.resultadoMonto}>${monthly.toLocaleString('es-MX')}</Text>
          <View style={s.resultadoDivider} />
          <Text style={s.resultadoLabel}>Al año son</Text>
          <Text style={[s.resultadoMonto, { fontSize: 44, color: '#D64545' }]}>
            ${displayVal.toLocaleString('es-MX')}
          </Text>
          <View style={[s.wowBadge]}>
            <Text style={s.wowTxt}>¡Wow! 😱</Text>
          </View>
          <Text style={{ fontSize: 13, color: '#9D8189', textAlign: 'center', marginTop: 12, lineHeight: 19, opacity: 0.8 }}>
            No se trata de no disfrutar — se trata de ser consciente 💡
          </Text>
        </View>

        <TouchableOpacity style={[s.completadoBtn, { width: '100%' }]} onPress={onComplete}>
          <Text style={s.completadoBtnTxt}>¡Lo tengo, Tomy! 🌸</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ─── JUEGO 3: EL TIMÓN 50/30/20 ─────────────────────
const COIN_COUNT  = 10;
const FRASCOS_DEF = [
  { id: 'needs',   title: 'Necesidades', pct: 50, expected: 5, color: '#F4ACB7' },
  { id: 'wants',   title: 'Gustos',      pct: 30, expected: 3, color: '#FFE5D9' },
  { id: 'savings', title: 'Ahorro',      pct: 20, expected: 2, color: '#D8E2DC' },
];

function JuegoDistribuir({ nivel, onBack, onComplete, ins }: any) {
  const [step, setStep]     = useState<'theory'|'practice'|'success'>('theory');
  const [jars, setJars]     = useState(FRASCOS_DEF.map(j => ({ ...j, current: 0 })));
  const [unassigned, setUnassigned] = useState(COIN_COUNT);
  const fillAnims = useRef(FRASCOS_DEF.map(() => new Animated.Value(0))).current;

  const addCoin = (id: string) => {
    if (unassigned === 0) return;
    const jarIdx = jars.findIndex(j => j.id === id);
    const jar = jars[jarIdx];
    if (!jar) return;
    const newCurrent = jar.current + 1;
    const newJars = jars.map(j => j.id === id ? { ...j, current: newCurrent } : j);
    setJars(newJars);
    setUnassigned(n => n - 1);
    Animated.spring(fillAnims[jarIdx], {
      toValue: newCurrent / jar.expected,
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const removeCoin = (id: string) => {
    const jarIdx = jars.findIndex(j => j.id === id);
    const jar = jars[jarIdx];
    if (!jar || jar.current === 0) return;
    const newCurrent = jar.current - 1;
    const newJars = jars.map(j => j.id === id ? { ...j, current: newCurrent } : j);
    setJars(newJars);
    setUnassigned(n => n + 1);
    Animated.spring(fillAnims[jarIdx], {
      toValue: newCurrent / jar.expected,
      friction: 6,
      useNativeDriver: false,
    }).start();
  };

  const reset = () => {
    setJars(FRASCOS_DEF.map(j => ({ ...j, current: 0 })));
    setUnassigned(COIN_COUNT);
    fillAnims.forEach(a => Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: false }).start());
  };

  const [errorTimon, setErrorTimon] = useState(false);

  const verificar = () => {
    const ok = jars.every(j => j.current === j.expected);
    if (ok) {
      setErrorTimon(false);
      setStep('success');
    } else {
      setErrorTimon(true);
      setTimeout(() => setErrorTimon(false), 2500);
    }
  };

  if (step === 'theory') {
    return (
      <View style={[s.container, { paddingTop: ins.top, backgroundColor: '#D8E2DC' }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
          <Text style={s.headerTitulo}>El Timón ⚖️</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[s.centrado, { padding: 24 }]}>
          <View style={s.timonCard}>
            <View style={{ transform: [{ rotate: '-12deg' }], alignItems: 'center' }}>
              <Text style={s.timonNumeros}>50</Text>
              <Text style={s.timonNumeros}>30</Text>
              <Text style={s.timonNumeros}>20</Text>
            </View>
          </View>
          <View style={s.timonInfoCard}>
            <Text style={[s.headerTitulo, { marginBottom: 16 }]}>Regla 50-30-20</Text>
            {[
              { n: '50', label: 'Necesidades', sub: 'Renta, comida, transporte', color: '#F4ACB7' },
              { n: '30', label: 'Gustos',      sub: 'Salidas, hobbies, ropa',    color: '#F3C57C' },
              { n: '20', label: 'Ahorro',      sub: 'Futuro, emergencias',        color: '#85A89E' },
            ].map(item => (
              <View key={item.n} style={s.timonRuleRow}>
                <View style={[s.timonNumBadge, { backgroundColor: item.color + '30' }]}>
                  <Text style={[s.timonNumBadgeTxt, { color: item.color }]}>{item.n}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.timonRuleLabel}>{item.label}</Text>
                  <Text style={s.timonRuleSub}>{item.sub}</Text>
                </View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={[s.completadoBtn, { width: '100%' }]} onPress={() => setStep('practice')}>
            <Text style={s.completadoBtnTxt}>¡A practicar! 🪙</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'success') {
    return (
      <View style={[s.container, s.centrado, { paddingTop: ins.top, backgroundColor: '#D8E2DC' }]}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={s.completadoTitulo}>¡Excelente, Ajolota!</Text>
        <Text style={[s.completadoSub, { marginHorizontal: 32 }]}>Has distribuido tu quincena como toda una experta.</Text>
        <View style={[s.completadoFlores, { marginVertical: 20 }]}>
          <Text style={s.completadoFloresEmoji}>🌸</Text>
          <Text style={s.completadoFloresTxt}>+{nivel.flores} flores</Text>
        </View>
        <TouchableOpacity style={s.completadoBtn} onPress={onComplete}>
          <Text style={s.completadoBtnTxt}>¡Lo tengo, Tomy! 🌸</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.headerTitulo}>Reparte la Quincena</Text>
          <Text style={s.headerSub}>Monedas sin asignar: {unassigned} · Cada moneda = 10%</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={s.frascosFila}>
        {jars.map((jar, idx) => {
          const fillHeight = fillAnims[idx].interpolate({ inputRange:[0,1], outputRange:['0%','100%'] });
          const isCorrect = jar.current === jar.expected;
          return (
            <View key={jar.id} style={s.frascoWrap}>
              {/* Frasco */}
              <View style={[s.frascoVasoNew, { borderColor: jar.color }]}>
                <Animated.View style={[s.frascoRellenoNew, { height: fillHeight, backgroundColor: jar.color + 'CC' }]} />
                <View style={s.frascoMonedaCount}>
                  <Text style={s.frascoMonedaCountTxt}>{jar.current}</Text>
                </View>
                {isCorrect && jar.current > 0 && (
                  <View style={s.frascoCheck}>
                    <Ionicons name="checkmark-circle" size={20} color="#2D7A5E" />
                  </View>
                )}
              </View>
              {/* Label */}
              <Text style={[s.frascoLabelNew, { color: jar.color }]}>{jar.pct}%</Text>
              <Text style={s.frascoTitleNew}>{jar.title}</Text>
              {/* Botones */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                <TouchableOpacity
                  style={[s.frascoBtnNew, { backgroundColor: jar.color }, unassigned === 0 && { opacity: 0.4 }]}
                  onPress={() => addCoin(jar.id)} disabled={unassigned === 0}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.frascoBtnNew, { backgroundColor: '#F0E0E5' }, jar.current === 0 && { opacity: 0.4 }]}
                  onPress={() => removeCoin(jar.id)} disabled={jar.current === 0}
                >
                  <Ionicons name="remove" size={18} color="#9D8189" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Monedas visuales */}
      <View style={s.monedaPile}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {Array.from({ length: unassigned }).map((_, i) => (
            <View key={i} style={s.moneda}>
              <Text style={{ fontSize: 18 }}>🪙</Text>
            </View>
          ))}
          {unassigned === 0 && (
            <Text style={{ color: '#9D818970', fontWeight: '600', fontSize: 13 }}>¡Todas asignadas!</Text>
          )}
        </View>
      </View>

      {/* Feedback error */}
      {errorTimon && (
        <View style={s.timonError}>
          <Text style={s.timonErrorTxt}>
            ¡Casi! Recuerda: 5 monedas para Necesidades, 3 para Gustos y 2 para Ahorro 💪
          </Text>
        </View>
      )}

      {/* Botones acción */}
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        <TouchableOpacity style={[s.btnAccion, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F0E0E5' }]} onPress={reset}>
          <Ionicons name="refresh" size={16} color="#9D8189" />
          <Text style={[s.btnAccionTxt, { color: '#9D8189' }]}>Reiniciar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btnAccion, { backgroundColor: '#F4ACB7' }, unassigned > 0 && { opacity: 0.4 }]}
          onPress={verificar} disabled={unassigned > 0}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={[s.btnAccionTxt, { color: '#fff' }]}>Comprobar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// ─── JUEGO: PRESUPUESTO (Nivel 5) ────────────────────
function JuegoPresupuesto({ nivel, onBack, onComplete, ins }: any) {
  const GASTOS = [
    { id:'renta',  texto:'Pago de renta $4,500',    categoria:'necesidad', emoji:'🏠' },
    { id:'netflix',texto:'Netflix $219',             categoria:'gusto',     emoji:'📺' },
    { id:'luz',    texto:'Recibo de luz $380',       categoria:'necesidad', emoji:'⚡' },
    { id:'cafe',   texto:'Cafés de la semana $300',  categoria:'gusto',     emoji:'☕' },
    { id:'ahorro', texto:'Ahorro del mes $1,000',    categoria:'futuro',    emoji:'🐷' },
    { id:'comida', texto:'Despensa $2,800',          categoria:'necesidad', emoji:'🛒' },
    { id:'salida', texto:'Salida con amigas $500',   categoria:'gusto',     emoji:'🌮' },
    { id:'cetes',  texto:'Inversión en CETES $500',  categoria:'futuro',    emoji:'📈' },
  ];
  const [asignados, setAsignados] = useState<Record<string,string>>({});
  const [checked, setChecked]     = useState(false);
  const [score, setScore]         = useState(0);

  const asignar = (gastoId: string, cat: string) => {
    if (checked) return;
    setAsignados(p => ({ ...p, [gastoId]: cat }));
  };

  const verificar = () => {
    let correctos = 0;
    GASTOS.forEach(g => { if (asignados[g.id] === g.categoria) correctos++; });
    setScore(correctos);
    setChecked(true);
  };

  const todos = Object.keys(asignados).length === GASTOS.length;
  const CATS = [
    { id:'necesidad', label:'🌸 Necesidades', color:'#F4ACB7' },
    { id:'gusto',     label:'🌞 Gustos',      color:'#F3C57C' },
    { id:'futuro',    label:'🛡️ Futuro',      color:'#85A89E' },
  ];

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitulo}>Arma tu presupuesto</Text>
          <Text style={s.headerSub}>Clasifica cada gasto en su categoría</Text>
        </View>
        <Text style={s.headerSub}>{Object.keys(asignados).length}/{GASTOS.length}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        {GASTOS.map(gasto => {
          const asig = asignados[gasto.id];
          const correcto = checked && asig === gasto.categoria;
          const incorrecto = checked && asig && asig !== gasto.categoria;
          return (
            <View key={gasto.id} style={[s.gastoCard, correcto && s.gastoCardOk, incorrecto && s.gastoCardMal]}>
              <Text style={{ fontSize: 20, marginRight: 8 }}>{gasto.emoji}</Text>
              <Text style={[s.gastoTxt, { flex: 1 }]}>{gasto.texto}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {CATS.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catBtn, asig === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => asignar(gasto.id, cat.id)}
                  >
                    <Text style={[s.catBtnTxt, asig === cat.id && { color: '#fff' }]}>
                      {cat.label.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {checked && (
                <Text style={{ fontSize: 11, color: correcto ? '#2D7A5E' : '#D64545', marginTop: 4, width: '100%' }}>
                  {correcto ? '✅ Correcto' : `❌ Era: ${CATS.find(c=>c.id===gasto.categoria)?.label}`}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        {!checked ? (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor: '#F4ACB7', flex: 1 }, !todos && { opacity: 0.4 }]} onPress={verificar} disabled={!todos}>
            <Text style={[s.btnAccionTxt, { color: '#fff' }]}>Verificar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor: '#F4ACB7', flex: 1 }]} onPress={onComplete}>
            <Text style={[s.btnAccionTxt, { color: '#fff' }]}>{score}/{GASTOS.length} correctos — ¡Continuar! 🌸</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── JUEGO: ORDENAR DEUDAS (Nivel 6) ─────────────────
function JuegoOrdenar({ nivel, onBack, onComplete, ins }: any) {
  const DEUDAS = [
    { id:'hipoteca', texto:'Hipoteca para comprar tu casa', tipo:'buena', razon:'Genera patrimonio duradero' },
    { id:'estudios', texto:'Crédito para terminar tu carrera', tipo:'buena', razon:'Invierte en tu capacidad de ganar' },
    { id:'lujo',     texto:'Tarjeta para ropa de diseñador', tipo:'mala', razon:'Gastas más de lo que vale por intereses' },
    { id:'negocio',  texto:'Préstamo para abrir tu negocio', tipo:'buena', razon:'Puede generar ingresos mayores al costo' },
    { id:'vacacion', texto:'Crédito para irte de vacaciones', tipo:'mala', razon:'Pagas experiencias pasadas con dinero futuro' },
    { id:'nomina',   texto:'Préstamo de nómina al 100% anual', tipo:'mala', razon:'Tasas altísimas que te atrapan' },
  ];
  const [respuestas, setRespuestas] = useState<Record<string,string>>({});
  const [checked, setChecked] = useState(false);

  const contestar = (id: string, tipo: string) => {
    if (checked) return;
    setRespuestas(p => ({ ...p, [id]: tipo }));
  };
  const correctos = DEUDAS.filter(d => respuestas[d.id] === d.tipo).length;
  const todos = Object.keys(respuestas).length === DEUDAS.length;

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <Text style={s.headerTitulo}>¿Buena o mala deuda?</Text>
        <Text style={s.headerSub}>{Object.keys(respuestas).length}/{DEUDAS.length}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
        {DEUDAS.map(deuda => {
          const resp = respuestas[deuda.id];
          const correcto = checked && resp === deuda.tipo;
          const mal = checked && resp && resp !== deuda.tipo;
          return (
            <View key={deuda.id} style={[s.gastoCard, correcto && s.gastoCardOk, mal && s.gastoCardMal]}>
              <Text style={[s.gastoTxt, { marginBottom: 10 }]}>{deuda.texto}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[s.deudaBtn, { borderColor: '#85A89E' }, resp==='buena' && { backgroundColor: '#85A89E' }]}
                  onPress={() => contestar(deuda.id, 'buena')}
                >
                  <Text style={[{ fontSize: 12, fontWeight: '700', color: '#85A89E' }, resp==='buena' && { color: '#fff' }]}>✅ Buena deuda</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.deudaBtn, { borderColor: '#F4ACB7' }, resp==='mala' && { backgroundColor: '#F4ACB7' }]}
                  onPress={() => contestar(deuda.id, 'mala')}
                >
                  <Text style={[{ fontSize: 12, fontWeight: '700', color: '#F4ACB7' }, resp==='mala' && { color: '#fff' }]}>❌ Mala deuda</Text>
                </TouchableOpacity>
              </View>
              {checked && (
                <Text style={{ fontSize: 11, color: correcto ? '#2D7A5E' : '#D64545', marginTop: 8, lineHeight: 16 }}>
                  {correcto ? `✅ Correcto: ${deuda.razon}` : `❌ Era ${deuda.tipo}: ${deuda.razon}`}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        {!checked ? (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor: '#F4ACB7', flex: 1 }, !todos && { opacity: 0.4 }]} onPress={() => setChecked(true)} disabled={!todos}>
            <Text style={[s.btnAccionTxt, { color: '#fff' }]}>Verificar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor: '#F4ACB7', flex: 1 }]} onPress={onComplete}>
            <Text style={[s.btnAccionTxt, { color: '#fff' }]}>{correctos}/{DEUDAS.length} correctas — ¡Continuar! 🌸</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── JUEGO: SIMULADOR (Niveles 7,9,10,11) ────────────
function JuegoSimulador({ nivel, onBack, onComplete, ins }: any) {
  const [monto, setMonto]   = useState(1000);
  const [anios, setAnios]   = useState(5);
  const [tasa, setTasa]     = useState(10);
  const resultado = Math.round(monto * Math.pow(1 + tasa / 100, anios));
  const ganancia  = resultado - monto;

  const MONTOS = [500, 1000, 2000, 5000, 10000];
  const ANIOS  = [1, 3, 5, 10, 20];
  const TASAS  = [5, 8, 10, 12, 15];

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitulo}>{nivel.id === 11 ? 'Tu retiro' : 'Calculadora de inversión'}</Text>
          <Text style={s.headerSub}>El poder del interés compuesto</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={s.simCard}>
          <Text style={s.simLabel}>💰 Inversión inicial</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8 }}>
            {MONTOS.map(m => (
              <TouchableOpacity key={m} style={[s.simBtn, monto===m && { backgroundColor:'#F4ACB7', borderColor:'#F4ACB7' }]} onPress={() => setMonto(m)}>
                <Text style={[s.simBtnTxt, monto===m && { color:'#fff' }]}>${m.toLocaleString('es-MX')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.simCard}>
          <Text style={s.simLabel}>📅 Años de inversión</Text>
          <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
            {ANIOS.map(a => (
              <TouchableOpacity key={a} style={[s.simBtn, anios===a && { backgroundColor:'#85A89E', borderColor:'#85A89E' }]} onPress={() => setAnios(a)}>
                <Text style={[s.simBtnTxt, anios===a && { color:'#fff' }]}>{a} {a===1?'año':'años'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.simCard}>
          <Text style={s.simLabel}>📈 Rendimiento anual</Text>
          <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
            {TASAS.map(t => (
              <TouchableOpacity key={t} style={[s.simBtn, tasa===t && { backgroundColor:'#2D9596', borderColor:'#2D9596' }]} onPress={() => setTasa(t)}>
                <Text style={[s.simBtnTxt, tasa===t && { color:'#fff' }]}>{t}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s.resultadoCard}>
          <Text style={s.resultadoLabel}>Invertiste</Text>
          <Text style={[s.resultadoMonto, { fontSize:24 }]}>${monto.toLocaleString('es-MX')}</Text>
          <View style={s.resultadoDivider} />
          <Text style={s.resultadoLabel}>Después de {anios} {anios===1?'año':'años'} tendrás</Text>
          <Text style={s.resultadoMonto}>${resultado.toLocaleString('es-MX')}</Text>
          <View style={[s.wowBadge, { backgroundColor: '#D8F5EE' }]}>
            <Text style={[s.wowTxt, { color:'#2D7A5E' }]}>+${ganancia.toLocaleString('es-MX')} de ganancia 🎉</Text>
          </View>
          <Text style={{ fontSize:12, color:'#9D8189', textAlign:'center', marginTop:8, opacity:0.8 }}>
            {tasa >= 10 ? '¡CETES y fondos pueden darte rendimientos similares!' : 'Más que en cualquier cuenta de ahorro bancaria'}
          </Text>
        </View>
        <TouchableOpacity style={[s.completadoBtn, { width:'100%' }]} onPress={onComplete}>
          <Text style={s.completadoBtnTxt}>¡Lo tengo, Tomy! 🌸</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── JUEGO: CHECKLIST NEGOCIO (Nivel 12) ─────────────
function JuegoChecklist({ nivel, onBack, onComplete, ins }: any) {
  const PASOS = [
    { id:'rfc',      texto:'Obtén tu RFC en sat.gob.mx',                     url:'sat.gob.mx',   emoji:'🧾' },
    { id:'resico',   texto:'Regístrate en el régimen RESICO',                 url:'sat.gob.mx',   emoji:'📋' },
    { id:'buzon',    texto:'Activa tu Buzón Tributario',                      url:'sat.gob.mx',   emoji:'📬' },
    { id:'efirma',   texto:'Obtén tu e.firma en el SAT',                      url:'sat.gob.mx',   emoji:'🔐' },
    { id:'cuenta',   texto:'Abre una cuenta bancaria para tu negocio',        url:'nu.com.mx',    emoji:'🏦' },
    { id:'factura',  texto:'Emite tu primera factura CFDI',                   url:'sat.gob.mx',   emoji:'🧾' },
  ];
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setMarcados(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const progreso = Math.round((marcados.size / PASOS.length) * 100);

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitulo}>Checklist de negocio</Text>
          <Text style={s.headerSub}>Pasos para formalizarte</Text>
        </View>
        <Text style={[s.headerSub, { color:'#F4ACB7', fontWeight:'800' }]}>{progreso}%</Text>
      </View>
      <View style={{ height:4, backgroundColor:'#FFF0F4', margin:0 }}>
        <View style={{ height:'100%', width:`${progreso}%` as any, backgroundColor:'#F4ACB7', borderRadius:2 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}>
        <View style={[s.gastoCard, { backgroundColor:'#FFF0F4', borderColor:'#FFCAD4' }]}>
          <Text style={{ fontSize:14, color:'#9D8189', lineHeight:20 }}>
            Marca los pasos que ya completaste. Puedes hacerlos en cualquier orden, pero este es el más lógico 💡
          </Text>
        </View>
        {PASOS.map(paso => (
          <TouchableOpacity
            key={paso.id}
            style={[s.gastoCard, marcados.has(paso.id) && { backgroundColor:'#D8F5EE', borderColor:'#85A89E' }]}
            onPress={() => toggle(paso.id)}
            activeOpacity={0.7}
          >
            <View style={[s.nivelEmojiCircle, { width:36, height:36, borderRadius:10, backgroundColor: marcados.has(paso.id) ? '#85A89E' : '#FFF0F4' }]}>
              {marcados.has(paso.id)
                ? <Ionicons name="checkmark" size={18} color="#fff" />
                : <Text style={{ fontSize:16 }}>{paso.emoji}</Text>
              }
            </View>
            <View style={{ flex:1 }}>
              <Text style={[s.gastoTxt, marcados.has(paso.id) && { textDecorationLine:'line-through', opacity:0.6 }]}>
                {paso.texto}
              </Text>
              <Text style={{ fontSize:11, color:'#9D818970' }}>{paso.url}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        <TouchableOpacity style={[s.btnAccion, { backgroundColor:'#F4ACB7', flex:1 }]} onPress={onComplete}>
          <Text style={[s.btnAccionTxt, { color:'#fff' }]}>
            {marcados.size === PASOS.length ? '¡Todo listo! 🚀' : `Continuar (${marcados.size}/${PASOS.length}) 🌸`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── JUEGO: CASOS REALES (Nivel 13) ──────────────────
function JuegoCasos({ nivel, onBack, onComplete, ins }: any) {
  const CASOS = [
    { id:'c1', texto:'Tu jefe te paga en efectivo y nunca te da recibo de nómina ni te inscribió al IMSS.', violacion:true, ley:'Artículo 132 LFT: Es obligatorio inscribir al IMSS y dar comprobante de pago.' },
    { id:'c2', texto:'Tu empresa te da 15 días de aguinaldo en diciembre.', violacion:false, ley:'El mínimo son 15 días de aguinaldo. Eso es correcto.' },
    { id:'c3', texto:'Te despidieron después de informar que estás embarazada.', violacion:true, ley:'Art. 170 LFT: Despedir por embarazo es ilegal — tienes derecho a reinstalación o indemnización.' },
    { id:'c4', texto:'Te piden hacer 2 horas extra al día y te pagan el doble por ellas.', violacion:false, ley:'Las horas extra se pagan al doble. Eso es correcto.' },
    { id:'c5', texto:'Tu contrato dice que no tienes derecho a vacaciones el primer año.', violacion:true, ley:'Art. 76 LFT: Desde el primer año tienes derecho a mínimo 12 días de vacaciones.' },
  ];
  const [respuestas, setRespuestas] = useState<Record<string,boolean>>({});
  const [checked, setChecked]       = useState(false);
  const contestar = (id: string, resp: boolean) => { if (!checked) setRespuestas(p => ({ ...p, [id]: resp })); };
  const correctos = CASOS.filter(c => respuestas[c.id] === c.violacion).length;
  const todos = Object.keys(respuestas).length === CASOS.length;

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerTitulo}>¿Hay violación laboral?</Text>
          <Text style={s.headerSub}>Lee cada caso y decide</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding:16, gap:12, paddingBottom:100 }}>
        {CASOS.map((caso, i) => {
          const resp = respuestas[caso.id];
          const correcto = checked && resp === caso.violacion;
          const mal = checked && resp !== undefined && resp !== caso.violacion;
          return (
            <View key={caso.id} style={[s.gastoCard, correcto && s.gastoCardOk, mal && s.gastoCardMal]}>
              <Text style={{ fontSize:12, color:'#9D818970', marginBottom:6 }}>Caso {i+1}</Text>
              <Text style={[s.gastoTxt, { marginBottom:12 }]}>{caso.texto}</Text>
              <View style={{ flexDirection:'row', gap:10 }}>
                <TouchableOpacity
                  style={[s.deudaBtn, { borderColor:'#D64545', flex:1 }, resp===true && { backgroundColor:'#D64545' }]}
                  onPress={() => contestar(caso.id, true)}
                >
                  <Text style={[{ fontSize:12, fontWeight:'700', color:'#D64545', textAlign:'center' }, resp===true && { color:'#fff' }]}>⚠️ Sí hay violación</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.deudaBtn, { borderColor:'#85A89E', flex:1 }, resp===false && { backgroundColor:'#85A89E' }]}
                  onPress={() => contestar(caso.id, false)}
                >
                  <Text style={[{ fontSize:12, fontWeight:'700', color:'#85A89E', textAlign:'center' }, resp===false && { color:'#fff' }]}>✅ Todo bien</Text>
                </TouchableOpacity>
              </View>
              {checked && (
                <Text style={{ fontSize:11, color: correcto ? '#2D7A5E' : '#D64545', marginTop:8, lineHeight:16 }}>
                  {correcto ? '✅ ' : '❌ '}{caso.ley}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        {!checked ? (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor:'#F4ACB7', flex:1 }, !todos && { opacity:0.4 }]} onPress={() => setChecked(true)} disabled={!todos}>
            <Text style={[s.btnAccionTxt, { color:'#fff' }]}>Ver respuestas</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor:'#F4ACB7', flex:1 }]} onPress={onComplete}>
            <Text style={[s.btnAccionTxt, { color:'#fff' }]}>{correctos}/{CASOS.length} correctas — ¡Continuar! 🌸</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── JUEGO: CONTRATO TRAMPA (Nivel 14) ───────────────
function JuegoContrato({ nivel, onBack, onComplete, ins }: any) {
  const CLAUSULAS = [
    { id:'c1', texto:'"La renta se puede aumentar en cualquier momento sin previo aviso."', trampa:true, explicacion:'ILEGAL: Solo puede aumentar una vez al año con 30 días de aviso.' },
    { id:'c2', texto:'"El contrato tiene una duración de 12 meses."', trampa:false, explicacion:'LEGAL: El mínimo por ley es 1 año.' },
    { id:'c3', texto:'"El depósito de garantía no se devuelve bajo ninguna circunstancia."', trampa:true, explicacion:'ILEGAL: El depósito se devuelve si no hay daños más allá del uso normal.' },
    { id:'c4', texto:'"El inquilino paga todas las reparaciones, incluyendo las estructurales."', trampa:true, explicacion:'ILEGAL: Las reparaciones estructurales son responsabilidad del arrendador.' },
    { id:'c5', texto:'"El arrendador puede ingresar al inmueble previo aviso de 24 horas."', trampa:false, explicacion:'RAZONABLE: El aviso de 24 horas es una práctica aceptable.' },
  ];
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const toggle = (id: string) => { if (!checked) setSeleccionadas(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const trampas = CLAUSULAS.filter(c => c.trampa).map(c => c.id);
  const correctas = trampas.filter(id => seleccionadas.has(id)).length;
  const falsasAlarmas = [...seleccionadas].filter(id => !trampas.includes(id)).length;

  return (
    <View style={[s.container, { paddingTop: ins.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack}><Ionicons name="chevron-back" size={24} color="#9D8189" /></TouchableOpacity>
        <View style={{ flex:1 }}>
          <Text style={s.headerTitulo}>Encuentra las trampas</Text>
          <Text style={s.headerSub}>Toca las cláusulas ilegales</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding:16, gap:12, paddingBottom:100 }}>
        <View style={[s.gastoCard, { backgroundColor:'#FFF0F4', borderColor:'#FFCAD4' }]}>
          <Text style={{ fontSize:14, color:'#9D8189', lineHeight:20 }}>
            Lee cada cláusula y toca las que crees que son ilegales o abusivas 👆
          </Text>
        </View>
        {CLAUSULAS.map(clausula => {
          const selec = seleccionadas.has(clausula.id);
          const correcto = checked && selec && clausula.trampa;
          const falsoPos = checked && selec && !clausula.trampa;
          const perdido = checked && !selec && clausula.trampa;
          return (
            <TouchableOpacity
              key={clausula.id}
              style={[s.gastoCard,
                selec && !checked && { borderColor:'#F4ACB7', backgroundColor:'#FFF0F4' },
                correcto && s.gastoCardMal,
                falsoPos && { borderColor:'#F3C57C', backgroundColor:'#FFFBF0' },
                perdido && { borderColor:'#D64545', backgroundColor:'#FFF5F5' },
              ]}
              onPress={() => toggle(clausula.id)}
              activeOpacity={0.7}
            >
              <Text style={[s.gastoTxt, { fontStyle:'italic' }]}>"{clausula.texto}"</Text>
              {selec && !checked && (
                <Text style={{ fontSize:11, color:'#F4ACB7', marginTop:4 }}>⚠️ Marcada como trampa</Text>
              )}
              {checked && (
                <Text style={{ fontSize:11, marginTop:6, lineHeight:16,
                  color: correcto ? '#D64545' : falsoPos ? '#854F0B' : perdido ? '#D64545' : '#2D7A5E'
                }}>
                  {correcto ? `🚩 TRAMPA: ${clausula.explicacion}` :
                   falsoPos ? `⚠️ Esta es legal: ${clausula.explicacion}` :
                   perdido  ? `❌ Esta SÍ era trampa: ${clausula.explicacion}` :
                   `✅ ${clausula.explicacion}`}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[s.botonesAccion, { paddingBottom: ins.bottom + 16 }]}>
        {!checked ? (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor:'#F4ACB7', flex:1 }]} onPress={() => setChecked(true)}>
            <Text style={[s.btnAccionTxt, { color:'#fff' }]}>Ver respuestas</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btnAccion, { backgroundColor:'#F4ACB7', flex:1 }]} onPress={onComplete}>
            <Text style={[s.btnAccionTxt, { color:'#fff' }]}>
              {correctas}/{trampas.length} trampas encontradas — ¡Continuar! 🌸
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── JUEGO: QUIZ ─────────────────────────────────────

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
  bienvenidaTitulo: { fontSize: 22, fontWeight: '800', color: '#E91E8C', textAlign: 'center' },
  bienvenidaTexto:  { fontSize: 14, color: '#9D8189', lineHeight: 22, textAlign: 'center' },
  bienvenidaComoRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  bienvenidaComo:   { alignItems: 'center', gap: 4 },
  bienvenidaComoEmoji:{ fontSize: 24 },
  bienvenidaComoTxt:  { fontSize: 11, fontWeight: '600', color: '#9D8189', textAlign: 'center' },
  floresCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF8F9', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#FFCAD4' },
  floresEmoji:  { fontSize: 32 },
  floresTitulo: { fontSize: 14, fontWeight: '800', color: '#9D8189', marginBottom: 4 },
  floresDesc:   { fontSize: 12, color: '#9D8189', opacity: 0.8, lineHeight: 18 },
  bienvenidaBtn: { backgroundColor: '#E91E8C', borderRadius: 20, paddingVertical: 18, paddingHorizontal: 40, elevation: 4, width: '100%' },
  bienvenidaBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, textAlign: 'center' },

  // Header flores
  floresBadge:    { backgroundColor: '#FFCAD4', borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  floresBadgeTxt: { fontSize: 14, fontWeight: '800', color: '#E91E8C' },

  // Mapa
  seccion:       { paddingHorizontal: 20, marginBottom: 8 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 16, paddingBottom: 8, borderBottomWidth: 2 },
  seccionDot:    { width: 10, height: 10, borderRadius: 5 },
  seccionTitulo: { fontSize: 14, fontWeight: '800' },
  seccionDesc:   { fontSize: 11, fontWeight: '500', opacity: 0.8, marginTop: 1 },
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
  completadoBtn:       { backgroundColor: '#E91E8C', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, elevation: 4 },
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

  // La Red de Tomy
  centrado:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  gameArea: {
    flex: 1, backgroundColor: '#EEF4FF',
    borderRadius: 20, margin: 12,
    overflow: 'hidden', position: 'relative',
  },
  fallingItem: {
    position: 'absolute', width: ITEM_SIZE, height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2, alignItems: 'center',
    justifyContent: 'center', elevation: 4,
  },
  netContainer: {
    position: 'absolute', width: NET_W,
    alignItems: 'center',
  },
  tomitaFace: {
    width: 56, height: 56, borderRadius: 20,
    backgroundColor: '#FFCAD4', alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
    elevation: 6, position: 'relative',
  },
  tomitaEyes:  { flexDirection: 'row', gap: 10, marginBottom: 4 },
  tomitaEye:   { width: 8, height: 10, borderRadius: 4, backgroundColor: '#9D8189' },
  tomitaMouth: { width: 16, height: 7, borderRadius: 4, backgroundColor: '#F4ACB7' },
  gill: {
    position: 'absolute', width: 20, height: 7,
    backgroundColor: '#FFB3C1', borderRadius: 4,
  },
  netVisual: {
    width: NET_W, height: 40, marginTop: -4,
    borderBottomWidth: 6, borderLeftWidth: 4, borderRightWidth: 4,
    borderColor: '#F4ACB750', borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: 'rgba(244,172,183,0.15)',
  },
  hudRow:    { flexDirection: 'row', gap: 10 },
  hudPill: {
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 99, elevation: 2,
  },
  hudTxt:     { fontSize: 15, fontWeight: '800', color: '#9D8189' },
  instruccionTxt: {
    fontSize: 13, color: '#9D818990', textAlign: 'center',
    marginHorizontal: 24, marginBottom: 4,
  },

  // Calculadora hormiga
  itemSelectorBtn: {
    width: 90, alignItems: 'center', padding: 12,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1, borderColor: '#F0E0E5',
  },
  itemSelectorBtnActive: { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' },
  itemSelectorTxt: { fontSize: 11, fontWeight: '700', color: '#9D8189', textAlign: 'center', marginTop: 4 },
  sliderCard: {
    backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 24,
    padding: 20, width: '100%', elevation: 2,
  },
  sliderLabel: { fontSize: 12, fontWeight: '700', color: '#9D818970', textTransform: 'uppercase', letterSpacing: 1 },
  sliderValor: { fontSize: 24, fontWeight: '900', color: '#F4ACB7' },
  precioBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F0E0E5',
  },
  precioBtnActive: { backgroundColor: '#F4ACB7', borderColor: '#F4ACB7' },
  precioBtnTxt:    { fontSize: 13, fontWeight: '700', color: '#9D8189' },
  resultadoCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    alignItems: 'center', width: '100%', elevation: 4,
    borderWidth: 1, borderColor: '#FFF0F4',
  },
  resultadoLabel: { fontSize: 13, color: '#9D8189', fontWeight: '600' },
  resultadoMonto: { fontSize: 36, fontWeight: '900', color: '#9D8189', marginTop: 4 },

  // Frasco 50/30/20
  frascoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 20, padding: 14,
    borderWidth: 2, elevation: 2,
  },
  frascoVisuaWrap: { alignItems: 'center', justifyContent: 'center' },
  frascoVaso: {
    width: 44, height: 80, borderRadius: 10,
    borderWidth: 2, overflow: 'hidden',
    justifyContent: 'flex-end', backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  frascoRelleno:  { position: 'absolute', bottom: 0, left: 0, right: 0 },
  frascoMonedas: {
    position: 'absolute', bottom: 2, left: 0, right: 0,
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 1,
  },
  frascoEmoji:    { fontSize: 18, marginBottom: 2 },
  frascoLabel:    { fontSize: 13, fontWeight: '800', color: '#6D5A62', marginBottom: 2 },
  frascoPct:      { fontSize: 20, fontWeight: '900', marginBottom: 2 },
  frascoCount:    { fontSize: 11, color: '#9D8189', opacity: 0.7 },
  frascoControles:{ gap: 8 },
  frascoBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },

  // Timón teoría
  timonCard: {
    width: 120, height: 120, backgroundColor: '#F4ACB7',
    borderRadius: 28, transform: [{ rotate: '12deg' }],
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#F4ACB7',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 12,
  },
  timonNumeros: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    textAlign: 'center', lineHeight: 26,
    transform: [{ rotate: '-12deg' }],
  },

  // Quiz (mantener compatibilidad)
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

  // Mapa rediseñado mexa pink
  seccionWrap: {
    marginHorizontal: 16, marginBottom: 20,
    borderRadius: 20, borderWidth: 1.5, overflow: 'hidden',
  },
  seccionHeader2: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  seccionSub: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  nivelesGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: 10, gap: 8,
  },
  nivelCard: {
    width: '47%', borderRadius: 16, padding: 12,
    borderWidth: 1.5, borderColor: '#F0E0E5',
    backgroundColor: '#fff', gap: 4,
  },
  nivelCardBloq: { backgroundColor: '#FAFAFA', borderColor: '#F0F0F0' },
  nivelCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nivelEmojiCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  nivelCardNum:   { fontSize: 10, fontWeight: '700', color: '#9D818970', textTransform: 'uppercase', letterSpacing: 0.5 },
  nivelCardTitulo:{ fontSize: 13, fontWeight: '800', color: '#6D5A62', lineHeight: 17 },
  nivelCardSub:   { fontSize: 11, color: '#9D8189', opacity: 0.7, lineHeight: 15 },

  // Juegos nuevos
  gastoCard: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#F0E0E5', elevation: 1,
  },
  gastoCardOk:  { backgroundColor: '#D8F5EE', borderColor: '#85A89E' },
  gastoCardMal: { backgroundColor: '#FFF0F0', borderColor: '#FFCAD4' },
  gastoTxt:     { fontSize: 13, fontWeight: '600', color: '#6D5A62', lineHeight: 19 },
  catBtn: {
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 99, borderWidth: 1, borderColor: '#F0E0E5',
    backgroundColor: '#fff',
  },
  catBtnTxt: { fontSize: 11, fontWeight: '700', color: '#9D8189' },
  deudaBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  simCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#FFF0F4', elevation: 2,
  },
  simLabel: { fontSize: 13, fontWeight: '700', color: '#9D8189' },
  simBtn: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 99, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#F0E0E5',
  },
  simBtnTxt: { fontSize: 12, fontWeight: '600', color: '#9D8189' },
});
