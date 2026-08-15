import React, { useState } from 'react';
import { Lock, KeyRound, X, Check, AlertCircle } from 'lucide-react';
import { sound } from '../lib/audio';

interface PinModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  title,
  subtitle,
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    sound.playClick();
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin.length === 4) {
        if (newPin === correctPin) {
          sound.playCoin();
          onSuccess();
          setPin('');
          onClose();
        } else {
          sound.playPenalty();
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    sound.playClick();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80 text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}

          {/* PIN Indicators */}
          <div className="flex gap-3 my-6">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-10 h-11 rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                    error
                      ? 'border-rose-500 bg-rose-50 text-rose-600 animate-shake'
                      : isFilled
                      ? 'border-slate-900 bg-slate-900 text-amber-400 shadow-xs'
                      : 'border-slate-200/80 bg-slate-50/80 text-slate-400'
                  }`}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 mb-4 bg-rose-50 border border-rose-200/60 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              PIN incorreto. Tente novamente!
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleDigit(num)}
                className="h-12 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200/80 text-slate-800 font-extrabold text-lg transition-all shadow-2xs active:scale-95"
              >
                {num}
              </button>
            ))}
            <div className="h-12"></div>
            <button
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200/80 text-slate-800 font-extrabold text-lg transition-all shadow-2xs active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all flex items-center justify-center shadow-2xs active:scale-95"
            >
              Apagar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
