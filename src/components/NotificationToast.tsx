import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, TrendingUp, AlertTriangle, Trophy, CheckCircle, X } from 'lucide-react';
import { ChildNotification } from '../types';

interface NotificationToastProps {
  notifications: ChildNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  const unreadNotifs = notifications.filter((n) => !n.read).slice(0, 2);

  useEffect(() => {
    const hasGoalOrLevelUp = unreadNotifs.some((n) => n.type === 'goal' || n.type === 'level_up');
    if (hasGoalOrLevelUp) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Fallback if canvas is unavailable
      }
    }
  }, [unreadNotifs]);

  if (unreadNotifs.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {unreadNotifs.map((notif) => {
        const isSuccess = notif.type === 'success' || notif.type === 'level_up' || notif.type === 'goal';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-300 ${
              isSuccess
                ? 'bg-emerald-900/90 text-white border-emerald-500/30'
                : 'bg-rose-900/90 text-white border-rose-500/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {notif.type === 'level_up' ? (
                  <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
                ) : notif.type === 'goal' ? (
                  <Sparkles className="w-6 h-6 text-amber-300" />
                ) : isSuccess ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 pr-6">
                <div className="text-xs font-bold uppercase tracking-wider opacity-80 mb-0.5">
                  {notif.type === 'level_up'
                    ? 'Subiu de Nível!'
                    : notif.type === 'goal'
                    ? 'Meta Alcançada!'
                    : isSuccess
                    ? 'Moedas Recebidas!'
                    : 'Aviso / Multa'}
                </div>
                <p className="text-sm font-medium leading-snug">{notif.message}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {new Date(notif.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <button
                onClick={() => onDismiss(notif.id)}
                className="absolute top-3 right-3 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
