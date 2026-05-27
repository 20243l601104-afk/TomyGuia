import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Ellipse, G } from 'react-native-svg';

interface Props { size?: number; floating?: boolean; }

export function TomasaSVG({ size = 60, floating = true }: Props) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!floating) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -6, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 6, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [floating]);

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY: floating ? bounce : 0 }] }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* Branquias izquierdas (gills) */}
        <G>
          <Path d="M 28 30 Q 12 18 8 10" stroke="#F4ACB7" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M 25 35 Q 8 28 2 22" stroke="#FFCAD4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d="M 24 40 Q 10 38 4 34" stroke="#F4ACB7" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Bolitas en las puntas */}
          <Circle cx="8" cy="10" r="3" fill="#F4ACB7" />
          <Circle cx="2" cy="22" r="2.5" fill="#FFCAD4" />
          <Circle cx="4" cy="34" r="2" fill="#F4ACB7" />
        </G>
        {/* Branquias derechas (gills) */}
        <G>
          <Path d="M 92 30 Q 108 18 112 10" stroke="#F4ACB7" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M 95 35 Q 112 28 118 22" stroke="#FFCAD4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d="M 96 40 Q 110 38 116 34" stroke="#F4ACB7" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Bolitas en las puntas */}
          <Circle cx="112" cy="10" r="3" fill="#F4ACB7" />
          <Circle cx="118" cy="22" r="2.5" fill="#FFCAD4" />
          <Circle cx="116" cy="34" r="2" fill="#F4ACB7" />
        </G>
        {/* Cabeza principal */}
        <Ellipse cx="60" cy="58" rx="38" ry="36" fill="#FFCAD4" />
        {/* Cara interior más clara */}
        <Ellipse cx="60" cy="60" rx="30" ry="28" fill="#FFE5D9" />
        {/* Ojos */}
        <Circle cx="45" cy="52" r="6" fill="#9D8189" />
        <Circle cx="75" cy="52" r="6" fill="#9D8189" />
        {/* Brillo en ojos */}
        <Circle cx="47" cy="50" r="2.5" fill="white" />
        <Circle cx="77" cy="50" r="2.5" fill="white" />
        {/* Segundo brillo pequeño */}
        <Circle cx="43" cy="54" r="1.2" fill="white" opacity="0.6" />
        <Circle cx="73" cy="54" r="1.2" fill="white" opacity="0.6" />
        {/* Sonrisa amplia de ajolote */}
        <Path d="M 42 66 Q 52 76 60 74 Q 68 76 78 66" stroke="#F4ACB7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Mejillas rosadas */}
        <Ellipse cx="36" cy="62" rx="7" ry="4.5" fill="#F4ACB7" opacity="0.45" />
        <Ellipse cx="84" cy="62" rx="7" ry="4.5" fill="#F4ACB7" opacity="0.45" />
        {/* Manchitas decorativas en la cabeza */}
        <Circle cx="50" cy="38" r="2" fill="#F4ACB7" opacity="0.3" />
        <Circle cx="70" cy="40" r="1.5" fill="#F4ACB7" opacity="0.25" />
        <Circle cx="58" cy="42" r="1" fill="#FFCAD4" opacity="0.4" />
        {/* Corona flor pequeña */}
        <G>
          <Circle cx="60" cy="32" r="4" fill="#F4ACB7" opacity="0.6" />
          <Circle cx="56" cy="34" r="2.5" fill="#FFCAD4" opacity="0.5" />
          <Circle cx="64" cy="34" r="2.5" fill="#FFCAD4" opacity="0.5" />
          <Circle cx="60" cy="32" r="2" fill="#FFE5D9" />
        </G>
      </Svg>
    </Animated.View>
  );
}
