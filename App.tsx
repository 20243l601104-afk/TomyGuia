import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { AcademiaScreen } from './src/screens/AcademiaScreen';
import { BottomNav, NavTab } from './src/components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveOnboardingData, loadOnboardingData,
  saveProfile, loadProfile,
  saveLoggedIn, isLoggedIn,
} from './src/services/storage';
import type { FixedExpenseSeed, UserProfile } from './src/types';

type AppView = 'loading' | 'auth' | 'onboarding' | 'main';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  photoUri: null,
  flowers: 5,
  achievements: ['onboarding'],
};

export default function App() {
  const [view, setView]                           = useState<AppView>('loading');
  const [activeTab, setActiveTab]                 = useState<NavTab>('home');
  const [seedExpenses, setSeedExpenses]           = useState<FixedExpenseSeed[]>([]);
  const [totalBalance, setTotalBalance]           = useState(0);
  const [emergencyFundGoal, setEmergencyFundGoal] = useState(0);
  const [monthlyIncome, setMonthlyIncome]         = useState(0);
  const [housing, setHousing]                     = useState<string | null>(null);
  const [transport, setTransport]                 = useState<string | null>(null);
  const [profile, setProfile]                     = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const init = async () => {
      const data         = await loadOnboardingData();
      const savedProfile = await loadProfile();
      const loggedIn     = await isLoggedIn();
      if (savedProfile) setProfile(savedProfile);
      if (!data) {
        setView('onboarding');
      } else {
        setSeedExpenses(data.fixedExpenses);
        setTotalBalance(data.totalBalance);
        setEmergencyFundGoal(data.emergencyFundGoal);
        setMonthlyIncome(data.monthlyIncome);
        setHousing(data.housing || null);
        setTransport(data.transport || null);
        setView(loggedIn ? 'main' : 'auth');
      }
    };
    init();
  }, []);

  const handleOnboardingComplete = async (r: {
    fixedExpenses: FixedExpenseSeed[];
    totalBalance: number;
    emergencyFundGoal: number;
    monthlyIncome: number;
    housing: string | null;
    transport: string | null;
  }) => {
    await saveOnboardingData(r);
    setSeedExpenses(r.fixedExpenses);
    setTotalBalance(r.totalBalance);
    setEmergencyFundGoal(r.emergencyFundGoal);
    setMonthlyIncome(r.monthlyIncome);
    setHousing(r.housing);
    setTransport(r.transport);
    setView('auth');
  };

  const handleGoogleLogin = async (user: { name: string; email: string; photoUri: string | null }) => {
    const updated: UserProfile = { ...profile, name: user.name, photoUri: user.photoUri };
    setProfile(updated);
    await saveProfile(updated);
    await saveLoggedIn();
    
    setView('main');
  };

  const handleSkipLogin = async () => {
    await saveLoggedIn();
    // Verificar si ya vio el tutorial
    
    setView('main');
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

  if (view === 'onboarding') return <OnboardingScreen onComplete={handleOnboardingComplete} />;

  if (view === 'auth') return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthScreen onGoogle={handleGoogleLogin} onSkip={handleSkipLogin} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            {activeTab === 'home' && (
              <DashboardScreen
                emergencyFundGoal={emergencyFundGoal}
                totalBalance={totalBalance}
                seedExpenses={seedExpenses}
                monthlyIncome={monthlyIncome}
                profile={profile}
                onProfilePress={() => setActiveTab('perfil')}
                onAddFlowers={addFlowers}
              />
            )}
            {activeTab === 'legal' && (
              <LegalScreen
                renta={housing === 'rent'}
                tieneCarro={transport === 'car'}
                nombreUsuaria={profile.name || undefined}
                monthlyIncome={monthlyIncome}
              />
            )}
            {activeTab === 'academia' && <AcademiaScreen onAddFlowers={addFlowers} />}
            {activeTab === 'perfil' && (
              <ProfileScreen
                profile={profile}
                onSave={handleProfileSave}
                onBack={() => setActiveTab('home')}
              />
            )}
          </View>
          <BottomNav active={activeTab} onPress={setActiveTab} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
