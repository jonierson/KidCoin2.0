import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KidDashboard } from './components/KidDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { NotificationToast } from './components/NotificationToast';
import { AvatarSelectorModal } from './components/AvatarSelectorModal';
import { store } from './services/store';

export default function App() {
  const [, setTick] = useState(0);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    // Sync with store
    const unsubscribe = store.subscribe(() => {
      setTick((t) => t + 1);
    });

    // Sync with Firestore for real-time data persistence
    store.syncWithFirestore(store.family.id);

    return () => unsubscribe();
  }, []);

  const isParentMode = store.isParentMode;
  const activeChild = store.getActiveChild();
  const notifications = store.notifications;

  const handleSelectAvatar = (avatarId: string) => {
    if (activeChild) {
      store.updateChildAvatar(activeChild.id, avatarId);
    }
  };

  const handleDismissNotification = (notifId: string) => {
    store.markNotificationAsRead(notifId);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-200 selection:text-slate-900 antialiased">
      {/* Header Navigation */}
      <Navbar onOpenAvatarModal={() => setIsAvatarModalOpen(true)} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {isParentMode ? (
          <ParentDashboard />
        ) : (
          <KidDashboard onOpenAvatarModal={() => setIsAvatarModalOpen(true)} />
        )}
      </main>

      {/* Avatar Customization Modal */}
      {activeChild && (
        <AvatarSelectorModal
          isOpen={isAvatarModalOpen}
          currentAvatarId={activeChild.avatarId}
          onSelectAvatar={handleSelectAvatar}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}

      {/* Kid Notifications Overlay */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />
    </div>
  );
}
