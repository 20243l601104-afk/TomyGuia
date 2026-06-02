import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import type { FixedExpenseSeed, UserProfile } from './src/types';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  photoUri: null,
  flowers: 5,               // 5 flores por completar onboarding
  achievements: ['onboarding'],
};

export default function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard' | 'profile'>('onboarding');
  const [seedExpenses, setSeedExpenses] = useState<FixedExpenseSeed[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [emergencyFundGoal, setEmergencyFundGoal] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const handleComplete = (r: { fixedExpenses: FixedExpenseSeed[]; totalBalance: number; emergencyFundGoal: number; monthlyIncome: number }) => {
    setSeedExpenses(r.fixedExpenses);
    setTotalBalance(r.totalBalance);
    setEmergencyFundGoal(r.emergencyFundGoal);
    setMonthlyIncome(r.monthlyIncome);
    setView('dashboard');
  };

  const handleProfileSave = (updated: UserProfile) => {
    setProfile(updated);
  };

  // Función para agregar flores (se puede llamar desde Dashboard)
  const addFlowers = (amount: number, achievementId?: string) => {
    setProfile(prev => {
      const newAch = achievementId && !prev.achievements.includes(achievementId)
        ? [...prev.achievements, achievementId]
        : prev.achievements;
      const bonusFlowers = achievementId && !prev.achievements.includes(achievementId) ? amount : 0;
      return {
        ...prev,
        flowers: prev.flowers + bonusFlowers,
        achievements: newAch,
      };
    });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {view === 'onboarding' && (
          <OnboardingScreen onComplete={handleComplete} />
        )}
        {view === 'dashboard' && (
          <DashboardScreen
            emergencyFundGoal={emergencyFundGoal}
            totalBalance={totalBalance}
            seedExpenses={seedExpenses}
            monthlyIncome={monthlyIncome}
            profile={profile}
            onProfilePress={() => setView('profile')}
            onAddFlowers={addFlowers}
          />
        )}
        {view === 'profile' && (
          <ProfileScreen
            profile={profile}
            onSave={handleProfileSave}
            onBack={() => setView('dashboard')}
          />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
