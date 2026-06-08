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
  // Dashboard — datos del mes actual
  DASHBOARD_MONTH:       'tomy_dashboard_month',    // 'YYYY-MM' del último guardado
  DASHBOARD_NEEDS:       'tomy_dashboard_needs',
  DASHBOARD_WANTS:       'tomy_dashboard_wants',
  DASHBOARD_EF:          'tomy_dashboard_ef',
  DASHBOARD_EXPS:        'tomy_dashboard_exps',
  DASHBOARD_PAID_BILLS:  'tomy_dashboard_paid_bills',
  DASHBOARD_BANK:        'tomy_dashboard_bank',
};

// ─── Onboarding ───────────────────────────────────────
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

// ─── Perfil ───────────────────────────────────────────
export async function saveProfile(profile: any) {
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}

export async function loadProfile() {
  const raw = await AsyncStorage.getItem(KEYS.PROFILE);
  return raw ? JSON.parse(raw) : null;
}

// ─── Sesión ───────────────────────────────────────────
export async function saveLoggedIn() {
  await AsyncStorage.setItem(KEYS.LOGGED_IN, 'true');
}

export async function isLoggedIn() {
  const val = await AsyncStorage.getItem(KEYS.LOGGED_IN);
  return val === 'true';
}

// ─── Dashboard — guardar estado del mes ──────────────
export async function saveDashboardState(state: {
  needsBudget: number;
  wantsBudget: number;
  ef: number;
  exps: any[];
  paidBills: any[];
  bank: any | null;
}) {
  const month = getCurrentMonth();
  await AsyncStorage.multiSet([
    [KEYS.DASHBOARD_MONTH,      month],
    [KEYS.DASHBOARD_NEEDS,      String(state.needsBudget)],
    [KEYS.DASHBOARD_WANTS,      String(state.wantsBudget)],
    [KEYS.DASHBOARD_EF,         String(state.ef)],
    [KEYS.DASHBOARD_EXPS,       JSON.stringify(state.exps)],
    [KEYS.DASHBOARD_PAID_BILLS, JSON.stringify(state.paidBills)],
    [KEYS.DASHBOARD_BANK,       JSON.stringify(state.bank)],
  ]);
}

// ─── Dashboard — cargar estado ───────────────────────
export async function loadDashboardState(initial50: number, initial30: number, initial20: number) {
  const [month, needs, wants, ef, exps, paidBills, bank] = await Promise.all([
    AsyncStorage.getItem(KEYS.DASHBOARD_MONTH),
    AsyncStorage.getItem(KEYS.DASHBOARD_NEEDS),
    AsyncStorage.getItem(KEYS.DASHBOARD_WANTS),
    AsyncStorage.getItem(KEYS.DASHBOARD_EF),
    AsyncStorage.getItem(KEYS.DASHBOARD_EXPS),
    AsyncStorage.getItem(KEYS.DASHBOARD_PAID_BILLS),
    AsyncStorage.getItem(KEYS.DASHBOARD_BANK),
  ]);

  const currentMonth = getCurrentMonth();
  const isSameMonth  = month === currentMonth;

  if (!month || !isSameMonth) {
    // Mes nuevo o primera vez — resetear gastos pero mantener ef acumulado
    return {
      needsBudget: initial50,
      wantsBudget: initial30,
      ef:          ef ? Number(ef) : initial20, // mantener fondo de emergencia
      exps:        [],
      paidBills:   [],
      bank:        bank ? JSON.parse(bank) : null,
      isNewMonth:  true,
    };
  }

  return {
    needsBudget: needs ? Number(needs) : initial50,
    wantsBudget: wants ? Number(wants) : initial30,
    ef:          ef    ? Number(ef)    : initial20,
    exps:        exps  ? JSON.parse(exps) : [],
    paidBills:   paidBills ? JSON.parse(paidBills) : [],
    bank:        bank  ? JSON.parse(bank) : null,
    isNewMonth:  false,
  };
}

// ─── Helpers ──────────────────────────────────────────
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function clearAll() {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
