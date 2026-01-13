import { create } from "zustand";

interface AuthState {
  showAuthModal: boolean;
  setShowAuthModal: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  showAuthModal: false,
  setShowAuthModal: (show: boolean) => set({ showAuthModal: show }),
}));

