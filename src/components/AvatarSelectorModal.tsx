import React, { useRef, useState } from 'react';
import { X, Sparkles, Check, Upload, Camera, Loader2 } from 'lucide-react';
import { MONSTER_AVATARS } from '../data/avatars';
import { sound } from '../lib/audio';
import { processImageFile } from '../lib/imageUtils';

interface AvatarSelectorModalProps {
  isOpen: boolean;
  currentAvatarId: string;
  onSelectAvatar: (avatarId: string) => void;
  onClose: () => void;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  currentAvatarId,
  onSelectAvatar,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUrl = await processImageFile(file);
      sound.playCoin();
      onSelectAvatar(dataUrl);
      onClose();
    } catch (err) {
      console.error('Error processing uploaded image:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl border border-slate-200/80 text-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Escolher Personagem ou Foto</h3>
            <p className="text-xs text-slate-500">Escolha um avatar da coleção ou envie uma foto do seu celular!</p>
          </div>
        </div>

        {/* Custom Upload Option */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">Foto Personalizada do Celular</div>
              <div className="text-xs text-slate-600">Envie uma foto da galeria ou tire uma foto nova</div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-extrabold shadow-xs transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                Carregando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-amber-400" />
                Escolher da Galeria
              </>
            )}
          </button>
        </div>

        <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
          Coleção de Avatares
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MONSTER_AVATARS.map((avatar) => {
            const isSelected = avatar.id === currentAvatarId;
            return (
              <button
                key={avatar.id}
                onClick={() => {
                  sound.playCoin();
                  onSelectAvatar(avatar.id);
                  onClose();
                }}
                className={`relative group rounded-xl p-3 text-left transition-all duration-200 border ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100/80'
                }`}
              >
                <div className={`w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gradient-to-br ${avatar.bgGradient} p-1`}>
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>{avatar.name}</div>
                <div className={`text-[11px] truncate ${isSelected ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>{avatar.monsterType}</div>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 p-1 rounded-lg shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
