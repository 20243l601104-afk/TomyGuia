export interface FixedExpenseSeed {
  id: string; title: string; color: string; amount: number;
  iconKey: 'home'|'droplet'|'zap'|'wifi'|'car'|'bus'|'cart'|'tv';
}
export interface FixedExpense {
  id: string; title: string; color: string; amount: number;
  day: number|null; isPaid: boolean; iconKey: FixedExpenseSeed['iconKey'];
}
export interface Expense { id: number; amount: number; category: 'needs'|'wants'; label: string; source: 'card'|'chat'; }
export interface Allocation { needs: number; wants: number; savings: number; }
export interface ConnectedBank { id: string; name: string; last4: string; color: string; connectedAt: number; }
export interface BankTransaction { id: number; amount: number; category: 'needs'|'wants'; label: string; source: 'card'; }

export interface UserProfile {
  name: string;
  photoUri: string | null;
  flowers: number;         // Flores de cempasúchil (puntos)
  achievements: string[];  // Logros desbloqueados
}
