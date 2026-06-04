import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import {
  saveOnboardingData, loadOnboardingData,
  saveProfile, loadProfile,
  saveLoggedIn, isLoggedIn,
} from './src/services/storage';
import type { FixedExpenseSeed, UserProfile } from './src/types';

type AppView = 'loading' | 'auth' | 'onboarding' | 'dashboard' | 'profile';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  photoUri: null,
  flowers: 5,
  achievements: ['onboarding'],
};

export default function App() {
  const [view, setView]                           = useState<AppView>('loading');
  const [seedExpenses, setSeedExpenses]           = useState<FixedExpenseSeed[]>([]);
  const [totalBalance, setTotalBalance]           = useState(0);
  const [emergencyFundGoal, setEmergencyFundGoal] = useState(0);
  const [monthlyIncome, setMonthlyIncome]         = useState(0);
  const [profile, setProfile]                     = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const init = async () => {
      const data        = await loadOnboardingData();
      const savedProfile = await loadProfile();
      const loggedIn    = await isLoggedIn();

      if (savedProfile) setProfile(savedProfile);

      if (!data) {
        // Primera vez — onboarding
        setView('onboarding');
      } else {
        // Ya hizo onboarding — cargar datos
        setSeedExpenses(data.fixedExpenses);
        setTotalBalance(data.totalBalance);
        setEmergencyFundGoal(data.emergencyFundGoal);
        setMonthlyIncome(data.monthlyIncome);

        if (loggedIn) {
          // Ya inició sesión antes — directo al dashboard
          setView('dashboard');
        } else {
          // Hizo onboarding pero nunca inició sesión — mostrar login
          setView('auth');
        }
      }
    };
    init();
  }, []);

  const handleOnboardingComplete = async (r: {
    fixedExpenses: FixedExpenseSeed[];
    totalBalance: number;
    emergencyFundGoal: number;
    monthlyIncome: number;
  }) => {
    await saveOnboardingData(r);
    setSeedExpenses(r.fixedExpenses);
    setTotalBalance(r.totalBalance);
    setEmergencyFundGoal(r.emergencyFundGoal);
    setMonthlyIncome(r.monthlyIncome);
    setView('auth');
  };

  const handleGoogleLogin = async (user: {
    name: string; email: string; photoUri: string | null;
  }) => {
    const updated: UserProfile = { ...profile, name: user.name, photoUri: user.photoUri };
    setProfile(updated);
    await saveProfile(updated);
    await saveLoggedIn(); // ← guardar que ya inició sesión
    setView('dashboard');
  };

  const handleSkipLogin = async () => {
    await saveLoggedIn(); // ← también guardar si saltó
    setView('dashboard');
  };

  const handleProfileSave = async (updated: UserProfile) => {
    setProfile(updated);
    await saveProfile(updated);
  };

  const addFlowers = (amount: number, achievementId?: string) => {
    setProfile(prev => {
      const newAch = achievementId && !prev.achievements.includes(achievementId)
        ? [...prev.achievements, achievementId] : prev.achievements;
      const bonus = achievementId && !prev.achievements.includes(achievementId) ? amount : 0;
      const updated = { ...prev, flowers: prev.flowers + bonus, achievements: newAch };
      saveProfile(updated);
      return updated;
    });
  };

  if (view === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFE5D9', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F4ACB7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {view === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
        {view === 'auth'       && <AuthScreen onGoogle={handleGoogleLogin} onSkip={handleSkipLogin} />}
        {view === 'dashboard'  && (
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
