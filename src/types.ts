export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin';
  familyId: string;
}

export interface Family {
  id: string;
  ownerUid: string;
  parentPin: string;
  members: string[];
  createdAt: string;
  conversionRate: number; // e.g. 10 KidCoins = R$ 1,00
  maxDailyEarn?: number; // Default daily earning limit (e.g. 5 KC)
  maxMonthlyEarn?: number; // Default 30-day monthly earning limit (e.g. 150 KC)
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  themeColor: string;
  balance: number; // KidCoins balance
  level: number;
  points: number;
  monthlyGoal: number; // Goal in KidCoins or R$
  avatarUrl: string;
  avatarId: string;
  pin: string; // 4-digit child pin
  maxDailyEarn?: number; // Custom daily earning limit for this child
  maxMonthlyEarn?: number; // Custom 30-day monthly earning limit for this child
}

export type TaskType = 'positive' | 'negative';
export type TaskLevel = 'leve' | 'médio' | 'grave';

export interface Task {
  id: string;
  familyId: string;
  name: string;
  type: TaskType;
  value: number; // Coin reward or deduction
  category: string;
  level: TaskLevel;
  recoverable: boolean;
  icon?: string;
}

export type TransactionType = 'reward' | 'penalty' | 'recovery' | 'payout' | 'bonus';

export interface Transaction {
  id: string;
  childId: string;
  familyId: string;
  amount: number; // positive or negative
  type: TransactionType;
  description: string;
  timestamp: string;
  isRecoverable?: boolean;
  recovered?: boolean;
  taskId?: string;
  approvedBy?: string;
}

export interface MonthlyStatement {
  id: string;
  childId: string;
  familyId: string;
  month: number; // 0-11
  year: number;
  totalCoins: number;
  totalBrl: number;
  closingDate: string;
  paidOut: boolean;
}

export type ValidationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ValidationRequest {
  id: string;
  childId: string;
  familyId: string;
  taskId?: string;
  taskName: string;
  taskValue: number;
  requestedAt: string; // ISO date timestamp
  status: ValidationRequestStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface ChildNotification {
  id: string;
  childId: string;
  familyId: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'goal' | 'level_up';
  timestamp: string;
  read: boolean;
  amount?: number;
}

export interface AvatarOption {
  id: string;
  name: string;
  url: string;
  bgGradient: string;
  monsterType: string;
}
