import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { TomasaSVG, type TomasaMood } from './TomasaSVG';
import { generateAssistantMessage, type AssistantMessage } from '../screens/AssistantLogic';
import type { FixedExpense } from '../types';

interface Props {
  wantsBudget: number;
  wantsSpent: number;
  needsBudget: number;
  emergencyFundGoal: number;
  emergencyFund: number;
  fixedExpenses: FixedExpense[];
  paidBills: { id: string; title: string; amount: number }[];
  expenses?: import("../types").Expense[];
}

function getMood(message: AssistantMessage | null): TomasaMood {
  if (!message) return 'sleeping';
  switch (message.type) {
    case 'celebration': return 'happy';
    case 'warning':     return 'worried';
    case 'alert':       return 'alert';
    case 'sad':         return 'sad';
    default:            return 'neutral';
  }
}

export function FloatingAssistant({
  wantsBudget,
  wantsSpent,
  needsBudget,
  emergencyFundGoal,
  emergencyFund,
  fixedExpenses,
  paidBills,
}: Props) {
  const [message, setMessage] = useState<AssistantMessage | null>(null);
  const [showThought, setShowThought] = useState(false);

  const thoughtOpacity = useRef(new Animated.Value(0)).current;
  const thoughtScale   = useRef(new Animated.Value(0.7)).current;
  const thoughtY       = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const newMessage = generateAssistantMessage(
      wantsBudget, wantsSpent, needsBudget,
      emergencyFundGoal, emergencyFund,
      fixedExpenses, paidBills, new Date()
    );
    setMessage(newMessage);
  }, [wantsBudget, wantsSpent, needsBudget, emergencyFundGoal, emergencyFund, fixedExpenses, paidBills]);

  const animateIn = () => {
    thoughtOpacity.setValue(0);
    thoughtScale.setValue(0.7);
    thoughtY.setValue(10);
    setShowThought(true);
    Animated.parallel([
      Animated.timing(thoughtOpacity, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(thoughtScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(thoughtY, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  };

  const animateOut = () => {
    Animated.parallel([
      Animated.timing(thoughtOpacity, { toValue: 0, duration: 500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(thoughtScale, { toValue: 0.7, duration: 500, useNativeDriver: true }),
      Animated.timing(thoughtY, { toValue: -10, duration: 500, useNativeDriver: true }),
    ]).start(() => setShowThought(false));
  };

  useEffect(() => {
    if (!message) return;
    const initial = setTimeout(() => {
      animateIn();
      setTimeout(animateOut, 5000);
    }, 1500);
    const interval = setInterval(() => {
      animateIn();
      setTimeout(animateOut, 5000);
    }, 20000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [message]);

  const handlePress = () => {
    if (!showThought) {
      animateIn();
      setTimeout(animateOut, 5000);
    }
  };

  if (!message) return null;

  const mood           = getMood(message);
  const isWarning      = message.type === 'warning' || message.type === 'alert';
  const isCelebration  = message.type === 'celebration';
  const bubbleColor    = isWarning ? '#FFF0F0' : isCelebration ? '#F0F9F4' : '#FFFFFF';
  const borderColor    = isWarning ? '#FFB3B3' : isCelebration ? '#A8D5B5' : '#FFCAD4';
  const textColor      = isWarning ? '#D64545' : isCelebration ? '#3D7A56' : '#9D8189';

  return (
    <View style={s.container}>

      {/* Nube de pensamiento */}
      {showThought && (
        <Animated.View style={[
          s.thoughtBubble,
          { backgroundColor: bubbleColor, borderColor },
          { opacity: thoughtOpacity, transform: [{ scale: thoughtScale }, { translateY: thoughtY }] },
        ]}>
          <Text style={s.thoughtEmoji}>{message.emoji}</Text>
          <Text style={[s.thoughtText, { color: textColor }]}>{message.text}</Text>
          <View style={[s.dot1, { borderColor }]} />
          <View style={[s.dot2, { borderColor }]} />
          <View style={[s.dot3, { borderColor }]} />
        </Animated.View>
      )}

      {/* Tomasa sin ningún contenedor de fondo */}
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}>
        <TomasaSVG size={70} floating={true} mood={mood} />
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    zIndex: 50,
    alignItems: 'center',
  },
  thoughtBubble: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    width: 200,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 12,
    elevation: 6,
    shadowColor: '#F4ACB7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  thoughtEmoji: {
    fontSize: 22,
    marginBottom: 4,
    textAlign: 'center',
  },
  thoughtText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  dot1: {
    position: 'absolute',
    bottom: -8,
    right: 24,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  dot2: {
    position: 'absolute',
    bottom: -15,
    right: 16,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
  dot3: {
    position: 'absolute',
    bottom: -20,
    right: 10,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#fff',
    borderWidth: 1.5,
  },
});
