import { create } from 'zustand';

export type AuthModalView = 'login' | 'sign-up';

interface AuthModalStore {
  isOpen: boolean;
  view: AuthModalView;
  onOpen: (view?: AuthModalView) => void;
  onClose: () => void;
  setView: (view: AuthModalView) => void;
}

export const useAuthModal = create<AuthModalStore>((set) => ({
  isOpen: false,
  view: 'login',
  onOpen: (view = 'login') => set({ isOpen: true, view }),
  onClose: () => set({ isOpen: false }),
  setView: (view) => set({ view }),
}));
