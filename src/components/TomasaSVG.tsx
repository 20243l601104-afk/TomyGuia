import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Ellipse } from 'react-native-svg';
interface Props { size?: number; }
export function TomasaSVG({ size = 60 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="40" fill="#FFCAD4" />
        <Circle cx="50" cy="50" r="32" fill="#FFE5D9" />
        <Circle cx="38" cy="45" r="5" fill="#9D8189" />
        <Circle cx="62" cy="45" r="5" fill="#9D8189" />
        <Circle cx="40" cy="43" r="2" fill="white" />
        <Circle cx="64" cy="43" r="2" fill="white" />
        <Path d="M 40 58 Q 50 66 60 58" stroke="#F4ACB7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Ellipse cx="34" cy="52" rx="6" ry="4" fill="#F4ACB7" opacity="0.5" />
        <Ellipse cx="66" cy="52" rx="6" ry="4" fill="#F4ACB7" opacity="0.5" />
      </Svg>
    </View>
  );
}
