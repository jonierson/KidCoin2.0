import React, { useState } from 'react';
import { Coins, Shield, User, Sparkles, Lock, ArrowLeftRight, HelpCircle } from 'lucide-react';
import { store } from '../services/store';
import { Child } from '../types';
import { sound } from '../lib/audio';
import { PinModal } from './PinModal';

interface NavbarProps {
  onOpenAvatarModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAvatarModal }) => {
  const activeChild = store.getActiveChild();
  const children = store.children;
  const isParentMode = store.isParentMode;
  const family = store.family;

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleToggleMode = () => {
    sound.playClick();
    if (!isParentMode) {
      // Prompt for parent PIN to enter Parent Mode
      setIsPinModalOpen(true);
    } else {
      // Exit Parent Mode
      store.setParentMode(false);
    }
  };

  const handleSelectChild = (childId: string) => {
    sound.playClick();
    store.setActiveChild(childId);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 scale-100 hover:scale-105 transition-all">
              <Coins className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                Kid<span className="text-amber-400">Coin</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/50">
                Educação Financeira
              </span>
            </div>
          </div>

          {/* Child Selector & Balance indicator (if in Kid Mode) */}
          {!isParentMode && activeChild && (
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/60 p-1.5 pl-3 rounded-2xl border border-slate-700/60 shadow-inner">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 leading-tight">{activeChild.name}</span>
                <span className="text-[10px] text-amber-400 font-bold">Nível {activeChild.level}</span>
              </div>

              {/* Avatar thumbnail */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAvatarModal?.();
                }}
                className="relative group w-9 h-9 rounded-xl overflow-hidden border border-amber-400/60 bg-slate-800 shrink-0 hover:scale-105 transition-transform"
                title="Personalizar Avatar"
              >
                <img src={activeChild.avatarUrl} alt={activeChild.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </button>

              {/* Quick child switcher dropdown if multiple children */}
              {children.length > 1 && (
                <div className="flex items-center gap-1 border-l border-slate-700/80 pl-2 pr-1">
                  {children.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectChild(c.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                        c.id === activeChild.id
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                      }`}
                    >
                      {c.name[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Controls & Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors hidden sm:flex"
              title="Ajuda / Como funciona"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Mode Toggle Button */}
            <button
              onClick={handleToggleMode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
                isParentMode
                  ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 hover:brightness-105'
                  : 'bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80'
              }`}
            >
              {isParentMode ? (
                <>
                  <Shield className="w-4 h-4 text-slate-950" />
                  <span className="hidden xs:inline">Painel dos Pais</span>
                  <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black">ON</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Modo Pais</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-slate-800 shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Como funciona o KidCoin?
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 mb-6">
              <li>• <strong>Para as Crianças:</strong> Cumpram tarefas para ganhar KidCoins, subam de nível e alcancem a meta mensal!</li>
              <li>• <strong>Multas e Redenção:</strong> Errar faz parte! Se cometer uma falta, você pode recuperar suas moedas demonstrando bom comportamento.</li>
              <li>• <strong>Modo Pais (PIN Pad):</strong> Os pais possuem controle completo para criar tarefas, aplicar multas, aprovar redenções e realizar o fechamento mensal com conversão para Reais (R$).</li>
            </ul>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Entendi, vamos lá!
            </button>
          </div>
        </div>
      )}

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        title="Acesso dos Pais"
        subtitle="Digite o PIN de 4 dígitos para acessar o Painel dos Pais"
        correctPin={family.parentPin || '1234'}
        onSuccess={() => store.setParentMode(true)}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
};
