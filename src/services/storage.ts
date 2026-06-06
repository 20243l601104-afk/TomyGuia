import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ONBOARDING_DONE: 'tomy_onboarding_done',
  LOGGED_IN:       'tomy_logged_in',
  SEED_EXPENSES:   'tomy_seed_expenses',
  TOTAL_BALANCE:   'tomy_total_balance',
  EMERGENCY_GOAL:  'tomy_emergency_goal',
  MONTHLY_INCOME:  'tomy_monthly_income',
  HOUSING:         'tomy_housing',
  TRANSPORT:       'tomy_transport',
  PROFILE:         'tomy_profile',
  EXPENSES:        'tomy_expenses',
  PAID_BILLS:      'tomy_paid_bills',
};

export async function saveOnboardingData(data: {
  fixedExpenses: any[];
  totalBalance: number;
  emergencyFundGoal: number;
  monthlyIncome: number;
  housing?: string | null;
  transport?: string | null;
}) {
  await AsyncStorage.multiSet([
    [KEYS.ONBOARDING_DONE, 'true'],
    [KEYS.SEED_EXPENSES,   JSON.stringify(data.fixedExpenses)],
    [KEYS.TOTAL_BALANCE,   String(data.totalBalance)],
    [KEYS.EMERGENCY_GOAL,  String(data.emergencyFundGoal)],
    [KEYS.MONTHLY_INCOME,  String(data.monthlyIncome)],
    [KEYS.HOUSING,         data.housing || ''],
    [KEYS.TRANSPORT,       data.transport || ''],
  ]);
}

export async function loadOnboardingData() {
  const done = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
  if (!done) return null;
  const [expenses, balance, goal, income, housing, transport] = await Promise.all([
    AsyncStorage.getItem(KEYS.SEED_EXPENSES),
    AsyncStorage.getItem(KEYS.TOTAL_BALANCE),
    AsyncStorage.getItem(KEYS.EMERGENCY_GOAL),
    AsyncStorage.getItem(KEYS.MONTHLY_INCOME),
    AsyncStorage.getItem(KEYS.HOUSING),
    AsyncStorage.getItem(KEYS.TRANSPORT),
  ]);
  return {
    fixedExpenses:     JSON.parse(expenses || '[]'),
    totalBalance:      Number(balance || 0),
    emergencyFundGoal: Number(goal || 0),
    monthlyIncome:     Number(income || 0),
    housing:           housing || null,
    transport:         transport || null,
  };
}

export async function saveProfile(profile: any) {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function loadProfile() {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

export async function saveLoggedIn() {
  await AsyncStorage.setItem(KEYS.LOGGED_IN, 'true');
}

export async function isLoggedIn() {
  const val = await AsyncStorage.getItem(KEYS.LOGGED_IN);
  return val === 'true';
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
