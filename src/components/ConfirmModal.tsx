import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, X, Info } from 'lucide-react';
import { sound } from '../lib/audio';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  details?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  details,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    sound.playClick();
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    sound.playClick();
    onClose();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-rose-100 text-rose-600 border border-rose-200',
          icon: Trash2,
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs',
          badgeText: 'Ação Irreversível',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'info':
        return {
          iconBg: 'bg-sky-100 text-sky-600 border border-sky-200',
          icon: Info,
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs',
          badgeText: 'Confirmação Requerida',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-amber-100 text-amber-600 border border-amber-200',
          icon: AlertTriangle,
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs',
          badgeText: 'Atenção Requerida',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  const style = getVariantStyles();
  const IconComponent = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/80 text-slate-800">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <span className={`inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border mb-1 ${style.badgeBg}`}>
              {style.badgeText}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
          {message}
        </p>

        {details && (
          <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
            {details}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs transition-all"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 ${style.confirmBtn}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
