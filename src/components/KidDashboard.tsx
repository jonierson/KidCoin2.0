import React, { useState } from 'react';
import { 
  Coins, 
  Sparkles, 
  Trophy, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Flame,
  Award
} from 'lucide-react';
import { store } from '../services/store';
import { Child, Transaction } from '../types';
import { sound } from '../lib/audio';
import confetti from 'canvas-confetti';

interface KidDashboardProps {
  onOpenAvatarModal: () => void;
}

export const KidDashboard: React.FC<KidDashboardProps> = ({ onOpenAvatarModal }) => {
  const activeChild = store.getActiveChild();
  const family = store.family;
  const transactions = store.transactions.filter((t) => t.childId === activeChild?.id);
  const tasks = store.tasks;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [completedFilter, setCompletedFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [requestSubmitted, setRequestSubmitted] = useState<string | null>(null);

  if (!activeChild) {
    return (
      <div className="p-8 text-center text-slate-500">
        Nenhum perfil de criança selecionado.
      </div>
    );
  }

  // Conversion Math
  const conversionRate = family.conversionRate || 10;
  const balanceBrl = activeChild.balance / conversionRate;
  const goalCoins = activeChild.monthlyGoal || 100;
  const goalBrl = goalCoins / conversionRate;
  const goalProgress = Math.min(100, Math.round((activeChild.balance / goalCoins) * 100));

  // XP & Level calculations
  const nextLevelXp = activeChild.level * 100;
  const currentXpInLevel = activeChild.points % 100;

  // Earning Limits math
  const limits = store.getChildLimits(activeChild.id);
  const dailyEarned = store.getChildDailyEarned(activeChild.id);
  const monthlyEarned = store.getChildMonthlyEarned(activeChild.id);

  const dailyPct = limits.maxDailyEarn > 0 ? Math.min(100, Math.round((dailyEarned / limits.maxDailyEarn) * 100)) : 0;
  const monthlyPct = limits.maxMonthlyEarn > 0 ? Math.min(100, Math.round((monthlyEarned / limits.maxMonthlyEarn) * 100)) : 0;

  const getLevelTitle = (level: number) => {
    switch (level) {
      case 1:
        return 'Aprendiz de Poupança';
      case 2:
        return 'Caçador de Moedas';
      case 3:
        return 'Guardião do Cofre';
      case 4:
        return 'Super Economista';
      case 5:
        return 'Mestre do Porquinho';
      default:
        return 'Lenda Financeira';
    }
  };

  const handleRequestCompletion = (task: { id?: string; name: string; value: number }) => {
    store.requestTaskValidation(activeChild.id, task);
    sound.playCoin();
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
    } catch {}

    setRequestSubmitted(task.name);
    setTimeout(() => setRequestSubmitted(null), 4000);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (completedFilter === 'positive') return t.amount > 0;
    if (completedFilter === 'negative') return t.amount < 0;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Profile & Balance Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        {/* Background subtle glowing accents */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Avatar & Level Bio */}
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-5 w-full md:w-auto">
            {/* Monster Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-slate-800 shadow-lg transition-transform duration-300 group-hover:scale-105">
                <img
                  src={activeChild.avatarUrl}
                  alt={activeChild.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Edit Avatar Floating Badge */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAvatarModal();
                }}
                className="absolute -bottom-2 -right-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-2.5 py-1 rounded-lg shadow-md font-extrabold text-xs flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                title="Trocar Personagem"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Mudar</span>
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Nível {activeChild.level}
                </span>
                <span className="text-xs font-semibold text-slate-300">{getLevelTitle(activeChild.level)}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
                Olá, {activeChild.name}! 👋
              </h1>

              {/* XP Progress Bar */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Progresso de Nível</span>
                  <span className="text-amber-400 font-bold">{currentXpInLevel}/100 XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${currentXpInLevel}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Big Coin Counter Card */}
          <div className="w-full md:w-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 flex flex-col items-center md:items-end justify-center shadow-sm min-w-[240px]">
            <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1">
              <Coins className="w-4 h-4 text-amber-400" /> Meu Saldo KidCoins
            </span>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-amber-400">
                {activeChild.balance}
              </span>
              <span className="text-xl font-bold text-amber-300">KC</span>
            </div>

            <div className="mt-2 text-xs font-semibold text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <span>Equivale a:</span>
              <strong className="text-sm text-white">R$ {balanceBrl.toFixed(2).replace('.', ',')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Progress Banner (Meta Mensal) */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Meta do Mês no Porquinho</h2>
              <p className="text-xs text-slate-500">
                Junte {goalCoins} KidCoins (R$ {goalBrl.toFixed(2).replace('.', ',')}) até o fim do mês!
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-slate-900">{goalProgress}%</span>
            <span className="text-xs text-slate-500 block font-medium">alcançado</span>
          </div>
        </div>

        {/* Goal Bar */}
        <div className="relative w-full h-3.5 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 transition-all duration-700 shadow-xs"
            style={{ width: `${goalProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-xs font-semibold text-slate-500">
          <span>0 KC</span>
          <span>{goalCoins} KC (R$ {goalBrl.toFixed(2).replace('.', ',')})</span>
        </div>
      </div>

      {/* Earning Limits Cards (Daily and Monthly) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Limit Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm shrink-0">
                ⚡
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Teto Diário de Ganho</h3>
                <p className="text-sm font-extrabold text-slate-900">
                  {dailyEarned} de {limits.maxDailyEarn > 0 ? `${limits.maxDailyEarn} KC hoje` : 'Sem Limite'}
                </p>
              </div>
            </div>
            {limits.maxDailyEarn > 0 && dailyEarned >= limits.maxDailyEarn && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Limite Atingido
              </span>
            )}
          </div>
          {limits.maxDailyEarn > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${dailyEarned >= limits.maxDailyEarn ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>{dailyPct}% do limite</span>
                <span>Restam {Math.max(0, limits.maxDailyEarn - dailyEarned)} KC hoje</span>
              </div>
            </div>
          )}
        </div>

        {/* Monthly Limit Card */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
                📅
              </div>
              <div>
                <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Teto Mensal (30 Dias)</h3>
                <p className="text-sm font-extrabold text-slate-900">
                  {monthlyEarned} de {limits.maxMonthlyEarn > 0 ? `${limits.maxMonthlyEarn} KC em 30d` : 'Sem Limite'}
                </p>
              </div>
            </div>
            {limits.maxMonthlyEarn > 0 && monthlyEarned >= limits.maxMonthlyEarn && (
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                Teto Mensal
              </span>
            )}
          </div>
          {limits.maxMonthlyEarn > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${monthlyEarned >= limits.maxMonthlyEarn ? 'bg-indigo-600' : 'bg-indigo-500'}`}
                  style={{ width: `${monthlyPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>{monthlyPct}% do teto 30 dias</span>
                <span>Restam {Math.max(0, limits.maxMonthlyEarn - monthlyEarned)} KC</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Tasks Request + Transaction Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks Catalog for Kids */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              Ações e Atitudes
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{tasks.length} disponíveis</span>
          </div>

          {requestSubmitted && (
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Solicitação enviada para os pais: <strong>"{requestSubmitted}"</strong>! Aguarde a aprovação.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {tasks.map((task) => {
              const isPositive = task.type === 'positive';
              const childReqs = store.getChildValidationRequests(activeChild.id);
              const pendingReq = isPositive ? childReqs.find((r) => (r.taskId === task.id || r.taskName === task.name) && r.status === 'pending') : null;

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl p-4 border transition-all flex flex-col justify-between bg-white shadow-sm hover:shadow ${
                    isPositive
                      ? 'border-slate-200/80 hover:border-emerald-300'
                      : 'border-slate-200/80 hover:border-rose-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                        {task.category}
                      </span>
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}
                      >
                        {isPositive ? `+${task.value} KC` : `-${task.value} KC`}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mb-1">{task.name}</h4>
                    {!isPositive && (
                      <p className="text-[11px] text-slate-500 italic mb-2">
                        {task.recoverable ? '⚠️ Multa com chance de redenção!' : '⚠️ Fique atento com as regras!'}
                      </p>
                    )}
                  </div>

                  {isPositive && (
                    pendingReq ? (
                      <div className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
                        <span>Aguardando Validação dos Pais</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRequestCompletion(task)}
                        className="mt-3 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Pedir Validação
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Child's Request History Section */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Minhas Solicitações de Validação
              </h4>
              <span className="text-[11px] font-bold text-slate-500">
                {store.getChildValidationRequests(activeChild.id).length} solicitações
              </span>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs space-y-2 max-h-[280px] overflow-y-auto">
              {store.getChildValidationRequests(activeChild.id).length === 0 ? (
                <div className="p-6 text-center text-xs font-medium text-slate-400">
                  Você ainda não fez nenhuma solicitação de validação. Clique em "Pedir Validação" ao cumprir uma tarefa!
                </div>
              ) : (
                store.getChildValidationRequests(activeChild.id).map((req) => {
                  const reqDate = new Date(req.requestedAt);
                  const formattedDate = reqDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{req.taskName}</span>
                          <span className="text-emerald-700 font-extrabold bg-emerald-100/80 px-1.5 py-0.5 rounded-md text-[10px]">
                            +{req.taskValue} KC
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          Solicitado em: {formattedDate}
                        </div>
                        {req.rejectionReason && (
                          <div className="text-[10px] font-medium text-rose-600 bg-rose-50 border border-rose-200/60 p-1.5 rounded-md mt-1">
                            Motivo dos pais: "{req.rejectionReason}"
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                            Pendente
                          </span>
                        )}
                        {req.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Aprovada
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[10px] flex items-center gap-1">
                            ✕ Não Validada
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Transaction History / Feed */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Histórico de Moedas
            </h3>

            {/* Filter Toggle */}
            <div className="flex gap-1 bg-slate-200/60 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
              <button
                onClick={() => setCompletedFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  completedFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Tudo
              </button>
              <button
                onClick={() => setCompletedFilter('positive')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  completedFilter === 'positive' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Ganhos
              </button>
              <button
                onClick={() => setCompletedFilter('negative')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  completedFilter === 'negative' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                Multas
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhum registro encontrado ainda. Cumpre tarefas para ganhar suas primeiras KidCoins!
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                const isRecovery = tx.type === 'recovery';

                return (
                  <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isRecovery
                            ? 'bg-cyan-50 text-cyan-600 border border-cyan-200/60'
                            : isPositive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`}
                      >
                        {isRecovery ? (
                          <RotateCcw className="w-4 h-4" />
                        ) : isPositive ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-snug">{tx.description}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {new Date(tx.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>

                        {tx.isRecoverable && (
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.recovered ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {tx.recovered ? '✓ Multa Recuperada!' : '⚠️ Multa Recuperável'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`font-black text-sm whitespace-nowrap ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isPositive ? `+${tx.amount}` : tx.amount} KC
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
