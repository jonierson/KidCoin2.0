import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  PlusCircle, 
  CheckCircle, 
  AlertOctagon, 
  RotateCcw, 
  FileText, 
  Settings, 
  Trash2, 
  Edit3, 
  DollarSign, 
  Coins, 
  Plus, 
  ShieldCheck, 
  TrendingUp, 
  Lock,
  ChevronRight,
  Sparkles,
  Upload,
  Camera,
  Loader2,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  Gauge
} from 'lucide-react';
import { store } from '../services/store';
import { Task, TaskType, TaskLevel, Child } from '../types';
import { sound } from '../lib/audio';
import { MONSTER_AVATARS } from '../data/avatars';
import { processImageFile } from '../lib/imageUtils';
import { ConfirmModal } from './ConfirmModal';

export const ParentDashboard: React.FC = () => {
  const family = store.family;
  const children = store.children;
  const tasks = store.tasks;
  const transactions = store.transactions;
  const statements = store.monthlyStatements;
  const pendingValidationRequests = store.getPendingValidationRequests();
  const allValidationRequests = store.validationRequests;

  const [activeTab, setActiveTab] = useState<'validations' | 'apply' | 'recoveries' | 'kids' | 'catalog' | 'statements' | 'settings'>('validations');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info';
    details?: React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Rejection Modal State
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    requestId: string;
    taskName: string;
    childName: string;
  }>({
    isOpen: false,
    requestId: '',
    taskName: '',
    childName: '',
  });
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const handleApproveRequest = (reqId: string, taskName: string, childName: string, coinValue: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Validar Tarefa Cumprida',
      message: `Você confirma que ${childName} cumpriu a tarefa "${taskName}"? Serão concedidas +${coinValue} KidCoins para o saldo da criança.`,
      variant: 'info',
      confirmText: `Aprovar e Conceder +${coinValue} KC`,
      onConfirm: () => {
        const ok = store.approveValidationRequest(reqId);
        if (ok) sound.playCoin();
      },
    });
  };

  const handleOpenRejectModal = (reqId: string, taskName: string, childName: string) => {
    setRejectionReasonInput('');
    setRejectModal({
      isOpen: true,
      requestId: reqId,
      taskName,
      childName,
    });
  };

  const handleConfirmRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal.requestId) return;
    store.rejectValidationRequest(rejectModal.requestId, rejectionReasonInput);
    setRejectModal({ isOpen: false, requestId: '', taskName: '', childName: '' });
  };

  const handleClearEvaluatedHistoryClick = () => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Histórico de Solicitações Avaliadas',
      message: 'Tem certeza que deseja apagar todo o histórico de solicitações já validadas ou recusadas? As solicitações pendentes não serão afetadas.',
      variant: 'danger',
      confirmText: 'Excluir Histórico',
      onConfirm: () => {
        store.clearEvaluatedValidationRequests();
      },
    });
  };

  const handleDeleteSingleValidationRequest = (reqId: string, taskName: string) => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Item do Histórico',
      message: `Deseja remover o registro da tarefa "${taskName}" do histórico de avaliações?`,
      variant: 'danger',
      confirmText: 'Excluir Registro',
      onConfirm: () => {
        store.deleteValidationRequest(reqId);
      },
    });
  };

  const handleClearStatementsClick = () => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Histórico de Fechamentos',
      message: 'Tem certeza que deseja apagar todo o histórico de fechamentos mensais anteriores? Os saldos atuais das crianças não serão alterados.',
      variant: 'danger',
      confirmText: 'Excluir Histórico',
      onConfirm: () => {
        store.clearMonthlyStatements();
      },
    });
  };

  const handleDeleteSingleStatement = (statementId: string, childName: string, dateStr: string) => {
    sound.playClick();
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Fechamento',
      message: `Deseja remover do histórico o registro de fechamento de ${childName} realizado em ${dateStr}?`,
      variant: 'danger',
      confirmText: 'Excluir Registro',
      onConfirm: () => {
        store.deleteMonthlyStatement(statementId);
      },
    });
  };

  // Apply Task State
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id || '');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');

  // Add/Edit Task Form State
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('positive');
  const [taskValue, setTaskValue] = useState<number>(3);
  const [taskCategorySelect, setTaskCategorySelect] = useState('Organização');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [taskLevel, setTaskLevel] = useState<TaskLevel>('médio');
  const [taskRecoverable, setTaskRecoverable] = useState(true);

  // Available categories list computed from standard list + existing tasks
  const availableCategories = React.useMemo(() => {
    const defaultCategories = [
      'Organização',
      'Estudos',
      'Saúde & Higiene',
      'Comportamento',
      'Família',
      'Responsabilidade',
      'Regras de Casa',
      'Valores',
      'Autonomia',
    ];
    const fromTasks = tasks.map((t) => t.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...fromTasks]));
  }, [tasks]);

  // Add Child State
  const [newChildName, setNewChildName] = useState('');
  const [newChildPin, setNewChildPin] = useState('1234');
  const [newChildGoal, setNewChildGoal] = useState(100);
  const [newChildAvatar, setNewChildAvatar] = useState(MONSTER_AVATARS[0].id);
  const [newChildMaxDaily, setNewChildMaxDaily] = useState<number>(family.maxDailyEarn ?? 5);
  const [newChildMaxMonthly, setNewChildMaxMonthly] = useState<number>(family.maxMonthlyEarn ?? 150);

  // Edit Child Limits State
  const [editingLimitsChild, setEditingLimitsChild] = useState<Child | null>(null);
  const [editChildMaxDaily, setEditChildMaxDaily] = useState<number>(5);
  const [editChildMaxMonthly, setEditChildMaxMonthly] = useState<number>(150);

  // Photo Upload State & Refs
  const newChildFileInputRef = useRef<HTMLInputElement>(null);
  const editChildFileInputRef = useRef<HTMLInputElement>(null);
  const [editingChildForPhoto, setEditingChildForPhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleNewChildPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const dataUrl = await processImageFile(file);
      setNewChildAvatar(dataUrl);
      sound.playCoin();
    } catch (err) {
      console.error('Error processing photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleEditChildPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingChildForPhoto) return;
    try {
      setIsUploadingPhoto(true);
      const dataUrl = await processImageFile(file);
      store.updateChildAvatar(editingChildForPhoto, dataUrl);
      sound.playCoin();
    } catch (err) {
      console.error('Error updating photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      setEditingChildForPhoto(null);
    }
  };

  // Settings State
  const [newParentPin, setNewParentPin] = useState(family.parentPin || '1234');
  const [newConversionRate, setNewConversionRate] = useState(family.conversionRate || 10);
  const [newMaxDailyEarn, setNewMaxDailyEarn] = useState(family.maxDailyEarn ?? 5);
  const [newMaxMonthlyEarn, setNewMaxMonthlyEarn] = useState(family.maxMonthlyEarn ?? 150);
  const [savedSettingsMsg, setSavedSettingsMsg] = useState(false);

  useEffect(() => {
    setNewParentPin(family.parentPin || '1234');
    setNewConversionRate(family.conversionRate || 10);
    setNewMaxDailyEarn(family.maxDailyEarn ?? 5);
    setNewMaxMonthlyEarn(family.maxMonthlyEarn ?? 150);
  }, [family]);

  // Handlers with Confirmation Modals
  const handleApplyTask = () => {
    if (!selectedChildId || !selectedTaskId) return;
    const child = children.find((c) => c.id === selectedChildId);
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (!child || !task) return;

    const isReward = task.type === 'positive';
    const limitCheck = isReward ? store.checkEarningLimits(child.id, task.value) : null;
    const isExceeded = limitCheck && (limitCheck.exceedsDaily || limitCheck.exceedsMonthly);

    setConfirmModal({
      isOpen: true,
      title: isReward ? `Conceder +${task.value} KidCoins` : `Aplicar Multa de -${task.value} KidCoins`,
      message: isReward
        ? `Você confirma a concessão de +${task.value} KidCoins para ${child.name}? Esta ação alterará o saldo e ficará registrada no extrato.`
        : `Você confirma a aplicação de uma multa de -${task.value} KidCoins para ${child.name}? O saldo será reduzido e a penalidade registrada.`,
      variant: isExceeded ? 'warning' : (isReward ? 'info' : 'warning'),
      confirmText: isReward ? (isExceeded ? 'Autorizar Exceção e Conceder' : 'Conceder Moedas') : 'Aplicar Multa',
      details: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={child.avatarUrl} alt={child.name} className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0" referrerPolicy="no-referrer" />
            <div>
              <div className="font-extrabold text-slate-900">{child.name}</div>
              <div className="text-xs text-slate-500">Saldo Atual: <strong className="text-amber-600">{child.balance} KC</strong></div>
              <div className={`font-bold text-xs mt-0.5 ${isReward ? 'text-emerald-600' : 'text-rose-600'}`}>
                Tarefa: "{task.name}" ({isReward ? `+${task.value}` : `-${task.value}`} KC)
              </div>
            </div>
          </div>

          {isExceeded && limitCheck && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold space-y-1">
              <div className="flex items-center gap-1.5 text-amber-800 font-extrabold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Aviso de Limite de Ganho Ultrapassado</span>
              </div>
              <p className="text-[11px] leading-snug text-amber-900 font-normal">
                {limitCheck.message}
              </p>
              <p className="text-[10px] text-amber-700 italic">
                Como pai, você pode clicar em "Autorizar Exceção" para liberar estas moedas extra se desejar.
              </p>
            </div>
          )}
        </div>
      ),
      onConfirm: () => {
        store.applyTaskToChild(selectedChildId, task);
      },
    });
  };

  const handleDeleteChildClick = (child: Child) => {
    setConfirmModal({
      isOpen: true,
      title: `Excluir Perfil de ${child.name}`,
      message: `🚨 AVISO IRREVERSÍVEL: Tem certeza que deseja apagar permanentemente o perfil de ${child.name}? Todo o saldo de ${child.balance} KidCoins, nível, pontos XP e conquistas serão destruídos e não poderão ser recuperados!`,
      variant: 'danger',
      confirmText: 'Excluir Perfil Definitivamente',
      details: (
        <div className="flex items-center gap-3">
          <img src={child.avatarUrl} alt={child.name} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-300" referrerPolicy="no-referrer" />
          <div>
            <div className="font-extrabold text-slate-900">{child.name}</div>
            <div className="text-xs text-slate-500">Nível {child.level} • {child.points} XP • Saldo: {child.balance} KC</div>
          </div>
        </div>
      ),
      onConfirm: () => {
        store.deleteChild(child.id);
      },
    });
  };

  const handleClearTransactionsClick = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpar Todo o Histórico de Transações',
      message: '🚨 AVISO CRÍTICO: Você está prestes a apagar permanentemente todo o histórico de transações da família. Os registros de recompensas, multas e resgates serão deletados e não poderão ser recuperados.',
      variant: 'danger',
      confirmText: 'Apagar Histórico Completo',
      onConfirm: () => {
        store.clearTransactionHistory();
      },
    });
  };

  const handleCloseStatementClick = (child: Child) => {
    const totalCoins = child.balance;
    const totalBrl = totalCoins / (family.conversionRate || 10);

    setConfirmModal({
      isOpen: true,
      title: `Realizar Fechamento Mensal de ${child.name}`,
      message: `Você confirma o fechamento financeiro do mês para ${child.name}? As ${totalCoins} KidCoins acumuladas serão convertidas em R$ ${totalBrl.toFixed(2)}, o saldo será zerado e as listas de "Minhas Solicitações de Validação" e "Histórico de Moedas" da criança serão reiniciadas para o novo ciclo.`,
      variant: 'warning',
      confirmText: 'Confirmar Fechamento Mensal',
      details: (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
          <div>
            <span className="text-xs text-slate-400 block font-bold">KidCoins a Converter</span>
            <span className="text-lg font-black text-amber-600">{totalCoins} KC</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-bold">Valor Convertido em Reais</span>
            <span className="text-lg font-black text-emerald-600">R$ {totalBrl.toFixed(2)}</span>
          </div>
        </div>
      ),
      onConfirm: () => {
        store.closeMonthlyStatement(child.id);
      },
    });
  };

  const handleDeleteTaskClick = (task: Task) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remover Tarefa do Catálogo',
      message: `Tem certeza que deseja remover a regra/tarefa "${task.name}" do catálogo da família?`,
      variant: 'warning',
      confirmText: 'Remover do Catálogo',
      onConfirm: () => {
        store.deleteTask(task.id);
      },
    });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const resolvedCategory =
      taskCategorySelect === '__custom__'
        ? customCategoryInput.trim() || 'Geral'
        : taskCategorySelect.trim() || 'Geral';

    store.addTask({
      name: taskName.trim(),
      type: taskType,
      value: Number(taskValue),
      category: resolvedCategory,
      level: taskLevel,
      recoverable: taskType === 'negative' ? taskRecoverable : false,
    });

    setTaskName('');
    setTaskValue(3);
    if (taskCategorySelect === '__custom__') {
      setTaskCategorySelect(resolvedCategory);
      setCustomCategoryInput('');
    }
    sound.playCoin();
  };

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;

    store.addChild(
      newChildName.trim(),
      newChildPin,
      newChildAvatar,
      newChildGoal,
      Number(newChildMaxDaily),
      Number(newChildMaxMonthly)
    );
    setNewChildName('');
    sound.playLevelUp();
  };

  const handleSaveChildLimits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimitsChild) return;
    store.updateChildLimits(editingLimitsChild.id, Number(editChildMaxDaily), Number(editChildMaxMonthly));
    setEditingLimitsChild(null);
    sound.playCoin();
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateFamilySettings(
      newParentPin,
      Number(newConversionRate),
      Number(newMaxDailyEarn),
      Number(newMaxMonthlyEarn)
    );
    setSavedSettingsMsg(true);
    sound.playCoin();
    setTimeout(() => setSavedSettingsMsg(false), 3000);
  };

  const recoverableTransactions = transactions.filter((t) => t.isRecoverable && !t.recovered);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            Painel dos Pais
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 text-white">Gestão Financeira e Comportamental</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Recompense bons hábitos, aplique multas educativas e realize o fechamento mensal em Reais (R$).
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl flex items-center gap-3 shrink-0">
          <Coins className="w-8 h-8 text-amber-400" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Taxa de Conversão</span>
            <span className="text-sm font-extrabold text-amber-300">
              {family.conversionRate || 10} KidCoins = R$ 1,00
            </span>
          </div>
        </div>
      </div>

      {/* Top Banner: Pending Task Validations Alert */}
      {pendingValidationRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-amber-950 text-sm flex items-center gap-2">
                <span>{pendingValidationRequests.length} Solicitação(ões) de Validação Pendente(s)!</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                  Ação Necessária
                </span>
              </div>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Seus filhos cumpriram tarefas e estão aguardando sua validação para receber as moedas.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('validations');
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs transition-all shadow-xs shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Ver Solicitações
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none border-b border-slate-200/80">
        {[
          { id: 'validations', label: `Validações (${pendingValidationRequests.length})`, icon: ShieldCheck, badge: pendingValidationRequests.length },
          { id: 'apply', label: 'Aplicar Tarefa/Multa', icon: PlusCircle },
          { id: 'recoveries', label: `Redenção (${recoverableTransactions.length})`, icon: RotateCcw },
          { id: 'kids', label: 'Crianças', icon: Users },
          { id: 'catalog', label: 'Catálogo de Tarefas', icon: Plus },
          { id: 'statements', label: 'Fechamento & Extrato', icon: FileText },
          { id: 'settings', label: 'Configurações', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-800'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 0: VALIDAÇÕES DE TAREFAS */}
      {activeTab === 'validations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  Solicitações de Validação Pendentes
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Quando uma criança realiza uma tarefa e clica em "Pedir Validação", a solicitação aparece aqui com a data, hora e o valor correspondente.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs shrink-0 self-start sm:self-auto border border-amber-200">
                {pendingValidationRequests.length} PENDENTE(S)
              </span>
            </div>

            {pendingValidationRequests.length === 0 ? (
              <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                <div className="font-extrabold text-slate-800 text-sm">Tudo em dia! Nenhuma validação pendente no momento.</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Assim que seu filho clicar em "Pedir Validação" no painel dele, a tarefa e o horário da solicitação serão notificados aqui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingValidationRequests.map((req) => {
                  const child = children.find((c) => c.id === req.childId);
                  const childName = child?.name || 'Criança';
                  const avatarUrl = child?.avatarUrl || MONSTER_AVATARS[0].url;

                  const reqDate = new Date(req.requestedAt);
                  const formattedDateTime = reqDate.toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-white border-2 border-amber-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-3">
                        {/* Header with Child profile & Timestamp */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <img
                              src={avatarUrl}
                              alt={childName}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-black text-slate-900 text-sm">{childName}</div>
                              <div className="text-[11px] font-bold text-amber-600">
                                Saldo atual: {child?.balance || 0} KC
                              </div>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[10px] flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Pendente
                          </span>
                        </div>

                        {/* Task Details */}
                        <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Tarefa Cumprida Solicitada
                          </span>
                          <div className="font-extrabold text-slate-900 text-base flex items-center justify-between gap-2">
                            <span>"{req.taskName}"</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs shrink-0 border border-emerald-200">
                              +{req.taskValue} KC
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500 pt-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Solicitado em: <strong>{formattedDateTime}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => handleOpenRejectModal(req.id, req.taskName, childName)}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-extrabold text-xs transition-all border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          ✕ Não Validar
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id, req.taskName, childName, req.taskValue)}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Validar (+{req.taskValue} KC)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Evaluated History Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Histórico de Solicitações Avaliadas
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Registro de tarefas já validadas ou recusadas.
                </p>
              </div>

              {allValidationRequests.filter((r) => r.status !== 'pending').length > 0 && (
                <button
                  type="button"
                  onClick={handleClearEvaluatedHistoryClick}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
                  title="Excluir todo o histórico de solicitações avaliadas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Histórico
                </button>
              )}
            </div>

            {allValidationRequests.filter((r) => r.status !== 'pending').length === 0 ? (
              <div className="p-4 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl">
                Nenhum histórico de avaliação registrado ainda.
              </div>
            ) : (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {allValidationRequests
                  .filter((r) => r.status !== 'pending')
                  .map((req) => {
                    const child = children.find((c) => c.id === req.childId);
                    const isApproved = req.status === 'approved';
                    const reqDate = new Date(req.requestedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    const revDate = req.reviewedAt ? new Date(req.reviewedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null;

                    return (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs group hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{child?.name || 'Criança'}:</span>
                            <span className="text-slate-800">"{req.taskName}"</span>
                            <span className="font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                              +{req.taskValue} KC
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Solicitado em: {reqDate} {revDate && `• Avaliado em: ${revDate}`}
                          </div>
                          {req.rejectionReason && (
                            <div className="text-[11px] text-rose-700 font-medium bg-rose-50 border border-rose-200 p-1.5 rounded-lg mt-1">
                              Motivo da não validação: "{req.rejectionReason}"
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                          {isApproved ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] border border-emerald-300 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              Validada
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-300 flex items-center gap-1">
                              ✕ Não Validada
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteSingleValidationRequest(req.id, req.taskName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir este registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: APLICAR TAREFA OU MULTA */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-500" />
              Lançar Moedas ou Multa
            </h3>

            {/* Select Child */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Selecione a Criança
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChildId(c.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedChildId === c.id
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/60'
                    }`}
                  >
                    <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <div className={`font-bold text-sm ${selectedChildId === c.id ? 'text-white' : 'text-slate-900'}`}>{c.name}</div>
                      <div className={`text-xs font-extrabold ${selectedChildId === c.id ? 'text-amber-400' : 'text-amber-600'}`}>{c.balance} KC</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Limits Progress Card for Selected Child */}
            {selectedChildId && (() => {
              const selectedChild = children.find((c) => c.id === selectedChildId);
              if (!selectedChild) return null;

              const limits = store.getChildLimits(selectedChild.id);
              const dailyEarned = store.getChildDailyEarned(selectedChild.id);
              const monthlyEarned = store.getChildMonthlyEarned(selectedChild.id);

              const dailyPct = limits.maxDailyEarn > 0 ? Math.min(100, Math.round((dailyEarned / limits.maxDailyEarn) * 100)) : 0;
              const monthlyPct = limits.maxMonthlyEarn > 0 ? Math.min(100, Math.round((monthlyEarned / limits.maxMonthlyEarn) * 100)) : 0;

              return (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-amber-950 font-extrabold">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      Limites Estipulados de Ganho ({selectedChild.name})
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Controle Parental
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Daily limit progress */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Teto Diário:</span>
                        <span className={`font-black ${dailyEarned >= limits.maxDailyEarn && limits.maxDailyEarn > 0 ? 'text-rose-600' : 'text-amber-700'}`}>
                          {dailyEarned} / {limits.maxDailyEarn > 0 ? `${limits.maxDailyEarn} KC` : 'Sem Limite'}
                        </span>
                      </div>
                      {limits.maxDailyEarn > 0 && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${dailyEarned >= limits.maxDailyEarn ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${dailyPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Monthly limit progress */}
                    <div className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">Teto Mensal (30d):</span>
                        <span className={`font-black ${monthlyEarned >= limits.maxMonthlyEarn && limits.maxMonthlyEarn > 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                          {monthlyEarned} / {limits.maxMonthlyEarn > 0 ? `${limits.maxMonthlyEarn} KC` : 'Sem Limite'}
                        </span>
                      </div>
                      {limits.maxMonthlyEarn > 0 && (
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${monthlyEarned >= limits.maxMonthlyEarn ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${monthlyPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Select Task */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                2. Escolha a Tarefa ou Multa
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {tasks.map((t) => {
                  const isPositive = t.type === 'positive';
                  const isSelected = selectedTaskId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? isPositive
                            ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                            : 'border-rose-500 bg-rose-50/80 shadow-xs'
                          : 'border-slate-200/80 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{t.category}</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isPositive ? `+${t.value} KC` : `-${t.value} KC`}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-xs">{t.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleApplyTask}
              disabled={!selectedChildId || !selectedTaskId}
              className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-sm shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-amber-400" />
              Lançar para a Criança Selecionada
            </button>
          </div>

          {/* Quick Stats Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Resumo da Família</h3>
              <div className="space-y-3">
                {children.map((c) => {
                  const brl = c.balance / (family.conversionRate || 10);
                  return (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={c.avatarUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                          <div className="text-xs text-slate-500">Nível {c.level} • PIN: {c.pin}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-extrabold text-amber-600">{c.balance} KC</div>
                        <div className="text-xs text-emerald-600 font-bold">R$ {brl.toFixed(2)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REDENÇÃO DE MULTAS RECUPERÁVEIS */}
      {activeTab === 'recoveries' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-cyan-600" />
              Redenção de Multas (50% de Devolução)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ações corretivas marcadas como "Recuperáveis". Se a criança demonstrou bom comportamento posterior, você pode aprovar a redenção para devolver <strong>50% do valor perdido</strong> (arredondado para baixo).
            </p>
          </div>

          {recoverableTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-slate-50/80 rounded-xl border border-dashed border-slate-200/80 text-sm">
              Nenhuma multa pendente de redenção no momento. Bom trabalho das crianças!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recoverableTransactions.map((tx) => {
                const child = children.find((c) => c.id === tx.childId);
                const lostCoins = Math.abs(tx.amount);
                const recoveryCoins = Math.floor(lostCoins * 0.5);

                return (
                  <div key={tx.id} className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img src={child?.avatarUrl} alt={child?.name} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{child?.name}</div>
                          <div className="text-xs text-slate-500">
                            {new Date(tx.timestamp).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-lg inline-block">
                          -{lostCoins} KC
                        </span>
                        <div className="text-[10px] font-bold text-emerald-700 mt-1">
                          Redenção: +{recoveryCoins} KC
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
                      <div className="text-xs font-bold text-slate-700">Multa Aplicada:</div>
                      <div className="text-sm text-slate-900 font-medium">{tx.description}</div>
                      <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>Recuperação (50%):</span>
                        <span className="font-bold text-emerald-600">
                          +{recoveryCoins} KidCoins {lostCoins % 2 !== 0 && `(de ${lostCoins / 2})`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sound.playClick();
                        setConfirmModal({
                          isOpen: true,
                          title: 'Aprovar Redenção de Multa',
                          message: `Deseja aprovar a recuperação de 50% da multa "${tx.description}" para ${child?.name || 'a criança'}? Serão creditadas +${recoveryCoins} KidCoins ao saldo.`,
                          variant: 'info',
                          confirmText: `Aprovar (+${recoveryCoins} KC)`,
                          onConfirm: () => {
                            store.recoverPenalty(tx.id);
                          },
                        });
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-cyan-400" />
                      Aprovar Redenção (+{recoveryCoins} KC)
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GERENCIAR CRIANÇAS */}
      {activeTab === 'kids' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add Child Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Adicionar Nova Criança
            </h3>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome da Criança</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pedro, Laura..."
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PIN Inicial (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newChildPin}
                  onChange={(e) => setNewChildPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Meta Mensal (KidCoins)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={newChildGoal}
                  onChange={(e) => setNewChildGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Child Earning Limits Inputs */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div>
                  <label className="text-[11px] font-extrabold text-amber-900 block mb-1">Lim. Diário (+KC)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newChildMaxDaily}
                    onChange={(e) => setNewChildMaxDaily(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-extrabold text-amber-900 block mb-1">Lim. Mensal (+KC)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newChildMaxMonthly}
                    onChange={(e) => setNewChildMaxMonthly(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Escolha o Personagem Inicial</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {MONSTER_AVATARS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setNewChildAvatar(avatar.id)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 p-0.5 transition-all ${
                        newChildAvatar === avatar.id ? 'border-slate-900 scale-105 shadow-xs' : 'border-slate-200/80'
                      }`}
                    >
                      <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>

                <input
                  type="file"
                  ref={newChildFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleNewChildPhoto}
                />

                <button
                  type="button"
                  onClick={() => newChildFileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="w-full py-2.5 px-3 rounded-xl bg-amber-50/80 hover:bg-amber-100/80 text-slate-900 border border-amber-200/80 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  {newChildAvatar.startsWith('data:') ? '✓ Foto do Celular Selecionada' : 'Ou Escolher Foto do Celular'}
                </button>

                {newChildAvatar.startsWith('data:') && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <img src={newChildAvatar} alt="Prévia" className="w-8 h-8 rounded-md object-cover" />
                    <span className="text-[11px] font-semibold text-slate-600">Prévia da foto enviada</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
              >
                Cadastrar Perfil
              </button>
            </form>
          </div>

          {/* Children Profiles List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Perfis Cadastrados</h3>

            <input
              type="file"
              ref={editChildFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleEditChildPhoto}
            />

            <div className="space-y-3">
              {children.map((child) => (
                <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img src={child.avatarUrl} alt={child.name} className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        title="Alterar foto do personagem"
                        onClick={() => {
                          setEditingChildForPhoto(child.id);
                          editChildFileInputRef.current?.click();
                        }}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-slate-900 text-amber-400 hover:bg-slate-800 shadow-xs transition-all flex items-center justify-center"
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">{child.name}</h4>
                      <p className="text-xs text-slate-500">
                        PIN: <strong className="font-mono">{child.pin}</strong> • Nível {child.level} ({child.points} XP)
                      </p>
                      <p className="text-xs text-slate-500">
                        Meta Mensal: {child.monthlyGoal} KC (R$ {(child.monthlyGoal / (family.conversionRate || 10)).toFixed(2)})
                      </p>

                      <div className="mt-1.5 p-1.5 px-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-950 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Limites: +{child.maxDailyEarn ?? family.maxDailyEarn ?? 5} KC/dia • +{child.maxMonthlyEarn ?? family.maxMonthlyEarn ?? 150} KC/mês
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLimitsChild(child);
                            setEditChildMaxDaily(child.maxDailyEarn ?? family.maxDailyEarn ?? 5);
                            setEditChildMaxMonthly(child.maxMonthlyEarn ?? family.maxMonthlyEarn ?? 150);
                          }}
                          className="text-amber-700 hover:text-amber-900 underline font-extrabold shrink-0"
                        >
                          Alterar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingChildForPhoto(child.id);
                          editChildFileInputRef.current?.click();
                        }}
                        className="mt-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Alterar Foto do Celular
                      </button>
                    </div>
                  </div>

                  <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-end gap-2">
                    <div>
                      <div className="text-xl font-extrabold text-amber-600">{child.balance} KC</div>
                      <div className="text-xs text-emerald-600 font-bold">
                        R$ {(child.balance / (family.conversionRate || 10)).toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteChildClick(child)}
                      title="Excluir Perfil"
                      className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATÁLOGO DE TAREFAS */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Task Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Criar Nova Tarefa / Regra
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título da Tarefa ou Comportamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arrumar brinquedos, Fazer birra..."
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value as TaskType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="positive">Positiva (Recompensa)</option>
                    <option value="negative">Negativa (Multa)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Valor em KidCoins</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={taskValue}
                    onChange={(e) => setTaskValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={taskCategorySelect}
                    onChange={(e) => {
                      setTaskCategorySelect(e.target.value);
                      if (e.target.value !== '__custom__') {
                        setCustomCategoryInput('');
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">+ Nova Categoria Personalizada...</option>
                  </select>

                  {taskCategorySelect === '__custom__' && (
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="Nome da categoria..."
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      className="mt-2 w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/50 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 animate-fadeIn"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Gravidade / Nível</label>
                  <select
                    value={taskLevel}
                    onChange={(e) => setTaskLevel(e.target.value as TaskLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="leve">Leve</option>
                    <option value="médio">Médio</option>
                    <option value="grave">Grave</option>
                  </select>
                </div>
              </div>

              {taskType === 'negative' && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                      Multa Recuperável?
                    </label>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        taskRecoverable
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {taskRecoverable ? 'Sim (Recuperável)' : 'Não (Definitiva)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTaskRecoverable(true)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        taskRecoverable
                          ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center gap-1.5 text-amber-900">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Sim, Recuperável</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        A criança poderá recuperar as moedas na aba de Redenção.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTaskRecoverable(false)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        !taskRecoverable
                          ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-extrabold text-xs flex items-center gap-1.5 text-rose-900">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Não (Definitiva)</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                        Desconto permanente sem opção de redenção posterior.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                Adicionar ao Catálogo
              </button>
            </form>
          </div>

          {/* Catalog List */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Tarefas do Catálogo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isPos = task.type === 'positive';
                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl p-4 border flex flex-col justify-between bg-white shadow-sm ${
                      isPos ? 'border-slate-200/80 hover:border-emerald-300' : 'border-slate-200/80 hover:border-rose-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">{task.category}</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isPos ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                          }`}
                        >
                          {isPos ? `+${task.value}` : `-${task.value}`} KC
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm mb-1">{task.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                        <span>Nível: {task.level}</span>
                        {!isPos && (
                          task.recoverable ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              • Recuperável
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              • Não Recuperável
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTaskClick(task)}
                      className="mt-3 text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FECHAMENTO MENSAL & EXTRATO */}
      {activeTab === 'statements' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Fechamento Mensal das Crianças
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ao fechar o mês, as KidCoins acumuladas são convertidas em Reais (R$) e zeradas para iniciar o novo ciclo!
                </p>
              </div>

              {transactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearTransactionsClick}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Limpar Histórico de Transações
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {children.map((c) => {
                const totalCoins = c.balance;
                const totalBrl = totalCoins / (family.conversionRate || 10);

                return (
                  <div key={c.id} className="p-5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={c.avatarUrl} alt={c.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">{c.name}</h4>
                        <div className="text-xs text-slate-500">Acumulado no Mês Atual</div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between bg-white p-3 rounded-xl border border-slate-200/80">
                      <div>
                        <span className="text-xs text-slate-400 block font-bold">KidCoins</span>
                        <span className="text-2xl font-black text-amber-600">{totalCoins} KC</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block font-bold">Valor em Reais</span>
                        <span className="text-2xl font-black text-emerald-600">R$ {totalBrl.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCloseStatementClick(c)}
                      disabled={totalCoins === 0}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
                    >
                      Realizar Fechamento Mensal
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Past Statements History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Histórico de Fechamentos Anteriores
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Registro dos fechamentos mensais e valores já convertidos.
                </p>
              </div>

              {statements.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearStatementsClick}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
                  title="Excluir todo o histórico de fechamentos anteriores"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar Histórico
                </button>
              )}
            </div>

            {statements.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm bg-slate-50 rounded-xl">
                Nenhum fechamento registrado ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {statements.map((s) => {
                  const child = children.find((c) => c.id === s.childId);
                  const dateStr = new Date(s.closingDate).toLocaleDateString('pt-BR');
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 group hover:bg-slate-100/70 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{child?.name || 'Criança'}</div>
                        <div className="text-xs text-slate-500">
                          Data: {dateStr}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-black text-amber-600 text-sm">{s.totalCoins} KC</div>
                          <div className="font-bold text-emerald-600 text-xs">R$ {s.totalBrl.toFixed(2)}</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteSingleStatement(s.id, child?.name || 'Criança', dateStr)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir este fechamento do histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CONFIGURAÇÕES DA FAMÍLIA */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-500" />
                Configurações da Família
              </h3>
              <p className="text-xs text-slate-500 mt-1">Altere o PIN de segurança dos pais e a taxa de conversão das moedas.</p>
            </div>

            {savedSettingsMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold">
                ✓ Configurações salvas com sucesso!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">PIN de Acesso dos Pais (4 dígitos)</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newParentPin}
                  onChange={(e) => setNewParentPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Taxa de Conversão (Quantas KidCoins equivalem a R$ 1,00?)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newConversionRate}
                  onChange={(e) => setNewConversionRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Exemplo: Se colocar 10, então 10 KidCoins = R$ 1,00 (1 KC = R$ 0,10).
                </p>
              </div>

              {/* Default Earning Limits */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2 font-extrabold text-xs text-amber-950">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Limites Padrão de Ganho da Família</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Máx. Ganho Diário (+KC/dia)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newMaxDailyEarn}
                      onChange={(e) => setNewMaxDailyEarn(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Ex: +5 KidCoins por dia.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Máx. Ganho Mensal (+KC em 30d)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newMaxMonthlyEarn}
                      onChange={(e) => setNewMaxMonthlyEarn(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Ex: +150 KidCoins em 30 dias.</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs transition-all"
              >
                Salvar Alterações
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/60 rounded-2xl p-6 border border-rose-200/80 space-y-3">
            <h4 className="text-sm font-extrabold text-rose-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Zona de Perigo / Ações Críticas
            </h4>
            <p className="text-xs text-rose-700">
              Gerencie dados sensíveis da conta. Apagar o histórico de transações removerá todos os registros de moedas da família.
            </p>
            <button
              type="button"
              onClick={handleClearTransactionsClick}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Histórico de Transações
            </button>
          </div>
        </div>
      )}

      {/* Edit Child Limits Modal */}
      {editingLimitsChild && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                Ajustar Limites de {editingLimitsChild.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingLimitsChild(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Estabeleça o teto máximo de acúmulo de moedas ganhas por este filho em tarefas e hábitos.
            </p>

            <form onSubmit={handleSaveChildLimits} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Máximo de Ganho Diário (KidCoins/dia)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editChildMaxDaily}
                  onChange={(e) => setEditChildMaxDaily(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Exemplo: Máximo de +5 KC por dia. Digite 0 para sem limite.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Máximo de Ganho Mensal em 30 dias (KidCoins/mês)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editChildMaxMonthly}
                  onChange={(e) => setEditChildMaxMonthly(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">Exemplo: Máximo de +150 KC por 30 dias. Digite 0 para sem limite.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLimitsChild(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-extrabold shadow-xs"
                >
                  Salvar Limites
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-extrabold text-slate-900 text-base">Não Validar Tarefa</h3>
            </div>

            <p className="text-xs text-slate-600">
              Você está recusando a validação de <strong>"{rejectModal.taskName}"</strong> solicitada por <strong>{rejectModal.childName}</strong>. As moedas não serão concedidas.
            </p>

            <form onSubmit={handleConfirmRejection} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Motivo da Não Validação (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ex: A tarefa não foi concluída corretamente ou falta guardar os brinquedos."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Esta mensagem de orientação será enviada para a criança.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModal({ isOpen: false, requestId: '', taskName: '', childName: '' })}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs cursor-pointer"
                >
                  Confirmar Recusa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        details={confirmModal.details}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
