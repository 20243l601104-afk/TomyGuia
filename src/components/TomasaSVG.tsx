import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

// ─────────────────────────────────────────────
//  TIPOS
// ─────────────────────────────────────────────

export type TomasaMood =
  | 'neutral'   // Todo tranquilo, saludo normal
  | 'happy'     // Meta cumplida, buen ahorro
  | 'sad'       // Presupuesto muy excedido
  | 'worried'   // Alerta: gasto inusual, pago próximo
  | 'alert'     // Urgente: pago vencido, saldo bajo
  | 'sleeping'; // Sin actividad registrada hoy

interface Props {
  size?: number;
  floating?: boolean;
  mood?: TomasaMood;
}

// ─────────────────────────────────────────────
//  MAPA DE IMÁGENES
//  Coloca los PNGs en: assets/tomasa/
// ─────────────────────────────────────────────

const MOOD_IMAGE: Record<TomasaMood, ReturnType<typeof require>> = {
  neutral:  require('../../assets/tomasa/tomasa_neutral.png'),
  happy:    require('../../assets/tomasa/tomasa_happy.png'),
  sad:      require('../../assets/tomasa/tomasa_sad.png'),
  worried:  require('../../assets/tomasa/tomasa_worried.png'),
  alert:    require('../../assets/tomasa/tomasa_alert.png'),
  sleeping: require('../../assets/tomasa/tomasa_sleeping.png'),
};

// ─────────────────────────────────────────────
//  COMPONENTE
// ─────────────────────────────────────────────

export function TomasaSVG({ size = 60, floating = true, mood = 'neutral' }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!floating) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -6,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 6,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [floating]);

  return (
    <Animated.Image
      source={MOOD_IMAGE[mood]}
      style={{
        width: size,
        height: size,
        resizeMode: 'contain',
        transform: [{ translateY: floating ? bounce : 0 }],
      }}
    />
  );
}
