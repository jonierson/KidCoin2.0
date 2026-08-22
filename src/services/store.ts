import { db } from '../lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs
} from 'firebase/firestore';
import { 
  Child, 
  Family, 
  Task, 
  Transaction, 
  MonthlyStatement, 
  ChildNotification,
  ValidationRequest,
  UserProfile 
} from '../types';
import { DEFAULT_TASKS, MONSTER_AVATARS } from '../data/avatars';
import { sound } from '../lib/audio';

const STORAGE_KEY = 'kidcoin_local_store_v1';

// Initial Demo Data
const initialFamily: Family = {
  id: 'fam_default',
  ownerUid: 'demo_parent',
  parentPin: '1234',
  members: ['pais@kidcoin.app'],
  createdAt: new Date().toISOString(),
  conversionRate: 10, // 10 KidCoins = R$ 1,00
  maxDailyEarn: 5, // Default daily limit: 5 KC
  maxMonthlyEarn: 150, // Default 30-day limit: 150 KC
};

const initialChildren: Child[] = [
  {
    id: 'child_lucas',
    familyId: 'fam_default',
    name: 'Lucas',
    themeColor: '#0284c7', // Cyan / Blue
    balance: 48,
    level: 3,
    points: 240,
    monthlyGoal: 100, // 100 coins = R$ 10,00
    avatarUrl: MONSTER_AVATARS[0].url,
    avatarId: MONSTER_AVATARS[0].id,
    pin: '1111',
    maxDailyEarn: 5,
    maxMonthlyEarn: 150,
  },
  {
    id: 'child_sofia',
    familyId: 'fam_default',
    name: 'Sofia',
    themeColor: '#d946ef', // Pink / Fuchsia
    balance: 85,
    level: 5,
    points: 490,
    monthlyGoal: 100,
    avatarUrl: MONSTER_AVATARS[2].url,
    avatarId: MONSTER_AVATARS[2].id,
    pin: '2222',
    maxDailyEarn: 5,
    maxMonthlyEarn: 150,
  },
];

const initialTasks: Task[] = DEFAULT_TASKS.map((t, idx) => ({
  id: `task_${idx + 1}`,
  familyId: 'fam_default',
  ...t,
  level: t.level as 'leve' | 'médio' | 'grave',
  type: t.type as 'positive' | 'negative',
}));

const initialTransactions: Transaction[] = [
  {
    id: 'tx_1',
    childId: 'child_lucas',
    familyId: 'fam_default',
    amount: 5,
    type: 'reward',
    description: 'Fazer o dever de casa sem reclamar',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'tx_2',
    childId: 'child_lucas',
    familyId: 'fam_default',
    amount: -4,
    type: 'penalty',
    description: 'Dar birra no mercado',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    isRecoverable: true,
    recovered: false,
  },
  {
    id: 'tx_3',
    childId: 'child_sofia',
    familyId: 'fam_default',
    amount: 10,
    type: 'reward',
    description: 'Ajudar na limpeza da casa e ler livro',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const initialNotifications: ChildNotification[] = [
  {
    id: 'notif_1',
    childId: 'child_lucas',
    familyId: 'fam_default',
    message: 'Você ganhou +5 KidCoins por estudar!',
    type: 'success',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false,
    amount: 5,
  },
  {
    id: 'notif_2',
    childId: 'child_lucas',
    familyId: 'fam_default',
    message: 'Multa aplicada: Dar birra (-4 KidCoins). Você pode recuperar se comportar bem hoje!',
    type: 'warning',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    read: false,
    amount: -4,
  },
];

const initialValidationRequests: ValidationRequest[] = [
  {
    id: 'val_demo_1',
    childId: 'child_lucas',
    familyId: 'fam_default',
    taskId: 'task_1',
    taskName: 'Fazer o dever de casa sem reclamar',
    taskValue: 5,
    requestedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    status: 'pending',
  },
];

class KidCoinStore {
  public family: Family = initialFamily;
  public children: Child[] = initialChildren;
  public tasks: Task[] = initialTasks;
  public transactions: Transaction[] = initialTransactions;
  public notifications: ChildNotification[] = initialNotifications;
  public validationRequests: ValidationRequest[] = initialValidationRequests;
  public monthlyStatements: MonthlyStatement[] = [];
  public currentUser: UserProfile | null = null;
  public activeChildId: string = initialChildren[0].id;
  public isParentMode: boolean = false;
  
  private listeners: Set<() => void> = new Set();
  private isFirebaseConnected: boolean = false;

  constructor() {
    this.loadLocal();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.saveLocal();
    this.listeners.forEach((l) => l());
  }

  private loadLocal() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.family) this.family = parsed.family;
        if (parsed.children?.length) this.children = parsed.children;
        if (parsed.tasks?.length) this.tasks = parsed.tasks;
        if (parsed.transactions) this.transactions = parsed.transactions;
        if (parsed.notifications) this.notifications = parsed.notifications;
        if (parsed.validationRequests) this.validationRequests = parsed.validationRequests;
        if (parsed.monthlyStatements) this.monthlyStatements = parsed.monthlyStatements;
        if (parsed.activeChildId) this.activeChildId = parsed.activeChildId;
      }
    } catch (e) {
      console.warn('Failed to parse local KidCoin storage', e);
    }
  }

  private saveLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          family: this.family,
          children: this.children,
          tasks: this.tasks,
          transactions: this.transactions,
          notifications: this.notifications,
          validationRequests: this.validationRequests,
          monthlyStatements: this.monthlyStatements,
          activeChildId: this.activeChildId,
        })
      );
    } catch (e) {
      console.warn('Failed to save to local storage', e);
    }
  }

  // --- Realtime Firestore Sync ---
  public syncWithFirestore(familyId: string) {
    if (!db || !familyId) return;

    try {
      // 1. Family doc
      const familyRef = doc(db, 'families', familyId);
      onSnapshot(
        familyRef,
        (snap) => {
          if (snap.exists()) {
            this.family = snap.data() as Family;
            this.notify();
          } else {
            setDoc(familyRef, this.family).catch((e) => console.warn('Failed to seed family:', e));
          }
        },
        (error) => {
          console.warn('Firestore family snapshot error:', error);
        }
      );

      // 2. Children collection
      const childrenQ = query(collection(db, 'children'), where('familyId', '==', familyId));
      onSnapshot(
        childrenQ,
        (snap) => {
          if (snap.empty && this.children.length > 0) {
            // Seed initial children
            this.children.forEach((child) => {
              setDoc(doc(db, 'children', child.id), child).catch((e) => console.warn('Failed to seed child:', e));
            });
          } else {
            const items: Child[] = [];
            snap.forEach((docSnap) => items.push(docSnap.data() as Child));
            if (items.length) {
              this.children = items;
              if (!this.children.some((c) => c.id === this.activeChildId)) {
                this.activeChildId = this.children[0].id;
              }
              this.notify();
            }
          }
        },
        (error) => {
          console.warn('Firestore children snapshot error:', error);
        }
      );

      // 3. Tasks collection
      const tasksQ = query(collection(db, 'tasks'), where('familyId', '==', familyId));
      onSnapshot(
        tasksQ,
        (snap) => {
          if (snap.empty && this.tasks.length > 0) {
            // Seed initial tasks
            this.tasks.forEach((task) => {
              setDoc(doc(db, 'tasks', task.id), task).catch((e) => console.warn('Failed to seed task:', e));
            });
          } else {
            const items: Task[] = [];
            snap.forEach((docSnap) => items.push(docSnap.data() as Task));
            if (items.length) {
              this.tasks = items;
              this.notify();
            }
          }
        },
        (error) => {
          console.warn('Firestore tasks snapshot error:', error);
        }
      );

      // 4. Transactions collection
      const txQ = query(collection(db, 'transactions'), where('familyId', '==', familyId));
      onSnapshot(
        txQ,
        (snap) => {
          const items: Transaction[] = [];
          snap.forEach((docSnap) => items.push(docSnap.data() as Transaction));
          this.transactions = items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.notify();
        },
        (error) => {
          console.warn('Firestore transactions snapshot error:', error);
        }
      );

      // 5. Notifications
      const notifQ = query(collection(db, 'notifications'), where('familyId', '==', familyId));
      onSnapshot(
        notifQ,
        (snap) => {
          const items: ChildNotification[] = [];
          snap.forEach((docSnap) => items.push(docSnap.data() as ChildNotification));
          this.notifications = items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          this.notify();
        },
        (error) => {
          console.warn('Firestore notifications snapshot error:', error);
        }
      );

      // 6. Validation Requests
      const valQ = query(collection(db, 'validationRequests'), where('familyId', '==', familyId));
      onSnapshot(
        valQ,
        (snap) => {
          if (snap.empty && this.validationRequests.length > 0) {
            this.validationRequests.forEach((v) => {
              setDoc(doc(db, 'validationRequests', v.id), v).catch((e) => console.warn('Failed to seed val request:', e));
            });
          } else {
            const items: ValidationRequest[] = [];
            snap.forEach((docSnap) => items.push(docSnap.data() as ValidationRequest));
            this.validationRequests = items.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
            this.notify();
          }
        },
        (error) => {
          console.warn('Firestore validationRequests snapshot error:', error);
        }
      );

      // 7. Monthly Statements
      const statementsQ = query(collection(db, 'monthlyStatements'), where('familyId', '==', familyId));
      onSnapshot(
        statementsQ,
        (snap) => {
          const items: MonthlyStatement[] = [];
          snap.forEach((docSnap) => items.push(docSnap.data() as MonthlyStatement));
          this.monthlyStatements = items.sort((a, b) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime());
          this.notify();
        },
        (error) => {
          console.warn('Firestore monthlyStatements snapshot error:', error);
        }
      );

      this.isFirebaseConnected = true;
    } catch (err) {
      console.warn('Firestore sync failed, using local storage fallback', err);
    }
  }

  // --- ACTIONS ---

  public setActiveChild(childId: string) {
    this.activeChildId = childId;
    this.notify();
  }

  public setParentMode(active: boolean) {
    this.isParentMode = active;
    this.notify();
  }

  public updateFamilySettings(
    parentPin: string,
    conversionRate: number,
    maxDailyEarn: number = 5,
    maxMonthlyEarn: number = 150
  ) {
    this.family = {
      ...this.family,
      parentPin,
      conversionRate: Math.max(1, conversionRate),
      maxDailyEarn: Math.max(0, maxDailyEarn),
      maxMonthlyEarn: Math.max(0, maxMonthlyEarn),
    };

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'families', this.family.id), this.family, { merge: true }).catch(console.error);
    }
    this.notify();
  }

  // Calculate earnings for a child today (local calendar date)
  public getChildDailyEarned(childId: string): number {
    const todayStr = new Date().toDateString();
    return this.transactions
      .filter((t) => t.childId === childId && t.amount > 0 && new Date(t.timestamp).toDateString() === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Calculate earnings for a child in the last 30 days
  public getChildMonthlyEarned(childId: string): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.transactions
      .filter((t) => t.childId === childId && t.amount > 0 && new Date(t.timestamp).getTime() >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Get active limits for a specific child (or fallback to family defaults)
  public getChildLimits(childId: string): { maxDailyEarn: number; maxMonthlyEarn: number } {
    const child = this.children.find((c) => c.id === childId);
    const maxDailyEarn = child?.maxDailyEarn !== undefined ? child.maxDailyEarn : (this.family.maxDailyEarn ?? 5);
    const maxMonthlyEarn = child?.maxMonthlyEarn !== undefined ? child.maxMonthlyEarn : (this.family.maxMonthlyEarn ?? 150);
    return { maxDailyEarn, maxMonthlyEarn };
  }

  // Helper to check if earning taskValue exceeds daily or monthly limits
  public checkEarningLimits(childId: string, taskValue: number): {
    canEarn: boolean;
    exceedsDaily: boolean;
    exceedsMonthly: boolean;
    dailyEarned: number;
    maxDaily: number;
    monthlyEarned: number;
    maxMonthly: number;
    remainingDaily: number;
    remainingMonthly: number;
    message?: string;
  } {
    const dailyEarned = this.getChildDailyEarned(childId);
    const monthlyEarned = this.getChildMonthlyEarned(childId);
    const limits = this.getChildLimits(childId);

    const remainingDaily = Math.max(0, limits.maxDailyEarn - dailyEarned);
    const remainingMonthly = Math.max(0, limits.maxMonthlyEarn - monthlyEarned);

    const exceedsDaily = limits.maxDailyEarn > 0 && (dailyEarned + taskValue > limits.maxDailyEarn);
    const exceedsMonthly = limits.maxMonthlyEarn > 0 && (monthlyEarned + taskValue > limits.maxMonthlyEarn);

    let message = '';
    if (exceedsDaily && exceedsMonthly) {
      message = `Aviso de Limite: ${taskValue} KidCoins excede o limite diário (${dailyEarned}/${limits.maxDailyEarn} KC hoje) e o limite mensal (${monthlyEarned}/${limits.maxMonthlyEarn} KC em 30 dias).`;
    } else if (exceedsDaily) {
      message = `Aviso de Limite Diário: ${taskValue} KidCoins excede o teto diário (${dailyEarned}/${limits.maxDailyEarn} KC hoje).`;
    } else if (exceedsMonthly) {
      message = `Aviso de Limite Mensal: ${taskValue} KidCoins excede o teto mensal (${monthlyEarned}/${limits.maxMonthlyEarn} KC em 30 dias).`;
    }

    return {
      canEarn: !exceedsDaily && !exceedsMonthly,
      exceedsDaily,
      exceedsMonthly,
      dailyEarned,
      maxDaily: limits.maxDailyEarn,
      monthlyEarned,
      maxMonthly: limits.maxMonthlyEarn,
      remainingDaily,
      remainingMonthly,
      message,
    };
  }

  // Children management
  public addChild(
    name: string,
    pin: string = '1234',
    avatarIdOrUrl: string = 'sulley',
    monthlyGoal: number = 100,
    maxDailyEarn: number = 5,
    maxMonthlyEarn: number = 150
  ) {
    let avatarUrl = MONSTER_AVATARS[0].url;
    let avatarId = MONSTER_AVATARS[0].id;

    if (avatarIdOrUrl.startsWith('data:') || avatarIdOrUrl.startsWith('http')) {
      avatarUrl = avatarIdOrUrl;
      avatarId = 'custom';
    } else {
      const avatar = MONSTER_AVATARS.find((a) => a.id === avatarIdOrUrl);
      if (avatar) {
        avatarUrl = avatar.url;
        avatarId = avatar.id;
      }
    }

    const newChild: Child = {
      id: `child_${Date.now()}`,
      familyId: this.family.id,
      name: name.trim(),
      themeColor: '#0284c7',
      balance: 0,
      level: 1,
      points: 0,
      monthlyGoal: Math.max(10, monthlyGoal),
      avatarUrl: avatarUrl,
      avatarId: avatarId,
      pin: pin || '1234',
      maxDailyEarn: Math.max(0, maxDailyEarn),
      maxMonthlyEarn: Math.max(0, maxMonthlyEarn),
    };

    this.children.push(newChild);
    this.activeChildId = newChild.id;

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'children', newChild.id), newChild).catch(console.error);
    }
    this.notify();
  }

  public updateChildLimits(childId: string, maxDailyEarn: number, maxMonthlyEarn: number) {
    this.children = this.children.map((c) => {
      if (c.id === childId) {
        return {
          ...c,
          maxDailyEarn: Math.max(0, maxDailyEarn),
          maxMonthlyEarn: Math.max(0, maxMonthlyEarn),
        };
      }
      return c;
    });

    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'children', childId), {
        maxDailyEarn: Math.max(0, maxDailyEarn),
        maxMonthlyEarn: Math.max(0, maxMonthlyEarn),
      }).catch(console.error);
    }
    this.notify();
  }

  public updateChildAvatar(childId: string, avatarIdOrUrl: string) {
    let avatarUrl = '';
    let avatarId = '';

    if (avatarIdOrUrl.startsWith('data:') || avatarIdOrUrl.startsWith('http')) {
      avatarUrl = avatarIdOrUrl;
      avatarId = 'custom';
    } else {
      const avatar = MONSTER_AVATARS.find((a) => a.id === avatarIdOrUrl);
      if (avatar) {
        avatarUrl = avatar.url;
        avatarId = avatar.id;
      } else {
        return;
      }
    }

    this.children = this.children.map((c) => {
      if (c.id === childId) {
        return {
          ...c,
          avatarId: avatarId,
          avatarUrl: avatarUrl,
        };
      }
      return c;
    });

    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'children', childId), {
        avatarId: avatarId,
        avatarUrl: avatarUrl,
      }).catch(console.error);
    }
    this.notify();
  }

  public updateChildPin(childId: string, newPin: string) {
    this.children = this.children.map((c) => (c.id === childId ? { ...c, pin: newPin } : c));
    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'children', childId), { pin: newPin }).catch(console.error);
    }
    this.notify();
  }

  public updateChildGoal(childId: string, monthlyGoal: number) {
    this.children = this.children.map((c) => (c.id === childId ? { ...c, monthlyGoal } : c));
    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'children', childId), { monthlyGoal }).catch(console.error);
    }
    this.notify();
  }

  public deleteChild(childId: string) {
    this.children = this.children.filter((c) => c.id !== childId);
    if (this.activeChildId === childId) {
      this.activeChildId = this.children[0]?.id || '';
    }
    if (this.isFirebaseConnected && db) {
      deleteDoc(doc(db, 'children', childId)).catch(console.error);
    }
    this.notify();
  }

  public clearTransactionHistory() {
    this.transactions = [];
    if (this.isFirebaseConnected && db) {
      const txQ = query(collection(db, 'transactions'), where('familyId', '==', this.family.id));
      getDocs(txQ).then((snap) => {
        snap.forEach((d) => deleteDoc(d.ref).catch(console.error));
      }).catch(console.error);
    }
    this.notify();
  }

  // Task catalog management
  public addTask(taskData: Omit<Task, 'id' | 'familyId'>) {
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      familyId: this.family.id,
    };
    this.tasks.push(newTask);

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'tasks', newTask.id), newTask).catch(console.error);
    }
    this.notify();
  }

  public updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'familyId'>>) {
    this.tasks = this.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'tasks', taskId), updates).catch(console.error);
    }
    this.notify();
  }

  public deleteTask(taskId: string) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    if (this.isFirebaseConnected && db) {
      deleteDoc(doc(db, 'tasks', taskId)).catch(console.error);
    }
    this.notify();
  }

  // APPLY REWARD OR PENALTY TO A CHILD
  public applyTaskToChild(childId: string, task: Task) {
    const child = this.children.find((c) => c.id === childId);
    if (!child) return;

    const isReward = task.type === 'positive';
    const coinDelta = isReward ? task.value : -task.value;

    const newBalance = Math.max(0, child.balance + coinDelta);
    
    // XP & Level calculations (10 XP per positive coin)
    const xpGained = isReward ? task.value * 10 : 0;
    const newPoints = child.points + xpGained;
    const newLevel = Math.min(10, Math.floor(newPoints / 100) + 1);

    const leveledUp = newLevel > child.level;

    // Update child state
    this.children = this.children.map((c) => {
      if (c.id === childId) {
        return {
          ...c,
          balance: newBalance,
          points: newPoints,
          level: newLevel,
        };
      }
      return c;
    });

    // Create Transaction record
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      childId,
      familyId: this.family.id,
      amount: coinDelta,
      type: isReward ? 'reward' : 'penalty',
      description: task.name,
      timestamp: new Date().toISOString(),
      isRecoverable: !isReward && task.recoverable,
      recovered: false,
      taskId: task.id,
    };

    this.transactions.unshift(newTx);

    // Create Notification for the kid
    const notifMsg = isReward
      ? `Parabéns ${child.name}! Você ganhou +${task.value} KidCoins por: "${task.name}".`
      : `Multa de ${task.value} KidCoins aplicada: "${task.name}". ${
          task.recoverable ? 'Aproveite a chance para recuperar com bom comportamento!' : ''
        }`;

    const newNotif: ChildNotification = {
      id: `notif_${Date.now()}`,
      childId,
      familyId: this.family.id,
      message: notifMsg,
      type: isReward ? (leveledUp ? 'level_up' : 'success') : 'warning',
      timestamp: new Date().toISOString(),
      read: false,
      amount: coinDelta,
    };

    this.notifications.unshift(newNotif);

    // Sound FX
    if (isReward) {
      if (leveledUp) sound.playLevelUp();
      else sound.playCoin();
    } else {
      sound.playPenalty();
    }

    // Firestore Sync
    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'children', childId), {
        balance: newBalance,
        points: newPoints,
        level: newLevel,
      }).catch(console.error);

      setDoc(doc(db, 'transactions', newTx.id), newTx).catch(console.error);
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.error);
    }

    this.notify();
  }

  // RECOVER / REDEEM PENALTY (Redenção de Multa Recuperável - 50% arredondado para baixo)
  public recoverPenalty(transactionId: string) {
    const tx = this.transactions.find((t) => t.id === transactionId);
    if (!tx || !tx.isRecoverable || tx.recovered) return;

    const child = this.children.find((c) => c.id === tx.childId);
    if (!child) return;

    const lostCoins = Math.abs(tx.amount);
    // Recuperação de 50% do valor perdido, arredondado para o inteiro menor mais próximo (Math.floor)
    const recoveryCoins = Math.floor(lostCoins * 0.5);
    const newBalance = child.balance + recoveryCoins;

    // Mark transaction as recovered
    this.transactions = this.transactions.map((t) => (t.id === transactionId ? { ...t, recovered: true } : t));

    // Update child balance
    this.children = this.children.map((c) => (c.id === child.id ? { ...c, balance: newBalance } : c));

    // Add recovery transaction log
    const recoveryTx: Transaction = {
      id: `tx_${Date.now()}`,
      childId: child.id,
      familyId: this.family.id,
      amount: recoveryCoins,
      type: 'recovery',
      description: `Redenção (50%) / Moedas recuperadas da multa: "${tx.description}"`,
      timestamp: new Date().toISOString(),
    };

    this.transactions.unshift(recoveryTx);

    // Notification
    const newNotif: ChildNotification = {
      id: `notif_${Date.now()}`,
      childId: child.id,
      familyId: this.family.id,
      message: `🎉 Você demonstrou bom comportamento e recuperou +${recoveryCoins} KidCoins (50% da multa)!`,
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
      amount: recoveryCoins,
    };

    this.notifications.unshift(newNotif);

    sound.playRecovery();

    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'transactions', transactionId), { recovered: true }).catch(console.error);
      updateDoc(doc(db, 'children', child.id), { balance: newBalance }).catch(console.error);
      setDoc(doc(db, 'transactions', recoveryTx.id), recoveryTx).catch(console.error);
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.error);
    }

    this.notify();
  }

  // CLOSE MONTHLY STATEMENT (Fechamento Mensal)
  public closeMonthlyStatement(childId: string) {
    const child = this.children.find((c) => c.id === childId);
    if (!child) return;

    const now = new Date();
    const totalCoins = child.balance;
    const totalBrl = totalCoins / this.family.conversionRate;

    const statement: MonthlyStatement = {
      id: `stmt_${Date.now()}`,
      childId,
      familyId: this.family.id,
      month: now.getMonth(),
      year: now.getFullYear(),
      totalCoins,
      totalBrl,
      closingDate: now.toISOString(),
      paidOut: false,
    };

    this.monthlyStatements.unshift(statement);

    // Identify child's previous transactions and validation requests to clear for the new cycle
    const childTransactions = this.transactions.filter((t) => t.childId === childId);
    const childRequests = this.validationRequests.filter((r) => r.childId === childId);

    // Remove transactions and validation requests for this child
    this.transactions = this.transactions.filter((t) => t.childId !== childId);
    this.validationRequests = this.validationRequests.filter((r) => r.childId !== childId);

    // Reset balance to 0 for new cycle
    this.children = this.children.map((c) => (c.id === childId ? { ...c, balance: 0 } : c));

    // Notification
    const newNotif: ChildNotification = {
      id: `notif_${Date.now()}`,
      childId,
      familyId: this.family.id,
      message: `🏆 Fechamento do Mês! Suas ${totalCoins} KidCoins foram convertidas em R$ ${totalBrl.toFixed(2)}! Seu histórico e solicitações foram reiniciados para um novo mês!`,
      type: 'goal',
      timestamp: now.toISOString(),
      read: false,
      amount: 0,
    };

    this.notifications.unshift(newNotif);

    sound.playLevelUp();

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'monthlyStatements', statement.id), statement).catch(console.error);
      updateDoc(doc(db, 'children', childId), { balance: 0 }).catch(console.error);
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.error);

      // Delete child's previous transactions from Firestore
      childTransactions.forEach((t) => {
        deleteDoc(doc(db, 'transactions', t.id)).catch(console.error);
      });

      // Delete child's previous validation requests from Firestore
      childRequests.forEach((r) => {
        deleteDoc(doc(db, 'validationRequests', r.id)).catch(console.error);
      });
    }

    this.notify();
  }

  public markNotificationAsRead(notifId: string) {
    this.notifications = this.notifications.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    if (this.isFirebaseConnected && db) {
      updateDoc(doc(db, 'notifications', notifId), { read: true }).catch(console.error);
    }
    this.notify();
  }

  public getActiveChild(): Child | undefined {
    return this.children.find((c) => c.id === this.activeChildId) || this.children[0];
  }

  // --- VALIDATION REQUEST ACTIONS ---

  public requestTaskValidation(
    childId: string,
    task: { id?: string; name: string; value: number }
  ): ValidationRequest {
    const newReq: ValidationRequest = {
      id: `val_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      childId,
      familyId: this.family.id || 'fam_default',
      taskId: task.id,
      taskName: task.name,
      taskValue: task.value,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    this.validationRequests.unshift(newReq);

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'validationRequests', newReq.id), newReq).catch(console.error);
    }

    this.notify();
    return newReq;
  }

  public approveValidationRequest(requestId: string): boolean {
    const reqIndex = this.validationRequests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) return false;

    const req = this.validationRequests[reqIndex];
    if (req.status !== 'pending') return false;

    // Apply reward to child using store logic
    const taskObj: Task = {
      id: req.taskId || `task_${Date.now()}`,
      familyId: req.familyId,
      name: req.taskName,
      type: 'positive',
      value: req.taskValue,
      category: 'Tarefa Cumprida',
      level: 'leve',
      recoverable: false,
    };

    this.applyTaskToChild(req.childId, taskObj);

    // Update request state
    const updatedReq: ValidationRequest = {
      ...req,
      status: 'approved',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Pais',
    };

    this.validationRequests[reqIndex] = updatedReq;

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'validationRequests', requestId), updatedReq, { merge: true }).catch(console.error);
    }

    this.notify();
    return true;
  }

  public rejectValidationRequest(requestId: string, reason?: string): boolean {
    const reqIndex = this.validationRequests.findIndex((r) => r.id === requestId);
    if (reqIndex === -1) return false;

    const req = this.validationRequests[reqIndex];
    if (req.status !== 'pending') return false;

    const updatedReq: ValidationRequest = {
      ...req,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'Pais',
      rejectionReason: reason?.trim() || undefined,
    };

    this.validationRequests[reqIndex] = updatedReq;

    // Create Notification for child about rejection
    const notifMsg = `Solicitação não aprovada para "${req.taskName}".${
      reason?.trim() ? ` Motivo: ${reason.trim()}` : ' Verifique com seus pais.'
    }`;

    const newNotif: ChildNotification = {
      id: `notif_${Date.now()}`,
      childId: req.childId,
      familyId: req.familyId,
      message: notifMsg,
      type: 'warning',
      timestamp: new Date().toISOString(),
      read: false,
      amount: 0,
    };

    this.notifications.unshift(newNotif);

    if (this.isFirebaseConnected && db) {
      setDoc(doc(db, 'validationRequests', requestId), updatedReq, { merge: true }).catch(console.error);
      setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(console.error);
    }

    this.notify();
    return true;
  }

  public getPendingValidationRequests(): ValidationRequest[] {
    return this.validationRequests.filter((r) => r.status === 'pending');
  }

  public getChildValidationRequests(childId: string): ValidationRequest[] {
    return this.validationRequests.filter((r) => r.childId === childId);
  }

  public deleteValidationRequest(requestId: string): boolean {
    const prevLen = this.validationRequests.length;
    this.validationRequests = this.validationRequests.filter((r) => r.id !== requestId);
    if (this.validationRequests.length !== prevLen) {
      if (this.isFirebaseConnected && db) {
        deleteDoc(doc(db, 'validationRequests', requestId)).catch(console.error);
      }
      this.notify();
      return true;
    }
    return false;
  }

  public clearEvaluatedValidationRequests(): void {
    const toDelete = this.validationRequests.filter((r) => r.status !== 'pending');
    this.validationRequests = this.validationRequests.filter((r) => r.status === 'pending');

    if (this.isFirebaseConnected && db && toDelete.length > 0) {
      toDelete.forEach((r) => {
        deleteDoc(doc(db, 'validationRequests', r.id)).catch(console.error);
      });
    }

    this.notify();
  }

  public deleteMonthlyStatement(statementId: string): boolean {
    const prevLen = this.monthlyStatements.length;
    this.monthlyStatements = this.monthlyStatements.filter((s) => s.id !== statementId);
    if (this.monthlyStatements.length !== prevLen) {
      if (this.isFirebaseConnected && db) {
        deleteDoc(doc(db, 'monthlyStatements', statementId)).catch(console.error);
      }
      this.notify();
      return true;
    }
    return false;
  }

  public clearMonthlyStatements(): void {
    const toDelete = [...this.monthlyStatements];
    this.monthlyStatements = [];

    if (this.isFirebaseConnected && db && toDelete.length > 0) {
      toDelete.forEach((s) => {
        deleteDoc(doc(db, 'monthlyStatements', s.id)).catch(console.error);
      });
    }

    this.notify();
  }
}

export const store = new KidCoinStore();
