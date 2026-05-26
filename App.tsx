import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import type { FixedExpenseSeed } from './src/types';

export default function App() {
  const [view, setView] = useState<'onboarding'|'dashboard'>('onboarding');
  const [seedExpenses, setSeedExpenses] = useState<FixedExpenseSeed[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [emergencyFundGoal, setEmergencyFundGoal] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const handleComplete = (r: {fixedExpenses:FixedExpenseSeed[];totalBalance:number;emergencyFundGoal:number;monthlyIncome:number}) => {
    setSeedExpenses(r.fixedExpenses); setTotalBalance(r.totalBalance);
    setEmergencyFundGoal(r.emergencyFundGoal); setMonthlyIncome(r.monthlyIncome);
    setView('dashboard');
  };
  return (
    <GestureHandlerRootView style={{flex:1}}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {view==='onboarding'
          ? <OnboardingScreen onComplete={handleComplete}/>
          : <DashboardScreen emergencyFundGoal={emergencyFundGoal} totalBalance={totalBalance} seedExpenses={seedExpenses} monthlyIncome={monthlyIncome}/>
        }
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
