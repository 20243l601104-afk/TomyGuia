import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TomasaSVG } from './TomasaSVG';
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
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<AssistantMessage | null>(null);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Generar mensaje basado en estado actual
  useEffect(() => {
    const newMessage = generateAssistantMessage(
      wantsBudget,
      wantsSpent,
      needsBudget,
      emergencyFundGoal,
      emergencyFund,
      fixedExpenses,
      paidBills,
      new Date()
    );
    setMessage(newMessage);
  }, [wantsBudget, wantsSpent, needsBudget, emergencyFundGoal, emergencyFund, fixedExpenses, paidBills]);

  // Animación de pulso sutil
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  if (!message) return null;

  const isWarning = message.type === 'warning';
  const isCelebration = message.type === 'celebration';

  return (
    <>
      {/* Botón flotante */}
      <Animated.View
        style={[
          s.floatingBtn,
          { transform: [{ scale: pulseAnim }] },
          isWarning && s.warningBg,
          isCelebration && s.celebrationBg,
        ]}
      >
        <TouchableOpacity style={s.bubble} onPress={() => setIsOpen(true)} activeOpacity={0.8}>
          <View style={s.bubbleContent}>
            <TomasaSVG size={32} floating={false} />
            <View
              style={[
                s.indicator,
                isWarning && s.warningIndicator,
                isCelebration && s.celebrationIndicator,
              ]}
            >
              <Text style={s.indicatorEmoji}>{message.emoji}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal con mensaje completo */}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setIsOpen(false)} />
        <View style={s.centeredView}>
          <View
            style={[
              s.messageCard,
              isWarning && s.cardWarning,
              isCelebration && s.cardCelebration,
            ]}
          >
            {/* Header con Tomasa */}
            <View style={s.cardHeader}>
              <View style={s.avatarLarge}>
                <TomasaSVG size={48} floating={false} />
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#9D8189" />
              </TouchableOpacity>
            </View>

            {/* Mensaje */}
            <View style={s.messageContent}>
              <Text style={s.messageEmoji}>{message.emoji}</Text>
              <Text style={[s.messageText, isWarning && s.textWarning, isCelebration && s.textCelebration]}>
                {message.text}
              </Text>
            </View>

            {/* Botón */}
            <TouchableOpacity
              style={[s.btn, isWarning && s.btnWarning, isCelebration && s.btnCelebration]}
              onPress={() => setIsOpen(false)}
            >
              <Text style={s.btnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  // Botón flotante
  floatingBtn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 50,
  },
  bubble: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFCAD4',
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3C57C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  warningBg: { borderColor: '#E8963B' },
  warningIndicator: { backgroundColor: '#FF6B6B' },
  celebrationBg: { borderColor: '#85A89E' },
  celebrationIndicator: { backgroundColor: '#85A89E' },
  indicatorEmoji: { fontSize: 16, fontWeight: '800' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFCAD4',
  },
  cardWarning: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  cardCelebration: {
    backgroundColor: '#F0F9F8',
    borderColor: '#85A89E',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFCAD4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  messageContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  messageEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9D8189',
    textAlign: 'center',
    lineHeight: 24,
  },
  textWarning: {
    color: '#D64545',
    fontSize: 15,
    fontWeight: '700',
  },
  textCelebration: {
    color: '#5B776F',
    fontSize: 16,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: '#F4ACB7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  btnWarning: {
    backgroundColor: '#FF6B6B',
  },
  btnCelebration: {
    backgroundColor: '#85A89E',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
